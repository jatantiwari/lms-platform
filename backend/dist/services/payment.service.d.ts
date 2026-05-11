export interface OrderResult {
    orderId: string;
    amount: number;
    currency: string;
}
/**
 * DUMMY payment — simulates creating an order without any real payment gateway.
 * Returns a UUID-based orderId that the verify endpoint will accept.
 */
export declare function createDummyOrder(amountInRupees: number): OrderResult;
/**
 * Creates a real Razorpay order for the given amount in rupees.
 */
export declare function createRazorpayOrder(amountInRupees: number, receiptId: string): Promise<OrderResult>;
/**
 * Verifies Razorpay payment signature.
 * Returns true if the signature is valid.
 */
export declare function verifyRazorpaySignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean;
//# sourceMappingURL=payment.service.d.ts.map