/**
 * React Native wrapper for the SimVerification native module.
 *
 * Provides typed, Promise-based access to SIM info, device fingerprint,
 * security checks, and the SMS Retriever / User Consent APIs.
 */
import * as SimVerificationModule from '../../modules/sim-verification';
import type {
  SimCardInfo,
  DeviceFingerprint,
  SecurityStatus,
  SmsRetrieverResult,
} from '../../modules/sim-verification';

export { SimCardInfo, DeviceFingerprint, SecurityStatus, SmsRetrieverResult };

// ─── SIM Cards ─────────────────────────────────────────────────────────────────

/**
 * Returns all active SIM subscriptions on the device.
 * Android only — requires READ_PHONE_STATE runtime permission.
 */
export const getSimCards = () => SimVerificationModule.getSimCards();

export const getDefaultSmsSimSlot = () => SimVerificationModule.getDefaultSmsSimSlot();

// ─── Device Fingerprint ────────────────────────────────────────────────────────

/**
 * Returns a stable, hardware-derived device fingerprint.
 * Does NOT require special permissions.
 * Send this to the backend to bind the session to this device.
 */
export const getDeviceFingerprint = () => SimVerificationModule.getDeviceFingerprint();

// ─── Security ─────────────────────────────────────────────────────────────────

/**
 * Returns security check results.
 * Use to block rooted/emulator devices from sensitive flows.
 */
export const getSecurityStatus = () => SimVerificationModule.getSecurityStatus();

// ─── App Hash ─────────────────────────────────────────────────────────────────

/**
 * Returns the 11-character SMS Retriever app hash.
 * Send this to the backend so it can append it to the OTP SMS.
 */
export const getAppHash = () => SimVerificationModule.getAppHash();

// ─── SMS Retriever ─────────────────────────────────────────────────────────────

/**
 * Starts the SMS Retriever API (silent, no UI, no permissions needed).
 * Call before triggering OTP send on the backend.
 * Listen for events via addSmsReceivedListener.
 */
export const startSmsRetriever = () => SimVerificationModule.startSmsRetriever();

export const stopSmsRetriever = () => SimVerificationModule.stopSmsRetriever();

/**
 * Starts the User Consent API (shows system dialog).
 * Use as fallback if SMS Retriever fails.
 */
export const startSmsUserConsent = (senderPhone?: string) =>
  SimVerificationModule.startSmsUserConsent(senderPhone);

/**
 * Sends an SMS FROM the device SIM to the backend's verification number.
 * Proves SIM ownership without the user having to enter anything.
 * Requires SEND_SMS runtime permission.
 */
export const sendSmsForVerification = (
  targetNumber: string,
  message: string,
  simSlotIndex: number,
) => SimVerificationModule.sendSmsForVerification(targetNumber, message, simSlotIndex);

// ─── Event Listeners ──────────────────────────────────────────────────────────

export const onSmsReceived = SimVerificationModule.addSmsReceivedListener;
export const onSmsTimeout = SimVerificationModule.addSmsTimeoutListener;
export const onSmsError = SimVerificationModule.addSmsErrorListener;

export const isSmsRetrieverSupported = SimVerificationModule.isSmsRetrieverSupported;
