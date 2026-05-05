"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lecture_controller_1 = require("../controllers/lecture.controller");
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const upload_1 = require("../middleware/upload");
const validate_1 = require("../middleware/validate");
const lecture_validation_1 = require("../validations/lecture.validation");
// mergeParams allows access to :courseId and :sectionId from parent router
const router = (0, express_1.Router)({ mergeParams: true });
router.use(authenticate_1.authenticate);
// Student: view a single lecture (enrollment-gated in controller)
router.get('/:lectureId', lecture_controller_1.getLecture);
// Transcript (student or owner)
router.get('/:lectureId/transcript', lecture_controller_1.getTranscript);
// Instructor / Admin management
router.post('/', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(lecture_validation_1.createLectureSchema), lecture_controller_1.createLecture);
router.put('/reorder', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(lecture_validation_1.reorderLecturesSchema), lecture_controller_1.reorderLectures);
router.put('/:lectureId', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), (0, validate_1.validate)(lecture_validation_1.updateLectureSchema), lecture_controller_1.updateLecture);
router.delete('/:lectureId', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), lecture_controller_1.deleteLecture);
// Video upload (large file — uses memoryStorage; consider streaming for production)
router.post('/:lectureId/video', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), upload_1.upload.single('video'), lecture_controller_1.uploadVideo);
// Attachment upload (PDFs, ZIPs, docs, etc.)
router.post('/:lectureId/attachments', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), upload_1.uploadAttachment.single('file'), lecture_controller_1.uploadAttachment);
// Remove a resource (attachment or link) by URL
router.delete('/:lectureId/resources', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), lecture_controller_1.deleteResource);
// Timestamp quiz questions
router.post('/:lectureId/questions', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), lecture_controller_1.addQuestion);
router.delete('/:lectureId/questions/:questionId', (0, authorize_1.authorize)('INSTRUCTOR', 'ADMIN'), lecture_controller_1.deleteQuestion);
exports.default = router;
//# sourceMappingURL=lecture.route.js.map