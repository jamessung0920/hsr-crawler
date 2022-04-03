import axios from 'axios';
import getUserExpectedTickets from './ticketResponse';
import constants from '../constants';
import config from '../config';
import instruction from '../utils/instructionGenerator';
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
      if (event.type !== 'message' || event.mode !== 'active') return;

      const userInput = event.message.text;
      const { userId } = event.source;
      let messageObjects;
      switch (userInput) {
        case constants.RICH_MENU_ACTION.SEARCH: {
          console.log('查詢車票');
          const userActionCache = { isSearchStep: true };
          await redisClient.set(userId, JSON.stringify(userActionCache), {
            EX: config.redis.expireTime,
            NX: true,
          });
          messageObjects = instruction.getSearchStepInstruction();
          break;
        }
        case constants.RICH_MENU_ACTION.FOLLOW: {
          console.log('關注車票');
          messageObjects = instruction.getFollowStepInstruction();
          break;
        }
        case constants.RICH_MENU_ACTION.INSTRUCTION: {
          console.log('使用說明');
          messageObjects = instruction.getAllInstruction();
          break;
        }
        default: {
          console.log('票');
          const userActionCache = await redisClient.get(userId);
          const isSearchStep = userActionCache
            ? JSON.parse(userActionCache).isSearchStep
            : false;
          messageObjects = await getUserExpectedTickets(
            userInput,
            isSearchStep,
            pgPool,
            redisClient,
          );
          break;
        }
      }

      if (userInput !== constants.RICH_MENU_ACTION.SEARCH) {
        await redisClient.del(userId);
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
