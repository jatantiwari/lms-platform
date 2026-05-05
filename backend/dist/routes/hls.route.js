"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const hls_controller_1 = require("../controllers/hls.controller");
const router = (0, express_1.Router)();
// Optional auth: free lectures are accessible without login;
// paid lectures require authentication + enrollment (enforced in the controller).
router.use(authenticate_1.optionalAuthenticate);
router.get('/:lectureId/master.m3u8', hls_controller_1.streamMasterPlaylist);
router.get('/:lectureId/:filename', hls_controller_1.streamVariantPlaylist);
exports.default = router;
//# sourceMappingURL=hls.route.js.map