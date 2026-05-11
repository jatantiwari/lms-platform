"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDummyOrder = createDummyOrder;
exports.createRazorpayOrder = createRazorpayOrder;
exports.verifyRazorpaySignature = verifyRazorpaySignature;
const uuid_1 = require("uuid");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
/**
 * DUMMY payment — simulates creating an order without any real payment gateway.
 * Returns a UUID-based orderId that the verify endpoint will accept.
 */
function createDummyOrder(amountInRupees) {
    return {
        orderId: `dummy_${(0, uuid_1.v4)()}`,
        amount: Math.round(amountInRupees * 100),
        currency: 'INR',
    };
}
// ─── Real Razorpay ─────────────────────────────────────────────────────────────
function getRazorpayInstance() {
    if (!env_1.env.RAZORPAY_KEY_ID || !env_1.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials are not configured');
    }
    return new razorpay_1.default({
        key_id: env_1.env.RAZORPAY_KEY_ID,
        key_secret: env_1.env.RAZORPAY_KEY_SECRET,
    });
}
/**
 * Creates a real Razorpay order for the given amount in rupees.
 */
async function createRazorpayOrder(amountInRupees, receiptId) {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
        amount: Math.round(amountInRupees * 100), // paise
        currency: 'INR',
        receipt: receiptId.substring(0, 40), // Razorpay receipt max 40 chars
    });
    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
    };
}
/**
 * Verifies Razorpay payment signature.
 * Returns true if the signature is valid.
 */
function verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    if (!env_1.env.RAZORPAY_KEY_SECRET)
        return false;
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto_1.default
        .createHmac('sha256', env_1.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
}
//# sourceMappingURL=payment.service.js.map