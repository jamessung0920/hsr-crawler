import express from 'express';
import runPuppeteer from './puppeteer';

const app = express();

app.get('/webhook', (req, res) => {
  //   handleLineWebhook();
});

app.listen(3000, () => console.log('app listening on port 3000!'));

runPuppeteer();
