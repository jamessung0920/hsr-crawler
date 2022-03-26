async function getTickets(pgPool, stationPair, departureAfter, purchaseCount) {
  const tickets = await pgPool.query(
    `
      SELECT * FROM tickets
      WHERE station_pair = $1 AND departure_time >= $2 AND stock >= $3
      ORDER BY departure_time ASC, discount DESC
      LIMIT 100
    `,
    [stationPair, departureAfter, purchaseCount],
  );
  return tickets;
}

async function insertTicket(pgPool, id, ticket) {
  const res = pgPool.query(
    `
      INSERT INTO tickets
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      id,
      ticket.stationPair,
      ticket.departureTime,
      ticket.discount,
      ticket.stock,
    ],
  );
}

async function deleteTicketById(pgPool, id) {
  const res = pgPool.query(
    `
      DELETE FROM tickets
      WHERE id = $1
    `,
    [id],
  );
}

export default {
  getTickets,
  insertTicket,
  deleteTicketById,
};
