import { promisify } from 'util';
import express from 'express';
import ProxyChain from 'proxy-chain';
import isTicketId from 'validator/lib/isUUID';
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
  if (isTicketId(key, 4)) {
    ticketRepo.deleteTicketById(pgPool, key);
  }
});

const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  handleLineWebhook(req, pgPool, redisClient);
  res.sendStatus(200);
});

app.listen(3000, () => console.log('app listening on port 3000!'));

const { port, upstreamProxyIps, upstreamProxyUsername, upstreamProxyPassword } =
  config.proxy;
const ipRotatorServer = new ProxyChain.Server({
  port,
  verbose: true,
  prepareRequestFunction: ({
    request,
    username,
    password,
    hostname,
    port,
    isHttp,
    connectionId,
  }) => {
    const availableProxyIps = upstreamProxyIps.split(', ');
    const currentUpstreamProxyIp =
      availableProxyIps[(availableProxyIps.length * Math.random()) | 0];
    console.log(currentUpstreamProxyIp);

    return {
      requestAuthentication: false,
      upstreamProxyUrl: `http://${upstreamProxyUsername}:${upstreamProxyPassword}@${currentUpstreamProxyIp}:3128`,
      failMsg: 'Bad username or password, please try again.',
    };
  },
});

ipRotatorServer.listen(() => {
  console.log(`Proxy server is listening on port ${port}`);
});

// Emitted when HTTP connection is closed
ipRotatorServer.on('connectionClosed', ({ connectionId, stats }) => {
  console.log(`Connection ${connectionId} closed`);
  console.dir(stats);
});

// Emitted when HTTP request fails
ipRotatorServer.on('requestFailed', ({ request, error }) => {
  console.log(`Request ${request.url} failed`);
  console.error(error);
});

process.on('uncaughtException', (err) => {
  console.log('uncaughtException');
  console.log(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('unhandledRejection');
  console.log(reason, p);
});

const sleep = promisify(setTimeout);
while (true) {
  runPuppeteer(pgPool, redisClient);
  await sleep(config.puppeteer.crawlPeriod * 1000);
}
