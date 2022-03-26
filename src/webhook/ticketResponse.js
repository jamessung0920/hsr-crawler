import config from '../config';
import ticketRepo from '../repository/ticket';
import generateLineBubbleContainerJson from '../utils/bubbleContainerJsonGenerator';

export default async function getUserExpectedTickets(
  userInput,
  pgPool,
  redisClient,
) {
  const userExpectedTicketsInfo = userInput.split(' ');
  const expectedStationPair = userExpectedTicketsInfo[0];
  const expectedDepartureAfter = new Date(
    `${userExpectedTicketsInfo[1]} ${userExpectedTicketsInfo[2]} UTC+8`,
  );
  const expectedPurchaseCount = parseInt(
    userExpectedTicketsInfo[3].split('張')[0],
    10,
  );
  try {
    const tickets = await ticketRepo.getTickets(
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
          generateLineBubbleContainerJson(rawTicketObj),
        );
      }
      replyText = `有票喔！幫您列出資訊如下 (最多${config.webhook.line.showTicketCount}筆)`;
      hasTicket = true;
    } else {
      replyText = '沒有找到符合的票喔！';
    }

    const messageObjects = [
      {
        type: 'text',
        text: replyText,
      },
    ];
    if (hasTicket) {
      messageObjects.push({
        type: 'flex',
        altText: 'this is a flex message',
        contents: {
          type: 'carousel',
          contents: [...containerJsonTicketsForResponse],
        },
      });
    }
    return messageObjects;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
