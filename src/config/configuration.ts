export default () => {
  const rawSsl = (process.env.DB_SSL ?? 'false').toLowerCase();
  const sslEnabled = rawSsl === 'true' || rawSsl === '1' || rawSsl === 'yes';

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    database: {
      url: process.env.DB_URL?.trim(),
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'foodexpress',
      password: process.env.DB_PASSWORD ?? 'foodexpress',
      name: process.env.DB_NAME ?? 'foodexpress',
      ssl: sslEnabled,
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    },
  };
};
