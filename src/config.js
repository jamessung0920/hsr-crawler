export default {
  env: process.env.NODE_ENV,
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    expireTime: process.env.REDIS_EXPIRE_TIME,
    expireTimeOfficial: process.env.REDIS_EXPIRE_TIME_OFFICIAL,
  },
  webhook: {
    line: {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
      showTicketCount: process.env.SHOW_TICKET_ACCOUNT,
    },
  },
  puppeteer: {
    crawlPeriod: process.env.CRAWL_PERIOD,
    crawlPeriodOfficial: process.env.CRAWL_PERIOD_OFFICIAL,
    crawlDaysIgnoredSinceToday: process.env.CRAWL_DAYS_IGNORED_FROM_TODAY,
    crawlDays: process.env.CRAWL_DAYS,
  },
  upstreamProxy: {
    port: process.env.UPSTREAM_PROXY_PORT,
    ips: process.env.UPSTREAM_PROXY_IPS,
    username: process.env.UPSTREAM_PROXY_USERNAME,
    password: process.env.UPSTREAM_PROXY_PASSWORD,
  },
  captchaSolver: {
    apiUrl: process.env.CAPTCHA_SOLVER_API_URL,
  },
  userWishTicket: {
    checkPeriod: process.env.USER_WISH_TICKET_CHECK_PERIOD,
  },
};
