import { z } from 'zod';

export const deviceBindingSchema = z.object({
  deviceId: z
    .string()
    .min(16, 'deviceId too short')
    .max(128, 'deviceId too long')
    .regex(/^[a-f0-9]+$/i, 'deviceId must be hex'),

  fingerprintHash: z
    .string()
    .min(32, 'fingerprintHash too short')
    .max(128, 'fingerprintHash too long')
    .regex(/^[a-f0-9]+$/i, 'fingerprintHash must be hex'),

  buildFingerprint: z.string().max(512).optional(),
  model: z.string().max(128).optional(),
  manufacturer: z.string().max(128).optional(),
  sdkVersion: z.number().int().min(1).max(99).optional(),
  osName: z.string().max(64).optional(),
  osVersion: z.string().max(64).optional(),

  platform: z.enum(['android', 'ios', 'web']),

  isEmulator: z.boolean().optional().default(false),
  isRooted: z.boolean().optional().default(false),
  isDeveloperOptionsEnabled: z.boolean().optional().default(false),
});

export type DeviceBindingInput = z.infer<typeof deviceBindingSchema>;
