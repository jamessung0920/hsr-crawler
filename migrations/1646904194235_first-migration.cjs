/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('tickets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      // default: pgm.func('gen_random_uuid()'),
    },
    station_pair: { type: 'varchar(10)', notNull: true },
    departure_time: { type: 'timestamp', notNull: true },
    discount: { type: 'integer', notNull: true },
    stock: { type: 'integer', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('tickets', { ifExists: true });
};
