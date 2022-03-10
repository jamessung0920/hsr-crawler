import express from 'express';
import runPuppeteer from './puppeteer';
import handleLineWebhook from './webhook';
import initRedis from './redis';

const app = express();

app.use(express.json());
/** example request body
{
  destination: 'jwioefjiwoefjwioefjewiofjweifoj',
  events: [
    {
      type: 'message',
      message: { type: 'text', id: '15692615108402', text: '123' },
      timestamp: 1646469833446,
      source: { type: 'user', userId: 'jiowefjowejfiowefjoweifewjif' },
      replyToken: 'ojweifjewiofjweifojewfoiwefj',
      mode: 'active',
    },
  ],
}
*/
app.post('/webhook', (req, res) => {
  handleLineWebhook(req);
});

app.listen(3000, () => console.log('app listening on port 3000!'));

const redisClient = await initRedis();

runPuppeteer(redisClient);
