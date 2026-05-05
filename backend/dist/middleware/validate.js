"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
/**
 * Middleware factory that validates req[target] against a Zod schema.
 * Replaces the target with the parsed (and coerced) value on success.
 * Returns 400 with structured field errors on failure.
 */
const validate = (schema, target = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
        return;
    }
    // Replace with parsed value so downstream code gets coerced types
    req[target] = result.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map