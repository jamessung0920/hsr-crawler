import axios from 'axios';
import config from './config';

async function handleLineWebhook({ body: reqBody }) {
  const { replyToken } = reqBody.events[0];
  try {
    const res = await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken,
        messages: [
          {
            type: 'text',
            text: 'Hello, user',
          },
          {
            type: 'text',
            text: 'May I help you?',
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${config.webhook.line.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(res);
  } catch (error) {
    console.error(error);
  }
}

export default handleLineWebhook;
