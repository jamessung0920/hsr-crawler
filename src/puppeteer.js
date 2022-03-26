import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import constants from './constants';
import config from './config';
import ticketRepo from './repository/ticket';

async function runPuppeteer(pgPool, redisClient) {
  // 1. puppeteer FATAL:zygote_host_impl_linux.cc(191)] Check failed:
  // can check reference (https://github.com/Zenika/alpine-chrome/issues/152, https://github.com/Zenika/alpine-chrome/issues/33)
  // 2. be careful with --no-sandbox (https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox)
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  }); // manual add executablePath example: { executablePath: '/usr/bin/chromium-browser' }
  const page = await browser.newPage();

  page.on('console', (msg) => console.log(msg.text()));

  await page.goto('https://www.latebird.co/thsr_tickets', {
    timeout: 0,
  });

  // get data and insert to redis
  const rawTickets = await page.evaluate((csts) => {
    let isNextRowTitle;
    let currentDate;
    const tickets = [];
    const elements = document.querySelectorAll('table tr');
    for (const row of elements) {
      const columns = row.querySelectorAll('td');
      const ticketObj = {
        stationPair: '',
        date: '',
        time: '',
        stock: '',
        price: '',
        discount: '',
      };
      if (row.className === 'success') {
        isNextRowTitle = true;
        currentDate = columns[0].innerText;
        continue;
      }
      if (isNextRowTitle === true) {
        isNextRowTitle = false;
        continue;
      }

      for (const [idx, column] of columns.entries()) {
        const columnText = column.innerText;
        switch (idx) {
          case csts.LATEBIRD.STATION_INDEX:
            ticketObj.stationPair = columnText;
            break;
          case csts.LATEBIRD.TIME_INDEX:
            ticketObj.time = columnText;
            break;
          case csts.LATEBIRD.STOCK_INDEX:
            ticketObj.stock = columnText;
            break;
          case csts.LATEBIRD.PRICE_INDEX:
            ticketObj.price = columnText;
            break;
          case csts.LATEBIRD.DISCOUNT_INDEX:
            ticketObj.discount = columnText;
            break;
          case csts.LATEBIRD.DETAIL_INDEX:
            ticketObj.detailUrl = column.querySelector('a').href;
            break;
          default:
            break;
        }
      }
      ticketObj.date = currentDate;
      tickets.push(ticketObj);
    }
    return tickets;
  }, constants);

  await browser.close();

  Promise.all(
    rawTickets.map((ticket) => {
      const id = uuidv4();
      const ticketEntity = transformTicketData(ticket);

      ticketRepo.insertTicket(pgPool, id, ticketEntity);

      redisClient.set(id, JSON.stringify(ticket), {
        EX: config.redis.expireTime,
        NX: true,
      });
    }),
  ).catch((err) => console.error(err));
}

const ticketDiscountAndPercentOffMapping = {
  '9折': 10,
  早鳥9折: 10,
  '8折': 20,
  早鳥8折: 20,
  '65折': 35,
  早鳥65折: 35,
  原價: 0,
};

// transform ticket data to fit database schema
function transformTicketData(ticket) {
  const ticketDate = ticket.date.split('(')[0];
  const ticketDepartureTime = ticket.time.split('-')[0];
  return {
    stationPair: ticket.stationPair.replace(/\s+/g, ''),
    departureTime: new Date(`${ticketDate} ${ticketDepartureTime} UTC+8`),
    discount: ticketDiscountAndPercentOffMapping[ticket.discount],
    stock: parseInt(ticket.stock, 10),
  };
}

export default runPuppeteer;
