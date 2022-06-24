import Pool from 'pg-pool';
import config from './config';

export default function initPostgres() {
  const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database: config.postgres.database,
  });
  return pool;
}
