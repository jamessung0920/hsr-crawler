import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { v4 as uuidv4 } from 'uuid';
import crawlSiteData from './crawlSiteData';
import config from './config';
import ticketRepo from './repository/ticket';

puppeteer.use(StealthPlugin());

async function runPuppeteer(
  pgPool,
  redisClient,
  stationPairAndDateCombination,
) {
  const { ip: proxyIp, port: proxyPort } = config.upstreamProxy;
  const { expireTimeOfficial } = config.redis;
  let browser;
  let tickets = [];

  try {
    console.log('launch');
    browser = await puppeteer.launch({
      // headless: false,
      args: [
        '--no-sandbox',
        // '--disable-setuid-sandbox',
        // '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-gl-drawing-for-tests',
        `--proxy-server=http://${proxyIp}:${proxyPort}`,
      ],
      // devtools: true,
    });

    tickets = await crawlSiteData(browser, ...stationPairAndDateCombination);
  } catch (err) {
    console.error('======================== error ========================');
    console.error('catch err');
    console.error(err);
    console.error('=======================================================');
  } finally {
    console.log('close browser');
    await browser?.close();
  }

  Promise.all(
    tickets.map(async (ticket) => {
      const id = uuidv4();
      const ticketEntity = transformTicketData(ticket);

      await Promise.all([
        ticketRepo.insertTicket(pgPool, id, ticketEntity),
        redisClient.set(id, JSON.stringify(ticket), {
          EX: expireTimeOfficial,
          NX: true,
        }),
      ]);
    }),
  ).catch((err) => console.error(err));
}

const ticketDiscountAndPercentOffMapping = {
  早鳥9折: 10,
  早鳥8折: 20,
  早鳥65折: 35,
};

// transform ticket data to fit database schema
function transformTicketData(ticket) {
  const ticketDate = ticket.date.split('(')[0];
  const ticketDepartureTime = ticket.time.split('-')[0];
  return {
    stationPair: ticket.stationPair.replace(/\s+/g, ''),
    departureTime: new Date(`${ticketDate} ${ticketDepartureTime} UTC+8`),
    discount: ticketDiscountAndPercentOffMapping[ticket.discount] ?? 0,
    stock: parseInt(ticket.stock, 10),
    origin: 'official',
  };
}

export default runPuppeteer;
