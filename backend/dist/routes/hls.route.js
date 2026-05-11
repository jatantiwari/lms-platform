"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const hls_controller_1 = require("../controllers/hls.controller");
const router = (0, express_1.Router)();
// Strict-optional auth: no token → free lectures still accessible;
// present-but-expired token → 401 so clients can refresh and retry;
// valid token → enrollment/ownership checked in the controller.
router.use(authenticate_1.strictOptionalAuthenticate);
router.get('/:lectureId/master.m3u8', hls_controller_1.streamMasterPlaylist);
router.get('/:lectureId/:filename', hls_controller_1.streamVariantPlaylist);
exports.default = router;
//# sourceMappingURL=hls.route.js.map