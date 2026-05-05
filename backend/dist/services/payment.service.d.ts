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
//# sourceMappingURL=payment.service.d.ts.map