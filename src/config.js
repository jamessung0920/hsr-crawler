export default {
  env: process.env.NODE_ENV,
  redis: {
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
  },
  webhook: {
    line: {
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    },
  },
};
