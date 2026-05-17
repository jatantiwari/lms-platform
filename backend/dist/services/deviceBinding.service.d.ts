import type { DeviceBindingInput } from '../validations/deviceBinding.validation';
export interface DeviceBindingResult {
    isNewDevice: boolean;
    requiresReverification: boolean;
    deviceBindingId: string;
    sessionToken: string;
    /** Whether the device was blocked (rooted/emulator policy) */
    blocked?: boolean;
    blockReason?: string;
}
export declare const deviceBindingService: {
    /**
     * Registers or validates a device for a user.
     *
     * Called on every login from the mobile app.
     * Returns isNewDevice=true when the fingerprint doesn't match any
     * previously registered device for this user.
     */
    registerOrValidateDevice(userId: string, payload: DeviceBindingInput): Promise<DeviceBindingResult>;
    /**
     * Validates that a request is coming from the expected device.
     * Called on sensitive operations (payment, account change).
     */
    validateDeviceSession(userId: string, deviceId: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    /**
     * Lists all active devices for a user (for device management screen).
     */
    getUserDevices(userId: string): Promise<any>;
    /**
     * Revokes a device (user-initiated from device management screen).
     */
    revokeDevice(userId: string, deviceBindingId: string): Promise<void>;
    /**
     * Called after successful phone OTP verification.
     * Clears the requiresReverification flag for the device.
     */
    markDeviceVerified(userId: string, deviceId: string): Promise<void>;
};
//# sourceMappingURL=deviceBinding.service.d.ts.map