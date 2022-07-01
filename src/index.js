/* eslint-disable no-await-in-loop */
import express from 'express';
import axios from 'axios';
import isTicketId from 'validator/lib/isUUID';
import handleLineWebhook from './webhook';
import config from './config';
import initPostgres from './postgres';
import initRedis from './redis';
import ticketRepo from './repository/ticket';
import userWishTicketRepo from './repository/userWishTicket';
import generateLineBubbleContainerJson from './utils/bubbleContainerJsonGenerator';

// setup db and redis server
const pgPool = initPostgres();

const redisClient = await initRedis();

// https://redis.io/topics/notifications
const redisKeyEventClient = redisClient.duplicate();
await redisKeyEventClient.connect();
await redisKeyEventClient.subscribe('__keyevent@0__:expired', async (key) => {
  if (isTicketId(key, 4)) {
    ticketRepo.deleteTicketById(pgPool, key);
  }
});

// setup webhook
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  handleLineWebhook(req, pgPool, redisClient);
  res.sendStatus(200);
});

app.listen(3000, () => console.log('app listening on port 3000!'));

// global event
process.on('uncaughtException', (err) => {
  console.log('uncaughtException');
  console.log(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('unhandledRejection');
  console.log(reason, p);
});

setInterval(async () => {
  const allUsersFollowTickets =
    await userWishTicketRepo.getAllUnnotifiedUsersWishTickets(pgPool);
  if (
    Array.isArray(allUsersFollowTickets.rows) &&
    allUsersFollowTickets.rows.length > 0
  ) {
    for (const a of allUsersFollowTickets.rows) {
      const tickets = await ticketRepo.getTickets(
        pgPool,
        a.station_pair,
        a.departure_time,
        a.count,
        'official',
      );

      if (Array.isArray(tickets.rows) && tickets.rows.length > 0) {
        const containerJsonTicketsForResponse = [];
        for (const [idx, ticket] of tickets.rows.entries()) {
          if (idx >= config.webhook.line.showTicketCount) break;
          const rawTicket = await redisClient.get(ticket.id);
          const rawTicketObj = JSON.parse(rawTicket);
          containerJsonTicketsForResponse.push(
            generateLineBubbleContainerJson(rawTicketObj),
          );
        }

        await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: a.line_user_id,
            messages: [
              {
                type: 'text',
                text: '您關注的票目前有喔！此通知只會通知一次。',
              },
              {
                type: 'flex',
                altText: 'this is a flex message',
                contents: {
                  type: 'carousel',
                  contents: [...containerJsonTicketsForResponse],
                },
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

        await userWishTicketRepo.updateHasMetAndNotifiedById(pgPool, a.id);
      }
    }
  }
}, 300 * 1000);
