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
  const stationPairAndDateCombinations = getStationPairAndDateCombinations();
  for (const c of stationPairAndDateCombinations) {
    console.log(c);
    runPuppeteer(pgPool, redisClient, c);
    await sleep(70 * 1000);
  }
}
x();
setInterval(x, 7200 * 1000);

// latebird
// runPuppeteer(pgPool, redisClient);
// setInterval(() => {
//   runPuppeteer(pgPool, redisClient);
// }, crawlPerSecond * 1000);
