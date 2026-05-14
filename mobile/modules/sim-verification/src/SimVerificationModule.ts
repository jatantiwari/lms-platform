import { EventEmitter, requireOptionalNativeModule, Platform } from 'expo-modules-core';
import type {
  SimCardInfo,
  DeviceFingerprint,
  SecurityStatus,
  SmsRetrieverResult,
  SimVerificationEvents,
} from './SimVerificationModule.types';

// ─── Load native module safely ─────────────────────────────────────────────────
const NativeModule = requireOptionalNativeModule<{
  // SIM
  getSimCards(): Promise<SimCardInfo[]>;
  getDefaultSmsSimSlot(): Promise<number>;

  // Device fingerprint
  getDeviceFingerprint(): Promise<DeviceFingerprint>;

  // Security
  getSecurityStatus(): Promise<SecurityStatus>;

  // App hash (for SMS Retriever)
  getAppHash(): Promise<string>;

  // SMS Retriever lifecycle
  startSmsRetriever(): Promise<boolean>;
  stopSmsRetriever(): Promise<void>;

  // User Consent API (shows system dialog)
  startSmsUserConsent(senderPhone?: string): Promise<boolean>;

  // Mobile-originated SMS verification
  sendSmsForVerification(targetNumber: string, message: string, simSlotIndex: number): Promise<boolean>;
}>('SimVerification');

const emitter = NativeModule
  ? new EventEmitter<SimVerificationEvents>(NativeModule as any)
  : null;

// ─── Stub for non-Android / missing native module ─────────────────────────────

const isSupported = Platform.OS === 'android' && NativeModule !== null;

function notSupported<T>(fallback: T): Promise<T> {
  console.warn('[SimVerification] Native module not available on this platform/build.');
  return Promise.resolve(fallback);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns list of SIM cards inserted in the device.
 * Requires READ_PHONE_STATE runtime permission on Android ≥ 6.
 */
export async function getSimCards(): Promise<SimCardInfo[]> {
  if (!isSupported) return notSupported([]);
  return NativeModule!.getSimCards();
}

/**
 * Returns the SIM slot index set as default for SMS.
 * Returns -1 if only one SIM / unavailable.
 */
export async function getDefaultSmsSimSlot(): Promise<number> {
  if (!isSupported) return notSupported(-1);
  return NativeModule!.getDefaultSmsSimSlot();
}

/**
 * Returns a stable device fingerprint derived from hardware identifiers.
 * No special permissions required; uses ANDROID_ID + Build constants.
 */
export async function getDeviceFingerprint(): Promise<DeviceFingerprint | null> {
  if (!isSupported) return notSupported(null);
  return NativeModule!.getDeviceFingerprint();
}

/**
 * Returns security check results: rooted, emulator, debuggable, signature valid.
 */
export async function getSecurityStatus(): Promise<SecurityStatus | null> {
  if (!isSupported) return notSupported(null);
  return NativeModule!.getSecurityStatus();
}

/**
 * Returns the 11-character SMS Retriever app hash that must be appended to
 * the end of the OTP SMS sent by the backend.
 * Example SMS body: "Your ADI OTP is 123456\n\nFA+9qCX9VSu"
 */
export async function getAppHash(): Promise<string> {
  if (!isSupported) return notSupported('');
  return NativeModule!.getAppHash();
}

/**
 * Starts the SMS Retriever API listener (5-min window).
 * Does NOT require READ_SMS or RECEIVE_SMS permissions.
 * Use this for automatic silent OTP reading (Google Pay style).
 * Emits `onSmsReceived` when SMS arrives.
 */
export async function startSmsRetriever(): Promise<boolean> {
  if (!isSupported) return notSupported(false);
  return NativeModule!.startSmsRetriever();
}

/**
 * Stops the SMS Retriever listener.
 */
export async function stopSmsRetriever(): Promise<void> {
  if (!isSupported) return notSupported(undefined as void);
  return NativeModule!.stopSmsRetriever();
}

/**
 * Starts the SMS User Consent API — shows a system dialog asking the user
 * to consent to sharing a specific incoming SMS.
 * More user-visible than SMS Retriever but works without hash in SMS.
 * @param senderPhone optional sender phone number to filter
 */
export async function startSmsUserConsent(senderPhone?: string): Promise<boolean> {
  if (!isSupported) return notSupported(false);
  return NativeModule!.startSmsUserConsent(senderPhone);
}

/**
 * Sends an SMS FROM the device SIM to the backend's verification number.
 * Proves that the user's enrolled SIM is physically present in this device.
 *
 * Requires SEND_SMS permission (requested by useSimPermissions hook).
 *
 * @param targetNumber  Backend's virtual phone number
 * @param message       "ADI-VERIFY <sessionToken>" — must be sent verbatim
 * @param simSlotIndex  0 = SIM 1, 1 = SIM 2 (dual-SIM devices)
 */
export async function sendSmsForVerification(
  targetNumber: string,
  message: string,
  simSlotIndex: number,
): Promise<boolean> {
  if (!isSupported) return notSupported(false);
  return NativeModule!.sendSmsForVerification(targetNumber, message, simSlotIndex);
}

/**
 * Subscribe to SMS received events from SMS Retriever or User Consent API.
 */
export function addSmsReceivedListener(
  callback: (result: SmsRetrieverResult) => void,
) {
  return emitter?.addListener('onSmsReceived', callback) ?? { remove: () => {} };
}

export function addSmsTimeoutListener(callback: () => void) {
  return emitter?.addListener('onSmsTimeout', callback) ?? { remove: () => {} };
}

export function addSmsErrorListener(
  callback: (error: { code: string; message: string }) => void,
) {
  return emitter?.addListener('onSmsError', callback) ?? { remove: () => {} };
}

export { isSupported as isSmsRetrieverSupported };
export type { SimCardInfo, DeviceFingerprint, SecurityStatus, SmsRetrieverResult };
