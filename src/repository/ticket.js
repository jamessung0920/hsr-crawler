async function getTickets(
  pgPool,
  stationPair,
  departureAfter,
  purchaseCount,
  ticketOrigin,
) {
  const tickets = await pgPool.query(
    `
      SELECT *
      FROM tickets t1
      WHERE station_pair = $1
        AND departure_time >= $2
        AND stock >= $3
        AND origin = $4
        AND created_at = (
          SELECT MAX(created_at)
          FROM tickets t2
          WHERE t1.station_pair = t2.station_pair
            AND t1.departure_time = t2.departure_time
            AND t1.origin = t2.origin
        )
      ORDER BY departure_time ASC, discount DESC
      LIMIT 15
    `,
    [stationPair, departureAfter, purchaseCount, ticketOrigin],
  );
  return tickets;
}

async function insertTicket(pgPool, id, ticket) {
  const res = await pgPool.query(
    `
      INSERT INTO tickets (id, station_pair, departure_time, discount, stock, origin)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      id,
      ticket.stationPair,
      ticket.departureTime,
      ticket.discount,
      ticket.stock,
      ticket.origin,
    ],
  );
}

async function deleteTicketById(pgPool, id) {
  try {
    const res = await pgPool.query(
      `
      DELETE FROM tickets
      WHERE id = $1
    `,
      [id],
    );
  } catch (err) {
    console.error(err);
  }
}

export default {
  getTickets,
  insertTicket,
  deleteTicketById,
};
