import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import randomUseragent from 'random-useragent';
import retry from './utils/retry';
import config from './config';
import constants from './constants';

const __filename = new URL(import.meta.url).pathname;

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
  const ticketOrigin = constants.TICKET_ORIGIN.OFFICIAL;
  const [departureYear, , departureDay] = depatureDate.split('-');
  const departureMonthName = new Date(depatureDate).toLocaleString('en-us', {
    month: 'long',
  });
  const formattedDepartureDate = `${departureMonthName} ${String(
    parseInt(departureDay, 10),
  )}, ${departureYear}`;
  console.log(startStation, destinationStation, depatureDate);
  console.log(formattedDepartureDate);

  const page = (await browser.pages())[0];

  page.on('console', (msg) => console.log(msg.text()));

  const websiteUrl = 'https://irs.thsrc.com.tw/IMINT/?locale=tw';
  const referer = 'https://www.thsrc.com.tw/';
  const DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.79 Safari/537.36';
  const userAgent = randomUseragent.getRandom();
  const UA = userAgent || DEFAULT_USER_AGENT;
  const cookie = {
    name: 'AcceptIRSCookiePolicyTime',
    value:
      'Wed%20May%2011%202022%2017:21:15%20GMT+0800%20(Taipei%20Standard%20Time)',
    url: websiteUrl,
  };

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
  // await page.setExtraHTTPHeaders({
  //   'Cache-Control': 'max-age=0',
  //   'Sec-Fetch-Site': 'same-site',
  //   'Sec-GPC': '1',
  // });
  await page.authenticate({ username: proxyUsername, password: proxyPassword });
  console.log('Visit site');
  await retry(() => page.goto(websiteUrl, { timeout: 9000, referer }), 3000, 5);
  console.log('Start get site data');

  await page.waitForTimeout(500 + Math.floor(Math.random() * 500));

  // await page.waitForSelector('#btn-confirm');
  // await page.click('#btn-confirm');

  await page.waitForTimeout(1500 + Math.floor(Math.random() * 500));
  await page.waitForSelector('#BookingS1Form');
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
  await page.waitForSelector(
    `.dayContainer span[aria-label="${formattedDepartureDate}"]`,
  );
  await page.$eval(
    `.flatpickr-days span[aria-label="${formattedDepartureDate}"]`,
    (span) => span.click(),
  );

  await page.waitForTimeout(1500 + Math.floor(Math.random() * 500));
  await page.select('select[name="toTimeTable"]', '1201A');

  await retry(
    async () => {
      await page.waitForTimeout(500 + Math.floor(Math.random() * 500));

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
    500,
    5,
  );

  await page.waitForTimeout(500 + Math.floor(Math.random() * 300));
  await page.waitForSelector('#BookingS2Form_TrainQueryDataViewPanel');
  const tickets = await page.evaluate(
    (tkPriceMap, tkDiscountRatioMap, tkOrigin) => {
      const dateElmt = document.querySelector('.date2 span');
      const startStnElmt = document.querySelector('.stn-group span');
      const desStnElmt = document.querySelector('.stn-group span:last-child');
      const ticketDataWrapper = [
        ...document.querySelectorAll('.mobile-wrapper'),
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
    },
    stationPairTicketPriceMapping,
    ticketDiscountRatioMapping,
    ticketOrigin,
  );

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
    page.waitForNavigation({ timeout: 2000 }),
    page.evaluate(() => document.querySelector('#BookingS1Form').submit()),
  ]);
}

/**
 *
 * @param {import('puppeteer').Page} page
 */
async function renewCaptchaImg(page) {
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

export default crawlSiteData;
