import config from '../config';
import ticketRepo from '../repository/ticket';
import userWishTicketRepo from '../repository/userWishTicket';
import generateLineBubbleContainerJson from '../utils/bubbleContainerJsonGenerator';

async function getUserExpectedTickets(userInput, pgPool, redisClient) {
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
    const officialContainerJsonTickets = await getContainerJsonTickets(
      pgPool,
      redisClient,
      expectedStationPair,
      expectedDepartureAfter,
      expectedPurchaseCount,
      'official',
    );
    const latebirdContainerJsonTickets = await getContainerJsonTickets(
      pgPool,
      redisClient,
      expectedStationPair,
      expectedDepartureAfter,
      expectedPurchaseCount,
      'latebird',
    );

    const messageObjects = [
      {
        type: 'text',
        text:
          officialContainerJsonTickets.length > 0 ||
          latebirdContainerJsonTickets.length > 0
            ? `有票喔！幫您列出資訊如下 (最多${config.webhook.line.showTicketCount}筆)`
            : '沒有找到符合的票喔！',
      },
    ];

    if (officialContainerJsonTickets.length > 0) {
      messageObjects.push({
        type: 'flex',
        altText: 'this is a flex message',
        contents: {
          type: 'carousel',
          contents: officialContainerJsonTickets,
        },
      });
    }
    if (latebirdContainerJsonTickets.length > 0) {
      messageObjects.push({
        type: 'flex',
        altText: 'this is a flex message',
        contents: {
          type: 'carousel',
          contents: latebirdContainerJsonTickets,
        },
      });
    }
    return messageObjects;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function insertUserWishTicket(userId, userInput, pgPool) {
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
    const userWishTickets = await userWishTicketRepo.getUserWishTicketsByUserId(
      pgPool,
      userId,
    );
    if (userWishTickets.rows.length >= 3) {
      await userWishTicketRepo.deleteUserWishTicketById(
        pgPool,
        userWishTickets.rows[userWishTickets.rows.length - 1].id,
      );
    }

    for (const t of userWishTickets.rows) {
      if (
        t.station_pair === expectedStationPair &&
        t.departure_time.getTime() === expectedDepartureAfter.getTime() &&
        t.count === expectedPurchaseCount
      ) {
        return [
          {
            type: 'text',
            text: '您以關注過相同的車票資訊，可至關注列表查詢。',
          },
        ];
      }
    }

    await userWishTicketRepo.insertUserWishTicket(
      pgPool,
      userId,
      expectedStationPair,
      expectedDepartureAfter,
      expectedPurchaseCount,
    );
    return [{ type: 'text', text: '已完成關注，若有符合的票會通知您。' }];
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getContainerJsonTickets(
  pgPool,
  redisClient,
  stationPair,
  depatureAfter,
  purchaseCount,
  origin,
) {
  const tickets = await ticketRepo.getTickets(
    pgPool,
    stationPair,
    depatureAfter,
    purchaseCount,
    origin,
  );

  if (Array.isArray(tickets.rows) && tickets.rows.length === 0) return [];

  const containerJsonTicketsForResponse = [];
  if (Array.isArray(tickets.rows) && tickets.rows.length > 0) {
    for (const [idx, ticket] of tickets.rows.entries()) {
      if (idx >= config.webhook.line.showTicketCount) break;
      const rawTicket = await redisClient.get(ticket.id);
      const rawTicketObj = JSON.parse(rawTicket);
      containerJsonTicketsForResponse.push(
        generateLineBubbleContainerJson(rawTicketObj),
      );
    }
  }
  return containerJsonTicketsForResponse;
}

export default { getUserExpectedTickets, insertUserWishTicket };
