"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceBindingSchema = void 0;
const zod_1 = require("zod");
exports.deviceBindingSchema = zod_1.z.object({
    deviceId: zod_1.z
        .string()
        .min(16, 'deviceId too short')
        .max(128, 'deviceId too long')
        .regex(/^[a-f0-9]+$/i, 'deviceId must be hex'),
    fingerprintHash: zod_1.z
        .string()
        .min(32, 'fingerprintHash too short')
        .max(128, 'fingerprintHash too long')
        .regex(/^[a-f0-9]+$/i, 'fingerprintHash must be hex'),
    buildFingerprint: zod_1.z.string().max(512).optional(),
    model: zod_1.z.string().max(128).optional(),
    manufacturer: zod_1.z.string().max(128).optional(),
    sdkVersion: zod_1.z.number().int().min(1).max(99).optional(),
    osName: zod_1.z.string().max(64).optional(),
    osVersion: zod_1.z.string().max(64).optional(),
    platform: zod_1.z.enum(['android', 'ios', 'web']),
    isEmulator: zod_1.z.boolean().optional().default(false),
    isRooted: zod_1.z.boolean().optional().default(false),
    isDeveloperOptionsEnabled: zod_1.z.boolean().optional().default(false),
});
//# sourceMappingURL=deviceBinding.validation.js.map