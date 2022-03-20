import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

import constants from './constants';
import config from './config';

// import Ticket from './ticket';

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

  // https://www.latebird.co/thsr_tickets
  await page.goto(
    'https://www.latebird.co/thsr_tickets/search?utf8=%E2%9C%93&thsr_ticket%5Bfrom_id%5D=1&thsr_ticket%5Bto_id%5D=4&thsr_ticket%5Bdepart_date%5D=2022-03-20&commit=%E6%90%9C%E5%B0%8B',
  );

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

      const res = pgPool.query(
        `
        INSERT INTO tickets
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          id,
          ticketEntity.stationPair,
          ticketEntity.departureTime,
          ticketEntity.discount,
          ticketEntity.stock,
        ],
      );

      redisClient.set(id, JSON.stringify(ticket), {
        EX: config.redis.expireTime,
        NX: true,
      });
    }),
  ).catch((e) => console.error(e));
}

const ticketDiscountAndPercentOffMapping = {
  '9折': 10,
  早鳥9折: 10,
  '8折': 20,
  早鳥8折: 20,
  '65折': 35,
  早鳥65折: 35,
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
