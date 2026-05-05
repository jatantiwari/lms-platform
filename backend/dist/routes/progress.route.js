"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progress_controller_1 = require("../controllers/progress.controller");
const authenticate_1 = require("../middleware/authenticate");
const router = (0, express_1.Router)();
router.use(authenticate_1.authenticate);
router.put('/lecture/:lectureId', progress_controller_1.updateProgress);
router.get('/course/:courseId', progress_controller_1.getCourseProgress);
exports.default = router;
//# sourceMappingURL=progress.route.js.map