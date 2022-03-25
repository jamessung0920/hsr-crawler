import axios from 'axios';
import config from './config';
import ticketRepo from './repository/ticket';
import generateLineContainerJson from './utils/containerJsonGenerator';

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
  const { message, replyToken } = reqBody.events[0];
  const userExpectedTicketsInfo = message.text.split(' ');
  const expectedStationPair = userExpectedTicketsInfo[0];
  const expectedDepartureAfter = new Date(
    `${userExpectedTicketsInfo[1]} ${userExpectedTicketsInfo[2]} UTC+8`,
  );
  const expectedPurchaseCount = parseInt(
    userExpectedTicketsInfo[3].split('張')[0],
    10,
  );
  try {
    const tickets = await ticketRepo.getUserExpectedTickets(
      pgPool,
      expectedStationPair,
      expectedDepartureAfter,
      expectedPurchaseCount,
    );

    let replyText = '';
    let hasTicket = false;
    const containerJsonTicketsForResponse = [];
    if (Array.isArray(tickets.rows) && tickets.rows.length > 0) {
      for (const [idx, ticket] of tickets.rows.entries()) {
        if (idx >= config.webhook.line.showTicketCount) break;
        // console.log(idx, ticket.id);
        const rawTicket = await redisClient.get(ticket.id);
        // console.log(rawTicket);
        const rawTicketObj = JSON.parse(rawTicket);
        containerJsonTicketsForResponse.push(
          generateLineContainerJson(rawTicketObj),
        );
      }
      replyText = `有票喔！幫您列出資訊如下 (最多${config.webhook.line.showTicketCount}筆)`;
      hasTicket = true;
    } else {
      replyText = '沒有找到符合的票喔！';
    }

    const bodyMessageObjects = [
      {
        type: 'text',
        text: replyText,
      },
    ];
    if (hasTicket) {
      bodyMessageObjects.push({
        type: 'flex',
        altText: 'this is a flex message',
        contents: {
          type: 'carousel',
          contents: [...containerJsonTicketsForResponse],
        },
      });
    }

    const res = await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken,
        messages: bodyMessageObjects,
      },
      {
        headers: {
          Authorization: `Bearer ${config.webhook.line.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    // console.log(res);
  } catch (error) {
    console.error(error);
  }
}

export default handleLineWebhook;
