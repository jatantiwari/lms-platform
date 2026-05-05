"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment first — will exit if invalid
require("./config/env");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const prisma_1 = __importDefault(require("./config/prisma"));
const logger_1 = __importDefault(require("./config/logger"));
const PORT = env_1.env.PORT;
async function bootstrap() {
    // Verify database connectivity
    await prisma_1.default.$connect();
    logger_1.default.info('✅ PostgreSQL connected via Prisma');
    const server = app_1.default.listen(PORT, () => {
        logger_1.default.info(`🚀 Server running on http://localhost:${PORT} [${env_1.env.NODE_ENV}]`);
    });
    // Graceful shutdown — close DB connections before exit
    const shutdown = async (signal) => {
        logger_1.default.info(`Received ${signal}. Gracefully shutting down...`);
        server.close(async () => {
            await prisma_1.default.$disconnect();
            logger_1.default.info('Database disconnected. Server closed.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        logger_1.default.error('Unhandled Promise Rejection:', reason);
        server.close(() => process.exit(1));
    });
    process.on('uncaughtException', (err) => {
        logger_1.default.error('Uncaught Exception:', err);
        process.exit(1);
    });
}
bootstrap().catch((err) => {
    logger_1.default.error('Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map