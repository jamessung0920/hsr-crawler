import axios from 'axios';
import ticketResponse from './ticketResponse';
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
          await redisClient.set(
            `action-${userId}`,
            constants.RICH_MENU_ACTION.SEARCH,
            { EX: config.redis.expireTime },
          );
          messageObjects = instruction.getSearchActionInstruction();
          break;
        }
        case constants.RICH_MENU_ACTION.FOLLOW: {
          console.log('關注車票');
          await redisClient.set(
            `action-${userId}`,
            constants.RICH_MENU_ACTION.FOLLOW,
            { EX: config.redis.expireTime },
          );
          messageObjects = instruction.getFollowActionInstruction();
          break;
        }
        case constants.RICH_MENU_ACTION.INSTRUCTION: {
          console.log('使用說明');
          messageObjects = instruction.getAllInstruction();
          break;
        }
        case constants.RICH_MENU_ACTION.FOLLOW_LIST: {
          console.log('關注列表');
          messageObjects = await instruction.getFollowListActionInstruction(
            pgPool,
            userId,
          );
          break;
        }
        default: {
          console.log('使用者輸入票的資訊 or 沒選動作');
          const userActionCache = await redisClient.get(`action-${userId}`);
          if (userActionCache === constants.RICH_MENU_ACTION.SEARCH) {
            messageObjects = await ticketResponse.getUserExpectedTickets(
              userInput,
              pgPool,
              redisClient,
            );
          } else if (userActionCache === constants.RICH_MENU_ACTION.FOLLOW) {
            messageObjects = await ticketResponse.insertUserWishTicket(
              userId,
              userInput,
              pgPool,
              redisClient,
            );
          } else {
            messageObjects = [{ type: 'text', text: '請先由下方menu選擇動作' }];
          }
          break;
        }
      }

      if (
        userInput !== constants.RICH_MENU_ACTION.SEARCH &&
        userInput !== constants.RICH_MENU_ACTION.FOLLOW
      ) {
        await redisClient.del(`action-${userId}`);
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
