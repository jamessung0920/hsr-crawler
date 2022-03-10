import { createClient } from 'redis';

export default async function initRedis() {
  const client = createClient({ url: 'redis://redis/' });
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
  return client;
}
