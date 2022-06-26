/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex('tickets', ['station_pair', 'departure_time', 'origin'], {
    name: 'tickets_station_pair_departure_time_origin_index',
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('tickets', [], {
    name: 'tickets_station_pair_departure_time_origin_index',
  });
};
