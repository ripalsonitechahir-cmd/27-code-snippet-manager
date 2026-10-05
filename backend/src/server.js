const path = require('path');
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // no .env file; rely on real environment variables
}

const { createApp } = require('./app');
const log = require('./logger');

const { app, prisma } = createApp();
const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, () => log.info('server started', { port }));

const shutdown = () => server.close(async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
