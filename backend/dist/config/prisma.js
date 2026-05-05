"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const env_1 = require("./env");
/**
 * Prisma client singleton — prevents multiple instances during hot reloads in development.
 */
const prisma = globalThis.__prisma ??
    new client_1.PrismaClient({
        log: env_1.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (env_1.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}
exports.default = prisma;
//# sourceMappingURL=prisma.js.map