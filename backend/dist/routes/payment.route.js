"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.post('/create-order', (0, authorize_1.authorize)('STUDENT', 'INSTRUCTOR'), payment_controller_1.createOrder);
router.post('/verify', (0, authorize_1.authorize)('STUDENT', 'INSTRUCTOR'), payment_controller_1.verifyPayment);
router.get('/history', payment_controller_1.getPaymentHistory);
exports.default = router;
//# sourceMappingURL=payment.route.js.map