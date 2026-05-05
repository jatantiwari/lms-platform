"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const AppError_1 = require("./utils/AppError");
const routes_1 = __importDefault(require("./routes"));
const logger_1 = __importDefault(require("./config/logger"));
const app = (0, express_1.default)();
// ─── Security Headers ──────────────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow S3 media
}));
// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [env_1.env.FRONTEND_URL, 'http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20, // Stricter limit for auth endpoints
    message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use('/api', apiLimiter);
app.use('/api/v1/auth', authLimiter);
// ─── Body Parsing ──────────────────────────────────────────────────────────────
// Keep raw body for Razorpay webhook signature verification
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ─── Compression ───────────────────────────────────────────────────────────────
app.use((0, compression_1.default)());
// ─── Request Logging ───────────────────────────────────────────────────────────
if (env_1.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (msg) => logger_1.default.info(msg.trim()) },
    }));
}
// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env_1.env.NODE_ENV });
});
// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', routes_1.default);
// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
    next(new AppError_1.NotFoundError('Route'));
});
// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map