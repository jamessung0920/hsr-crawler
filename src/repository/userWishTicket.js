async function getAllUnnotifiedUsersWishTickets(pgPool) {
  const res = await pgPool.query(
    `
      SELECT * FROM user_wish_tickets WHERE has_met_and_notified = false
    `,
    [],
  );
  return res;
}

async function insertUserWishTicket(
  pgPool,
  userId,
  stationPair,
  departureAfter,
  purchaseCount,
) {
  const res = await pgPool.query(
    `
      INSERT INTO user_wish_tickets (line_user_id, station_pair, departure_time, discount, count, has_met_and_notified)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [userId, stationPair, departureAfter, 0, purchaseCount, false],
  );
}

async function updateHasMetAndNotifiedById(pgPool, id) {
  const res = await pgPool.query(
    `
      UPDATE user_wish_tickets SET has_met_and_notified = true
      WHERE id = $1
    `,
    [id],
  );
  return res;
}

export default {
  getAllUnnotifiedUsersWishTickets,
  insertUserWishTicket,
  updateHasMetAndNotifiedById,
};
