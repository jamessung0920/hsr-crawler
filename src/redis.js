import { createClient } from 'redis';
import config from './config';

export default async function initRedis() {
  const client = createClient({ url: `redis://${config.redis.host}/` });
  client.on('error', (err) => console.error('Redis Client Error', err));
  await client.connect();
  return client;
}
