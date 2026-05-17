import { z } from 'zod';
export declare const sendDeviceTrustOtpSchema: z.ZodObject<{
    deviceId: z.ZodString;
    fingerprintHash: z.ZodString;
    appVersion: z.ZodOptional<z.ZodString>;
    simPhoneNumber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    simCarrier: z.ZodOptional<z.ZodString>;
    simSlot: z.ZodOptional<z.ZodNumber>;
    platform: z.ZodDefault<z.ZodEnum<["android", "ios", "web"]>>;
    isRooted: z.ZodDefault<z.ZodBoolean>;
    isEmulator: z.ZodDefault<z.ZodBoolean>;
    appHash: z.ZodOptional<z.ZodString>;
    clientOtp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    platform: "android" | "ios" | "web";
    deviceId: string;
    fingerprintHash: string;
    isEmulator: boolean;
    isRooted: boolean;
    simPhoneNumber: string;
    appVersion?: string | undefined;
    simCarrier?: string | undefined;
    simSlot?: number | undefined;
    appHash?: string | undefined;
    clientOtp?: string | undefined;
}, {
    deviceId: string;
    fingerprintHash: string;
    platform?: "android" | "ios" | "web" | undefined;
    isEmulator?: boolean | undefined;
    isRooted?: boolean | undefined;
    appVersion?: string | undefined;
    simPhoneNumber?: string | undefined;
    simCarrier?: string | undefined;
    simSlot?: number | undefined;
    appHash?: string | undefined;
    clientOtp?: string | undefined;
}>;
export declare const verifyDeviceTrustOtpSchema: z.ZodObject<{
    otp: z.ZodString;
    deviceId: z.ZodString;
    fingerprintHash: z.ZodString;
    appVersion: z.ZodOptional<z.ZodString>;
    simPhoneNumber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    simCarrier: z.ZodOptional<z.ZodString>;
    simSlot: z.ZodOptional<z.ZodNumber>;
    isRooted: z.ZodDefault<z.ZodBoolean>;
    isEmulator: z.ZodDefault<z.ZodBoolean>;
    nonce: z.ZodString;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    otp: string;
    deviceId: string;
    fingerprintHash: string;
    isEmulator: boolean;
    isRooted: boolean;
    simPhoneNumber: string;
    nonce: string;
    appVersion?: string | undefined;
    simCarrier?: string | undefined;
    simSlot?: number | undefined;
}, {
    timestamp: number;
    otp: string;
    deviceId: string;
    fingerprintHash: string;
    nonce: string;
    isEmulator?: boolean | undefined;
    isRooted?: boolean | undefined;
    appVersion?: string | undefined;
    simPhoneNumber?: string | undefined;
    simCarrier?: string | undefined;
    simSlot?: number | undefined;
}>;
export declare const checkDeviceTrustSchema: z.ZodObject<{
    deviceId: z.ZodString;
    fingerprintHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    fingerprintHash: string;
}, {
    deviceId: string;
    fingerprintHash: string;
}>;
export declare const initSmsVerifySchema: z.ZodObject<{
    deviceId: z.ZodString;
    fingerprintHash: z.ZodString;
    simPhoneNumber: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    simCarrier: z.ZodOptional<z.ZodString>;
    simSlot: z.ZodOptional<z.ZodNumber>;
    platform: z.ZodDefault<z.ZodEnum<["android", "ios", "web"]>>;
    isRooted: z.ZodDefault<z.ZodBoolean>;
    isEmulator: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    platform: "android" | "ios" | "web";
    deviceId: string;
    fingerprintHash: string;
    isEmulator: boolean;
    isRooted: boolean;
    simPhoneNumber: string;
    simCarrier?: string | undefined;
    simSlot?: number | undefined;
}, {
    deviceId: string;
    fingerprintHash: string;
    platform?: "android" | "ios" | "web" | undefined;
    isEmulator?: boolean | undefined;
    isRooted?: boolean | undefined;
    simPhoneNumber?: string | undefined;
    simCarrier?: string | undefined;
    simSlot?: number | undefined;
}>;
export declare const smsWebhookSchema: z.ZodObject<{
    From: z.ZodString;
    Body: z.ZodString;
    To: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    Body: string;
    From: string;
    To?: string | undefined;
}, {
    Body: string;
    From: string;
    To?: string | undefined;
}>;
export declare const updatePhoneSchema: z.ZodObject<{
    newPhone: z.ZodString;
    otp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    newPhone: string;
    otp?: string | undefined;
}, {
    newPhone: string;
    otp?: string | undefined;
}>;
export type SendDeviceTrustOtpInput = z.infer<typeof sendDeviceTrustOtpSchema>;
export type VerifyDeviceTrustOtpInput = z.infer<typeof verifyDeviceTrustOtpSchema>;
export type CheckDeviceTrustInput = z.infer<typeof checkDeviceTrustSchema>;
export type InitSmsVerifyInput = z.infer<typeof initSmsVerifySchema>;
export type SmsWebhookInput = z.infer<typeof smsWebhookSchema>;
export type UpdatePhoneInput = z.infer<typeof updatePhoneSchema>;
//# sourceMappingURL=deviceTrust.validation.d.ts.map