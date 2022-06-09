/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addType('ticket_origin', ['official', 'latebird']);
  pgm.addColumn('tickets', {
    origin: { type: 'ticket_origin', notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tickets', ['origin'], { ifExists: true });
  pgm.dropType('ticket_origin');
};
