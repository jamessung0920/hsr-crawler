import express from 'express';
import runPuppeteer from './puppeteer';
import handleLineWebhook from './webhook';
import initPostgres from './postgres';
import initRedis from './redis';

const pgPool = initPostgres();

const redisClient = await initRedis();

// const redisClient = await initRedis();
// redisClient.subscribe('__keyevent@0__:expired');
// redisClient.on('message', async (channel, message) => {
//   // Handle event
//   console.log(channel, message);
// });

runPuppeteer(pgPool, redisClient);

const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  handleLineWebhook(req, pgPool, redisClient);
});

app.listen(3000, () => console.log('app listening on port 3000!'));
