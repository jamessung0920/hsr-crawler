/* eslint-disable no-await-in-loop */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import retry from './utils/retry';
import config from './config';
import constants from './constants';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

/**
 *
 * @param {import('puppeteer').Browser} browser
 */
async function crawlSiteData(
  browser,
  startStation,
  destinationStation,
  depatureDate,
) {
  const { username: proxyUsername, password: proxyPassword } =
    config.upstreamProxy;
  const {
    START_STATION_DROPDOWN_VALUE_MAPPING: startStnToValue,
    DESTINATION_STATION_DROPDOWN_VALUE_MAPPING: desStnToValue,
  } = constants.OFFICIAL;
  const formattedDepartureDate = genFormattedDepartureDate(depatureDate);
  console.log(startStation, destinationStation, depatureDate);
  console.log(formattedDepartureDate);

  const page = (await browser.pages())[0];

  // page.on('console', (msg) => console.log(msg.text()));

  const websiteUrl = 'https://irs.thsrc.com.tw/IMINT/?locale=tw';
  const referer = 'https://www.thsrc.com.tw/';
  const UA = pickUserAgent();
  console.log(UA);
  const cookie = {
    name: 'AcceptIRSCookiePolicyTime',
    value:
      'Wed%20May%2011%202022%2017:21:15%20GMT+0800%20(Taipei%20Standard%20Time)',
    url: websiteUrl,
  };
  // const cookieFilePath = path.resolve(__dirname, '../cookies.json');
  // const cookiesBuf = fs.readFileSync(cookieFilePath);
  // const cookies = JSON.parse(cookiesBuf);

  await page.setViewport({
    width: 1800 + Math.floor(Math.random() * 200),
    height: 1200 + Math.floor(Math.random() * 120),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });
  await page.setUserAgent(UA);
  await page.setJavaScriptEnabled(true);
  await page.setCookie(cookie);
  // if (Array.isArray(cookies) && cookies.length > 0) {
  //   console.log('set cookies');
  //   await page.setCookie(...cookies);
  // }
  // await page.setExtraHTTPHeaders({
  //   'Cache-Control': 'max-age=0',
  //   'Sec-Fetch-Site': 'same-site',
  //   'Sec-GPC': '1',
  // });

  // await page.setRequestInterception(true);
  // page.on('request', async (request) => {
  //   const headers = { ...request.headers(), 'Cache-Control': 'max-age=0'};
  //   request.continue({ headers });
  // });

  await page.authenticate({ username: proxyUsername, password: proxyPassword });
  console.log('Visit site');
  await retry(() => page.goto(websiteUrl, { timeout: 9000, referer }), 9000, 2);
  console.log('Start get site data');

  await page.waitForTimeout(500 + Math.floor(Math.random() * 500));

  // if (Array.isArray(cookies) && cookies.length === 0) {
  //   console.log('click cookie accept button');
  //   await page.waitForSelector('#cookieAccpetBtn');
  //   await page.click('#cookieAccpetBtn');
  // }
  // const freshCookies = await page.cookies();
  // fs.writeFileSync(cookieFilePath, JSON.stringify(freshCookies, null, 2));

  await page.waitForTimeout(1500 + Math.floor(Math.random() * 500));
  await page.waitForSelector('#BookingS1Form');
  await page.select('#BookingS1Form_tripCon_typesoftrip', '1');
  await page.waitForTimeout(500 + Math.floor(Math.random() * 500));
  await page.select(
    'select[name="selectStartStation"]',
    startStnToValue[startStation],
  );
  await page.waitForTimeout(1500 + Math.floor(Math.random() * 500));
  await page.select(
    'select[name="selectDestinationStation"]',
    desStnToValue[destinationStation],
  );

  await page.waitForTimeout(2000 + Math.floor(Math.random() * 500));
  let depatureDateSltr = `.flatpickr-days span:not(.hidden)[aria-label="${formattedDepartureDate['en-us']}"]`;
  await page
    .$eval(depatureDateSltr, (span) => span.click())
    .catch(async (err) => {
      console.error(err.message);
      depatureDateSltr = `.flatpickr-days span:not(.hidden)[aria-label="${formattedDepartureDate['zh-tw']}"]`;
      await page.$eval(depatureDateSltr, (span) => span.click());
    });
  await page.waitForTimeout(1500 + Math.floor(Math.random() * 500));
  await page.select('select[name="toTimeTable"]', '1201A');
  await page.waitForTimeout(1000 + Math.floor(Math.random() * 500));
  await page.$$eval(depatureDateSltr, (spans) => spans[1].click());
  await page.waitForTimeout(1000 + Math.floor(Math.random() * 500));
  await page.select('select[name="backTimeTable"]', '500A');

  await retry(
    async () => {
      await page.waitForTimeout(1500 + Math.floor(Math.random() * 500));

      const ticketAmountSltr = 'select[name="ticketPanel:rows:0:ticketAmount';
      await page.waitForSelector(ticketAmountSltr, { timeout: 5000 });
      await page.select(ticketAmountSltr, '1F');

      await captchaProcess(page);
      console.log('load');

      const errSltr = '#feedMSG span';
      await page.waitForSelector(errSltr, { timeout: 5000 });
      const errSpanClassName = await page.$eval(errSltr, (s) => s.className);
      if (errSpanClassName === 'error') {
        await renewCaptchaImg(page);
        throw new Error('captcha recognition fail. recognize again ...');
      }
    },
    50,
    10,
  );

  await page.waitForTimeout(500 + Math.floor(Math.random() * 300));
  const tickets = await getAllRoundTripTicket(page);

  await page.waitForTimeout(300 + Math.floor(Math.random() * 300));
  return tickets;
}

