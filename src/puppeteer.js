import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

import constants from './constants';
// import Ticket from './ticket';

async function runPuppeteer(redisClient) {
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
    'https://www.latebird.co/thsr_tickets/search?utf8=%E2%9C%93&thsr_ticket%5Bfrom_id%5D=1&thsr_ticket%5Bto_id%5D=4&thsr_ticket%5Bdepart_date%5D=2022-03-20&commit=%E6%90%9C%E5%B0%8B'
  );

  // get ticket count
  // const tableSelector = 'div > table > tbody';
  // const ticketsLength = await page.$$eval(
  //   `${tableSelector} > tr`,
  //   (elements) => {
  //     let counter = 0;
  //     Array.from(elements, (row) => {
  //       if (row.className !== 'success') counter += 1;
  //     });
  //     return counter;
  //   },
  // );
  // console.log(ticketsLength);

  // get data and insert to redis
  const allTickets = await page.evaluate((csts) => {
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
  for (const ticket of allTickets) {
    console.log(ticket);
    const id = uuidv4();
    await redisClient.set(id, JSON.stringify(ticket), {
      EX: 30,
      NX: true,
    });
    const value = await redisClient.get(id);
    console.log(JSON.parse(value));
  }

  await browser.close();
}

export default runPuppeteer;
