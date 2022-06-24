import util from 'util';
import getStationPairAndDateCombinations from '../utils/getStationPairAndDateCombinations';
import arrayShuffle from '../utils/arrayShuffle';
import runPuppeteer from './puppeteerOfficialAsync';
import config from '../config';
import initPostgres from '../postgres';
import initRedis from '../redis';
// import runPuppeteer from './puppeteer';

const sleep = util.promisify(setTimeout);

// setup db and redis server
const pgPool = initPostgres();

const redisClient = await initRedis();

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
  for (; combis.length > 0; combis.splice(0, 1)) {
    const [ip] = arrayShuffle(proxyIps);
    const [c] = combis;
    console.log(ip, combis.length);
    runPuppeteer(pgPool, redisClient, c, ip);
    await sleep((10 + Math.floor(Math.random() * 8)) * 1000);
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