/**
 *
 * @param {import('puppeteer').Page} page
 */
async function captchaProcess(page) {
  const randomDirName = uuidv4();
  const captchaFileDir = path.resolve(
    __filename,
    `../../downloads/${randomDirName}/`,
  );
  console.log(__filename, captchaFileDir);

  // save captcha file and recognize, then fill in
  fs.mkdirSync(captchaFileDir);
  await page.waitForTimeout(1000 + Math.floor(Math.random() * 500));
  const captchaImg = await page.$('#BookingS1Form_homeCaptcha_passCode');
  const captchaImgBuf = await captchaImg.screenshot();
  fs.writeFileSync(`${captchaFileDir}/test.png`, captchaImgBuf);

  const formData = new FormData();
  formData.append('image', fs.createReadStream(`${captchaFileDir}/test.png`));
  const ocrRes = await axios.post(config.captchaSolver.apiUrl, formData, {
    headers: { ...formData.getHeaders() },
  });
  const captchaText = String(ocrRes.data);
  console.log(captchaText);
  await page.waitForTimeout(500 + Math.floor(Math.random() * 300));
  const captchaInputSltr = 'input[name="homeCaptcha:securityCode"]';
  const captchaInput = await page.$(captchaInputSltr);
  const capchaInputVal = await captchaInput.evaluate((input) => input.value);
  if (capchaInputVal) await captchaInput.click({ clickCount: 3, delay: 100 });
  await captchaInput.type(captchaText, { delay: 200 });

  await page.waitForTimeout(300 + Math.floor(Math.random() * 300));
  await Promise.allSettled([
    page.waitForNavigation({ timeout: 20000 }),
    page.evaluate(() => document.querySelector('#BookingS1Form').submit()),
  ]);
}

/**
 *
 * @param {import('puppeteer').Page} page
 */
async function renewCaptchaImg(page) {
  await page.waitForTimeout(500 + Math.floor(Math.random() * 500));
  const captchaImgSltr = '#BookingS1Form_homeCaptcha_passCode';
  const oriCaptchaImgSrc = await page.$eval(captchaImgSltr, (i) => i.src);
  await page.click('#BookingS1Form_homeCaptcha_reCodeLink');
  console.log('click');
  await page.waitForFunction(
    (imgSelector, oriImgSrc) =>
      document.querySelector(imgSelector).src !== oriImgSrc,
    { timeout: 1000 },
    captchaImgSltr,
    oriCaptchaImgSrc,
  );
  console.log('img changed');
}

// get a userAgent, and make most use chrome, then firefox
// randomUserAgent package is not good because it may cause page.goto stuck with some userAgent
function pickUserAgent() {
  // target website seems to accept newer version and much-like real computer browser user
  const userAgentCandidates = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.79 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36 OPR/84.0.4316.42',
  ];
  const rand = Math.floor(Math.random() * 100);
  let ua;
  switch (true) {
    case rand < 95:
      ua = userAgentCandidates[0];
      break;
    case rand < 100:
      ua = userAgentCandidates[1];
      break;
    default:
      ua = userAgentCandidates[0];
      break;
  }
  return ua;
}

