import util from 'util';
import express from 'express';
import isTicketId from 'validator/lib/isUUID';
import config from './config';
// import runPuppeteer from './puppeteer';
import runPuppeteer from './puppeteerOfficialAsync';
import handleLineWebhook from './webhook';
import initPostgres from './postgres';
import initRedis from './redis';
import ticketRepo from './repository/ticket';
import getStationPairAndDateCombinations from './utils/getStationPairAndDateCombinations';
import arrayShuffle from './utils/arrayShuffle';

const sleep = util.promisify(setTimeout);

// setup db and redis server
const pgPool = initPostgres();

const redisClient = await initRedis();

// https://redis.io/topics/notifications
const redisKeyEventClient = redisClient.duplicate();
await redisKeyEventClient.connect();
await redisKeyEventClient.subscribe('__keyevent@0__:expired', async (key) => {
  if (isTicketId(key, 4)) {
    ticketRepo.deleteTicketById(pgPool, key);
  }
});

// setup webhook
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  handleLineWebhook(req, pgPool, redisClient);
  res.sendStatus(200);
});

app.listen(3000, () => console.log('app listening on port 3000!'));

// global event
process.on('uncaughtException', (err) => {
  console.log('uncaughtException');
  console.log(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('unhandledRejection');
  console.log(reason, p);
});

// run crawler
const crawlPerSecond = parseInt(config.puppeteer.crawlPeriod, 10) || 600;

// official
async function x() {
  /* eslint-disable no-await-in-loop */
  const combis = getStationPairAndDateCombinations();
  const proxyIps = config.upstreamProxy.ips.split('|');
  for (; combis.length > 0; combis.splice(0, 2)) {
    const [ip1, ip2] = arrayShuffle(proxyIps);
    const [c1, c2] = combis;
    console.log(ip1, ip2, combis.length);
    await Promise.all([
      runPuppeteer(pgPool, redisClient, c1, ip1),
      sleep((8 + Math.floor(Math.random() * 5)) * 1000).then(async () => {
        if (c2) await runPuppeteer(pgPool, redisClient, c2, ip2);
      }),
    ]);
    await sleep((9 + Math.floor(Math.random() * 5)) * 1000);
  }
  console.log('finish this period');
}
x();
setInterval(x, 3600 * 1000);

// latebird
// runPuppeteer(pgPool, redisClient);
// setInterval(() => {
//   runPuppeteer(pgPool, redisClient);
// }, crawlPerSecond * 1000);
