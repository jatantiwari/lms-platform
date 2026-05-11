import { z } from 'zod';

// ─── Send OTP for device trust ─────────────────────────────────────────────────
export const sendDeviceTrustOtpSchema = z.object({
  deviceId: z.string().min(16).max(128),
  fingerprintHash: z.string().min(32).max(128),
  appVersion: z.string().max(32).optional(),
  /// Phone number as read from SIM (may be empty if Android cannot read it)
  simPhoneNumber: z.string().max(20).optional().default(''),
  simCarrier: z.string().max(64).optional(),
  simSlot: z.number().int().min(0).max(5).optional(),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
  isRooted: z.boolean().default(false),
  isEmulator: z.boolean().default(false),
});

// ─── Verify OTP + complete device trust ───────────────────────────────────────
export const verifyDeviceTrustOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/),
  deviceId: z.string().min(16).max(128),
  fingerprintHash: z.string().min(32).max(128),
  appVersion: z.string().max(32).optional(),
  simPhoneNumber: z.string().max(20).optional().default(''),
  simCarrier: z.string().max(64).optional(),
  simSlot: z.number().int().min(0).max(5).optional(),
  isRooted: z.boolean().default(false),
  isEmulator: z.boolean().default(false),
});

// ─── Check device trust status ────────────────────────────────────────────────
export const checkDeviceTrustSchema = z.object({
  deviceId: z.string().min(16).max(128),
  fingerprintHash: z.string().min(32).max(128),
});

// ─── One-time phone number update ─────────────────────────────────────────────
export const updatePhoneSchema = z.object({
  newPhone: z
    .string()
    .min(10, 'Phone number too short')
    .max(15, 'Phone number too long')
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format'),
  otp: z.string().length(6).regex(/^\d{6}$/).optional(),
});

export type SendDeviceTrustOtpInput = z.infer<typeof sendDeviceTrustOtpSchema>;
export type VerifyDeviceTrustOtpInput = z.infer<typeof verifyDeviceTrustOtpSchema>;
export type CheckDeviceTrustInput = z.infer<typeof checkDeviceTrustSchema>;
export type UpdatePhoneInput = z.infer<typeof updatePhoneSchema>;
