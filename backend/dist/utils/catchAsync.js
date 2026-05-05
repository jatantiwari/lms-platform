"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
/**
 * Wraps async route handlers to forward errors to the global error handler,
 * eliminating try/catch boilerplate in every controller.
 */
const catchAsync = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};
exports.catchAsync = catchAsync;
//# sourceMappingURL=catchAsync.js.map