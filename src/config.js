export default {
  env: process.env.NODE_ENV,
  postgres: {
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  redis: {
    host: process.env.REDIS_HOST,
    expireTime: process.env.REDIS_EXPIRE_TIME,
  },
  webhook: {
    line: {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
      showTicketCount: process.env.SHOW_TICKET_ACCOUNT,
    },
  },
  puppeteer: {
    crawlPeriod: process.env.CRAWL_PERIOD,
  },
  upstreamProxy: {
    port: process.env.UPSTREAM_PROXY_PORT,
    ip: process.env.UPSTREAM_PROXY_IP,
    username: process.env.UPSTREAM_PROXY_USERNAME,
    password: process.env.UPSTREAM_PROXY_PASSWORD,
  },
};
