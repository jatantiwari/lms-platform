import { v4 as uuidv4 } from 'uuid';

export interface OrderResult {
  orderId: string;
  amount: number;   // in paise (rupees × 100) — kept for UI display compatibility
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
