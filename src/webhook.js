import axios from 'axios';
import config from './config';

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
    const tickets = await pgPool.query(
      `
      SELECT * FROM tickets
      WHERE station_pair = $1 AND departure_time >= $2 AND stock >= $3
    `,
      [expectedStationPair, expectedDepartureAfter, expectedPurchaseCount],
    );

    let availableTicketInfo = '';
    for (const [idx, ticket] of tickets.rows.entries()) {
      if (idx >= config.webhook.line.showTicketCount) break;
      // console.log(idx, ticket.id);
      const rawTicket = await redisClient.get(ticket.id);
      // console.log(rawTicket);
      const rawTicketObj = JSON.parse(rawTicket);
      availableTicketInfo = `${availableTicketInfo}\n${rawTicketObj.stationPair} ${rawTicketObj.date} ${rawTicketObj.time} 庫存還有${rawTicketObj.stock} 價格為${rawTicketObj.price} 折扣為${rawTicketObj.discount}`;
    }

    const res = await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken,
        messages: [
          {
            type: 'text',
            text: `有票喔！幫您列出資訊如下 (最多10筆)\n${availableTicketInfo}`,
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
    // console.log(res);
  } catch (error) {
    console.error(error);
  }
}

export default handleLineWebhook;
