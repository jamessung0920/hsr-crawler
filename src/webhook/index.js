import axios from 'axios';
import config from '../config';
import getUserExpectedTickets from './ticketResponse';

/** example request body
{
  destination: 'jwioefjiwoefjwioefjewiofjweifoj',
  events: [
    {
      type: 'message',
      message: { type: 'text', id: '15692615108402', text: '左營-台北 2022-03-20 6:00 1張' },
      timestamp: 1646469833446,
      source: { type: 'user', userId: 'jiowefjowejfiowefjoweifewjif' },
      replyToken: 'ojweifjewiofjweifojewfoiwefj',
      mode: 'active',
    },
  ],
}
*/
async function handleLineWebhook({ body: reqBody }, pgPool, redisClient) {
  // line send to confirm communication without event
  if (Array.isArray(reqBody.events) && reqBody.events.length === 0) return;

  // handle events array (ref: https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)
  Promise.allSettled(
    reqBody.events.map(async (event) => {
      // type may be message, follow, unfollow and so on
      if (event.type !== 'message') return;

      const userInput = event.message.text;
      let messageObjects;
      if (userInput === '使用說明') {
        console.log('使用說明');
      } else if (userInput === '訂票') {
        console.log('訂票');
      } else if (userInput === '搶票') {
        console.log('搶票');
      } else if (userInput === '關注') {
        console.log('關注');
      } else {
        console.log('票');
        messageObjects = await getUserExpectedTickets(
          userInput,
          pgPool,
          redisClient,
        );
      }

      axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
          replyToken: event.replyToken,
          messages: messageObjects,
        },
        {
          headers: {
            Authorization: `Bearer ${config.webhook.line.channelAccessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    }),
  ).catch((err) => console.error(err));
}

export default handleLineWebhook;
