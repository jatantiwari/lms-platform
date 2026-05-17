import { z } from 'zod';
export declare const deviceBindingSchema: z.ZodObject<{
    deviceId: z.ZodString;
    fingerprintHash: z.ZodString;
    buildFingerprint: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    manufacturer: z.ZodOptional<z.ZodString>;
    sdkVersion: z.ZodOptional<z.ZodNumber>;
    osName: z.ZodOptional<z.ZodString>;
    osVersion: z.ZodOptional<z.ZodString>;
    platform: z.ZodEnum<["android", "ios", "web"]>;
    isEmulator: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isRooted: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isDeveloperOptionsEnabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    platform: "android" | "ios" | "web";
    deviceId: string;
    fingerprintHash: string;
    isEmulator: boolean;
    isRooted: boolean;
    isDeveloperOptionsEnabled: boolean;
    model?: string | undefined;
    buildFingerprint?: string | undefined;
    manufacturer?: string | undefined;
    sdkVersion?: number | undefined;
    osName?: string | undefined;
    osVersion?: string | undefined;
}, {
    platform: "android" | "ios" | "web";
    deviceId: string;
    fingerprintHash: string;
    model?: string | undefined;
    buildFingerprint?: string | undefined;
    manufacturer?: string | undefined;
    sdkVersion?: number | undefined;
    osName?: string | undefined;
    osVersion?: string | undefined;
    isEmulator?: boolean | undefined;
    isRooted?: boolean | undefined;
    isDeveloperOptionsEnabled?: boolean | undefined;
}>;
export type DeviceBindingInput = z.infer<typeof deviceBindingSchema>;
//# sourceMappingURL=deviceBinding.validation.d.ts.map