"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDummyOrder = createDummyOrder;
const uuid_1 = require("uuid");
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
//# sourceMappingURL=payment.service.js.map