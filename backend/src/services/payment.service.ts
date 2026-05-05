import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

export interface OrderResult {
  orderId: string;
  amount: number;   // in paise (rupees × 100)
  currency: string;
}

/**
 * DUMMY payment — simulates creating an order without any real payment gateway.
 * Returns a UUID-based orderId that the verify endpoint will accept.
 */
export function createDummyOrder(amountInRupees: number): OrderResult {
  return {
    orderId: `dummy_${uuidv4()}`,
    amount: Math.round(amountInRupees * 100),
    currency: 'INR',
  };
}

// ─── Real Razorpay ─────────────────────────────────────────────────────────────

function getRazorpayInstance(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Creates a real Razorpay order for the given amount in rupees.
 */
export async function createRazorpayOrder(
  amountInRupees: number,
  receiptId: string,
): Promise<OrderResult> {
  const razorpay = getRazorpayInstance();
  const order = await razorpay.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    receipt: receiptId.substring(0, 40), // Razorpay receipt max 40 chars
  });
  return {
    orderId: order.id,
    amount: order.amount as number,
    currency: order.currency,
  };
}

/**
 * Verifies Razorpay payment signature.
 * Returns true if the signature is valid.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
}