function genFormattedDepartureDate(depatureDate) {
  const [departureYear, departureMonth, departureDay] = depatureDate.split('-');
  const departureDayInt = parseInt(departureDay, 10);
  const getMonthName = (month, locale) => {
    const monthMap = {
      '01': { 'en-us': 'January', 'zh-tw': '一月' },
      '02': { 'en-us': 'February', 'zh-tw': '二月' },
      '03': { 'en-us': 'March', 'zh-tw': '三月' },
      '04': { 'en-us': 'April', 'zh-tw': '四月' },
      '05': { 'en-us': 'May', 'zh-tw': '五月' },
      '06': { 'en-us': 'June', 'zh-tw': '六月' },
      '07': { 'en-us': 'July', 'zh-tw': '七月' },
      '08': { 'en-us': 'August', 'zh-tw': '八月' },
      '09': { 'en-us': 'September', 'zh-tw': '九月' },
      10: { 'en-us': 'October', 'zh-tw': '十月' },
      11: { 'en-us': 'November', 'zh-tw': '十一月' },
      12: { 'en-us': 'December', 'zh-tw': '十二月' },
    };
    return monthMap[month][locale];
  };

  return {
    'en-us': `${getMonthName(
      departureMonth,
      'en-us',
    )} ${departureDayInt}, ${departureYear}`,
    'zh-tw': `${getMonthName(
      departureMonth,
      'zh-tw',
    )} ${departureDayInt}, ${departureYear}`,
  };
}

const stationPairTicketPriceMapping = {
  '台北-左營': 1490,
  '左營-台北': 1490,
  '台北-台中': 700,
  '台中-台北': 700,
  '台中-左營': 790,
  '左營-台中': 790,
};

const ticketDiscountRatioMapping = {
  早鳥9折: 0.9,
  早鳥8折: 0.8,
  早鳥65折: 0.65,
  原價: 1,
};

/**
 *
 * @param {import('puppeteer').Page} page
 */
async function getAllRoundTripTicket(page) {
  const ticketOrigin = constants.TICKET_ORIGIN.OFFICIAL;
  const roundTripOutboundSltr = '#BookingS2Form_TrainQueryDataViewPanel';
  const roundTripInboundSltr = '#BookingS2Form_TrainQueryDataViewPanel2';
  await page.waitForSelector(roundTripOutboundSltr);
  await page.waitForSelector(roundTripInboundSltr);
  const getAllBoundTickets = async (boundSltr) => {
    const departureTimeElmt = `${boundSltr} #QueryDeparture`;
    const laterTrainBtnElmt = `${boundSltr}_PreAndLaterTrainContainer_laterTrainLink`;
    const allBoundTickets = [];
    // set i to limit max iterate count, prevent infinite loop due to web changing elmt
    for (let i = 0; i < 10; i += 1) {
      await page.waitForTimeout(1400 + Math.floor(Math.random() * 600));
      const oriDepartureTime = await page.$eval(
        departureTimeElmt,
        (span) => span.textContent,
      );
      const tickets = await page.evaluate(
        getCurrentShownTicketProcess,
        stationPairTicketPriceMapping,
        ticketDiscountRatioMapping,
        ticketOrigin,
        boundSltr,
      );
      allBoundTickets.push(tickets);

      const style = await page.$eval(laterTrainBtnElmt, (b) =>
        b.getAttribute('style'),
      );
      if (style === 'visibility:hidden;') break;

      await page.click(laterTrainBtnElmt);
      await page.waitForFunction(
        (depTimeElmt, oriDepTime) =>
          document.querySelector(depTimeElmt).textContent !== oriDepTime,
        { timeout: 15000 },
        departureTimeElmt,
        oriDepartureTime,
      );
    }
    return allBoundTickets.flatMap((t) => t);
  };
  return [
    ...(await getAllBoundTickets(roundTripOutboundSltr)),
    ...(await getAllBoundTickets(roundTripInboundSltr)),
  ];
}

function getCurrentShownTicketProcess(
  tkPriceMap,
  tkDiscountRatioMap,
  tkOrigin,
  boundSltr,
) {
  const getBoundTickets = (boundElmt) => {
    const dateElmt = boundElmt.querySelector('.date2 span');
    const startStnElmt = boundElmt.querySelector('.stn-group span');
    const desStnElmt = boundElmt.querySelector('.stn-group span:last-child');
    const ticketDataWrapper = [
      ...boundElmt.querySelectorAll('.mobile-wrapper'),
    ];
    return ticketDataWrapper.map((t) => {
      const departureTimeElmt = t.querySelector('#QueryDeparture');
      const arrivalTimeElmt = t.querySelector('#QueryArrival');
      const discountElmt = t.querySelector('.early-bird span');
      const stationPair = `${startStnElmt.textContent}-${desStnElmt.textContent}`;
      const discount = discountElmt?.textContent ?? '原價';
      return {
        stationPair,
        date: dateElmt.textContent,
        time: `${departureTimeElmt.textContent}-${arrivalTimeElmt.textContent}`,
        stock: '1',
        discount,
        price: String(tkPriceMap[stationPair] * tkDiscountRatioMap[discount]),
        detailUrl: 'https://www.thsrc.com.tw/',
        origin: tkOrigin,
      };
    });
  };
  return getBoundTickets(document.querySelector(boundSltr));
}

export default crawlSiteData;
