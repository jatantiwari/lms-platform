"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSlug = createSlug;
const slugify_1 = __importDefault(require("slugify"));
/**
 * Creates a URL-safe slug from a string.
 * Appends a short random suffix to prevent duplicates.
 */
function createSlug(text, unique = false) {
    const base = (0, slugify_1.default)(text, { lower: true, strict: true, trim: true });
    if (!unique)
        return base;
    const suffix = Math.random().toString(36).slice(2, 7);
    return `${base}-${suffix}`;
}
//# sourceMappingURL=slugify.js.map