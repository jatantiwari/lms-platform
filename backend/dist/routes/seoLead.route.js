"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seoLead_controller_1 = require("../controllers/seoLead.controller");
const router = (0, express_1.Router)();
router.post('/contact', seoLead_controller_1.submitSeoLead);
router.post('/subscribe', seoLead_controller_1.subscribeSeoNewsletter);
exports.default = router;
//# sourceMappingURL=seoLead.route.js.map