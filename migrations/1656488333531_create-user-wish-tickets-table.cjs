/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('user_wish_tickets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    line_user_id: { type: 'varchar(33)', notNull: true },
    station_pair: { type: 'varchar(10)', notNull: true },
    departure_time: { type: 'timestamp', notNull: true },
    discount: { type: 'integer', notNull: true },
    count: { type: 'integer', notNull: true },
    has_met_and_notified: { type: 'boolean', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('user_wish_tickets', { ifExists: true });
};
