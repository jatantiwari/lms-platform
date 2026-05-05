"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const upload_1 = require("../middleware/upload");
const validate_1 = require("../middleware/validate");
const auth_validation_1 = require("../validations/auth.validation");
const router = (0, express_1.Router)();
// Public
router.get('/:id/profile', user_controller_1.getUserProfile);
// Authenticated
router.use(authenticate_1.authenticate);
router.put('/profile', (0, validate_1.validate)(auth_validation_1.updateProfileSchema), user_controller_1.updateProfile);
router.put('/avatar', upload_1.uploadImage.single('avatar'), user_controller_1.uploadAvatar);
router.put('/change-password', user_controller_1.changePassword);
router.put('/push-token', user_controller_1.updatePushToken);
// Admin only
router.get('/', (0, authorize_1.authorize)('ADMIN'), user_controller_1.listUsers);
router.patch('/:id/toggle-active', (0, authorize_1.authorize)('ADMIN'), user_controller_1.toggleUserActive);
exports.default = router;
//# sourceMappingURL=user.route.js.map