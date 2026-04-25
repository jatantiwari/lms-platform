// Load environment first — will exit if invalid
import './config/env';

import app from './app';
import { env } from './config/env';
import prisma from './config/prisma';
import logger from './config/logger';

const PORT = env.PORT;

async function bootstrap(): Promise<void> {
  // Verify database connectivity
  await prisma.$connect();
  logger.info('✅ PostgreSQL connected via Prisma');

  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown — close DB connections before exit
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database disconnected. Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection:', reason);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
