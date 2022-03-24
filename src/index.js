import { promisify } from 'util';
import express from 'express';
import config from './config';
import runPuppeteer from './puppeteer';
import handleLineWebhook from './webhook';
import initPostgres from './postgres';
import initRedis from './redis';
import ticketRepo from './repository/ticket';

const pgPool = initPostgres();

const redisClient = await initRedis();

// https://redis.io/topics/notifications
const redisKeyEventClient = redisClient.duplicate();
await redisKeyEventClient.connect();
await redisKeyEventClient.subscribe('__keyevent@0__:expired', async (key) => {
  ticketRepo.deleteTicketById(pgPool, key);
});

const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  handleLineWebhook(req, pgPool, redisClient);
});

app.listen(3000, () => console.log('app listening on port 3000!'));

const sleep = promisify(setTimeout);
while (true) {
  runPuppeteer(pgPool, redisClient);
  await sleep(config.puppeteer.crawlPeriod * 1000);
}
