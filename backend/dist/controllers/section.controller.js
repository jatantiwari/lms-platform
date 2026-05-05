"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderSections = exports.deleteSection = exports.updateSection = exports.createSection = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const response_1 = require("../utils/response");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../config/prisma"));
// ─── Helper ───────────────────────────────────────────────────────────────────
async function assertCourseOwner(courseId, userId, userRole) {
    const course = await prisma_1.default.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
    });
    if (!course)
        throw new AppError_1.NotFoundError('Course');
    if (course.instructorId !== userId && userRole !== 'ADMIN') {
        throw new AppError_1.ForbiddenError('You do not own this course');
    }
}
// ─── Create Section ───────────────────────────────────────────────────────────
exports.createSection = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId } = req.params;
    const { title, order } = req.body;
    await assertCourseOwner(courseId, req.user.userId, req.user.role);
    // Auto-assign order if not provided
    const lastSection = await prisma_1.default.section.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
    });
    const sectionOrder = order ?? (lastSection ? lastSection.order + 1 : 0);
    const section = await prisma_1.default.section.create({
        data: { title, order: sectionOrder, courseId },
        include: { lectures: true },
    });
    (0, response_1.sendSuccess)(res, section, 'Section created', 201);
});
// ─── Update Section ────────────────────────────────────────────────────────────
exports.updateSection = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId, sectionId } = req.params;
    await assertCourseOwner(courseId, req.user.userId, req.user.role);
    const section = await prisma_1.default.section.findFirst({
        where: { id: sectionId, courseId },
    });
    if (!section)
        throw new AppError_1.NotFoundError('Section');
    const updated = await prisma_1.default.section.update({
        where: { id: sectionId },
        data: req.body,
        include: { lectures: { orderBy: { order: 'asc' } } },
    });
    (0, response_1.sendSuccess)(res, updated, 'Section updated');
});
// ─── Delete Section ────────────────────────────────────────────────────────────
exports.deleteSection = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId, sectionId } = req.params;
    await assertCourseOwner(courseId, req.user.userId, req.user.role);
    const section = await prisma_1.default.section.findFirst({ where: { id: sectionId, courseId } });
    if (!section)
        throw new AppError_1.NotFoundError('Section');
    await prisma_1.default.section.delete({ where: { id: sectionId } });
    (0, response_1.sendSuccess)(res, null, 'Section deleted');
});
// ─── Reorder Sections ─────────────────────────────────────────────────────────
exports.reorderSections = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId } = req.params;
    const { sections } = req.body;
    await assertCourseOwner(courseId, req.user.userId, req.user.role);
    await prisma_1.default.$transaction(sections.map(({ id, order }) => prisma_1.default.section.update({ where: { id }, data: { order } })));
    (0, response_1.sendSuccess)(res, null, 'Sections reordered');
});
//# sourceMappingURL=section.controller.js.map