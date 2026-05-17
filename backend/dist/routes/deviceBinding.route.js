"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const deviceBinding_controller_1 = require("../controllers/deviceBinding.controller");
const router = (0, express_1.Router)();
// All device binding routes require authentication
router.use(authenticate_1.authenticate);
/**
 * Register or validate device binding.
 * Call on every login after token is issued.
 */
router.post('/', deviceBinding_controller_1.registerDeviceBinding);
/**
 * List all registered devices for the current user.
 */
router.get('/', deviceBinding_controller_1.getUserDevices);
/**
 * Confirm device after phone OTP verification passes.
 */
router.post('/verify', deviceBinding_controller_1.confirmDeviceVerification);
/**
 * Revoke a specific device.
 */
router.delete('/:deviceBindingId', deviceBinding_controller_1.revokeDevice);
exports.default = router;
//# sourceMappingURL=deviceBinding.route.js.map