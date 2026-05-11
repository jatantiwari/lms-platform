// ─── SIM Card ─────────────────────────────────────────────────────────────────

export interface SimCardInfo {
  /** SIM slot index (0 = primary, 1 = secondary) */
  slotIndex: number;
  /** Carrier name, e.g. "Jio", "Airtel" */
  carrierName: string;
  /** E.164 phone number if readable (may be empty on Android 13+) */
  phoneNumber: string;
  /** MCC+MNC string, e.g. "40486" */
  mccMnc: string;
  /** ISO country code, e.g. "in" */
  countryIso: string;
  /** Subscription ID from Android SubscriptionManager */
  subscriptionId: number;
  /** Whether this SIM is the default for SMS */
  isDefaultSms: boolean;
}

// ─── Device Fingerprint ────────────────────────────────────────────────────────

export interface DeviceFingerprint {
  /** Stable hardware-derived ID (ANDROID_ID + Build constants) */
  deviceId: string;
  /** SHA-256 of combined hardware identifiers */
  fingerprintHash: string;
  /** Android Build.FINGERPRINT */
  buildFingerprint: string;
  /** Device model, e.g. "Pixel 7" */
  model: string;
  /** Device manufacturer */
  manufacturer: string;
  /** Android SDK level */
  sdkVersion: number;
  /** ANDROID_ID (resets on factory reset) */
  androidId: string;
  /** Advertising ID unavailability flag */
  isLimitAdTracking: boolean;
}

// ─── Security Checks ──────────────────────────────────────────────────────────

export interface SecurityStatus {
  isRooted: boolean;
  isEmulator: boolean;
  isDebuggable: boolean;
  /** App signature valid (detects repackaging) */
  isSignatureValid: boolean;
  /** Developer options enabled */
  isDeveloperOptionsEnabled: boolean;
  /** USB debugging active */
  isAdbEnabled: boolean;
}

// ─── SMS Retriever ─────────────────────────────────────────────────────────────

export interface SmsRetrieverResult {
  /** Full raw SMS body */
  message: string;
  /** Extracted OTP digits (regex: 4–8 consecutive digits) */
  otp: string | null;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type SimVerificationEvents = {
  onSmsReceived: (result: SmsRetrieverResult) => void;
  onSmsTimeout: () => void;
  onSmsError: (error: { code: string; message: string }) => void;
};
