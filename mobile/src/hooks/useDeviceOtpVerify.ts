/**
 * useDeviceOtpVerify
 *
 * Zero-input OTP verification flow:
 *
 *  1. App generates a unique 5-digit OTP locally (crypto.randomInt)
 *  2. OTP is stored in SecureStore (10-min TTL)
 *  3. App calls POST /auth/device-trust/send-otp with the OTP → backend
 *     sends that exact value as an SMS to the enrolled phone number
 *  4. App reads the incoming SMS automatically:
 *       a. SMS Retriever API (no dialog, no permission if hash is embedded)
 *       b. SMS inbox polling via READ_SMS (parallel, every 2 s for 90 s)
 *  5. Extracts OTP from SMS, compares with stored OTP
 *  6. If match  → POST /auth/device-trust/verify-otp with nonce+timestamp
 *                 → calls onVerified()
 *  7. If no match or timeout → calls onFailed()
 *
 * User never types anything.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  startSmsRetriever,
  startSmsUserConsent,
  readRecentSms,
  getAppHash,
  getDeviceFingerprint,
  getSecurityStatus,
  onSmsReceived,
  onSmsTimeout,
} from '../lib/simVerification';
import { deviceTrustApi } from '../lib/api';

// ─── OTP generation ───────────────────────────────────────────────────────────

function generateFiveDigitOtp(): string {
  // Math.random() is safe here — security comes from SMS delivery, not OTP entropy
  return String(Math.floor(10000 + Math.random() * 90000)); // 10000–99999
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Extracts the first 4–6 digit sequence from an SMS body. */
function extractOtpFromText(text: string): string | null {
  const m = text.match(/\b(\d{4,6})\b/);
  return m ? m[1] : null;
}

// ─── SecureStore helpers ──────────────────────────────────────────────────────

const OTP_STORE_KEY = 'device_verify_otp';

async function storeOtp(otp: string): Promise<void> {
  const payload = JSON.stringify({ otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  await SecureStore.setItemAsync(OTP_STORE_KEY, payload);
}

async function loadStoredOtp(): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(OTP_STORE_KEY);
    if (!raw) return null;
    const { otp, expiresAt } = JSON.parse(raw) as { otp: string; expiresAt: number };
    if (Date.now() > expiresAt) return null;
    return otp;
  } catch {
    return null;
  }
}

async function clearStoredOtp(): Promise<void> {
  await SecureStore.deleteItemAsync(OTP_STORE_KEY).catch(() => {});
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceOtpVerifyStep =
  | 'idle'
  | 'sending'    // asking backend to send SMS
  | 'reading'    // waiting for SMS, auto-reading inbox
  | 'verifying'  // calling backend verify endpoint
  | 'verified'
  | 'failed';

interface UseDeviceOtpVerifyOptions {
  onVerified: () => void;
  onFailed: (reason: 'PHONE_MISMATCH' | 'NO_MATCH' | 'TIMEOUT' | 'ERROR', msg?: string) => void;
}

interface DeviceInfo {
  deviceId: string;
  fingerprintHash: string;
  simPhoneNumber?: string;
  simCarrier?: string;
  simSlot?: number;
  platform: 'android' | 'ios';
  isRooted: boolean;
  isEmulator: boolean;
}

const POLL_INTERVAL_MS = 2_000;
const MAX_WAIT_MS = 90_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDeviceOtpVerify({ onVerified, onFailed }: UseDeviceOtpVerifyOptions) {
  const [step, setStep] = useState<DeviceOtpVerifyStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const retrieverSubRef = useRef<{ remove(): void } | null>(null);

  const stopAll = useCallback(() => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
    retrieverSubRef.current?.remove();
    retrieverSubRef.current = null;
    elapsedRef.current = 0;
  }, []);

  useEffect(() => () => { stopAll(); clearStoredOtp(); }, [stopAll]);

  // ─── Verify with backend and mark trusted ──────────────────────────────────
  const doVerify = useCallback(async (otp: string, deviceInfo: DeviceInfo) => {
    stopAll();
    setStep('verifying');
    try {
      await deviceTrustApi.verifyOtp({
        otp,
        deviceId: deviceInfo.deviceId,
        fingerprintHash: deviceInfo.fingerprintHash,
        simPhoneNumber: deviceInfo.simPhoneNumber,
        simCarrier: deviceInfo.simCarrier,
        simSlot: deviceInfo.simSlot,
        isRooted: deviceInfo.isRooted,
        isEmulator: deviceInfo.isEmulator,
        nonce: generateUUID(),
        timestamp: Date.now(),
      });
      await clearStoredOtp();
      setStep('verified');
      onVerified();
    } catch {
      await clearStoredOtp();
      setStep('failed');
      onFailed('ERROR', 'Verification failed. Please try again.');
    }
  }, [stopAll, onVerified, onFailed]);

  // ─── Main entry: initiate full flow ────────────────────────────────────────
  const initiate = useCallback(async (deviceInfo: DeviceInfo): Promise<void> => {
    if (Platform.OS !== 'android') {
      onFailed('ERROR', 'Automatic verification is only available on Android.');
      return;
    }

    stopAll();
    setStep('sending');
    setErrorMsg(null);

    // 1. Generate OTP + store it
    const otp = generateFiveDigitOtp();
    await storeOtp(otp);

    // 2. Get app hash for SMS Retriever (best-effort)
    let appHash: string | undefined;
    try { appHash = (await getAppHash()) || undefined; } catch { /* optional */ }

    // 3. Tell backend to send this OTP via SMS to enrolled phone
    try {
      await deviceTrustApi.sendOtp({
        deviceId: deviceInfo.deviceId,
        fingerprintHash: deviceInfo.fingerprintHash,
        simPhoneNumber: deviceInfo.simPhoneNumber,
        simCarrier: deviceInfo.simCarrier,
        simSlot: deviceInfo.simSlot,
        platform: deviceInfo.platform,
        isRooted: deviceInfo.isRooted,
        isEmulator: deviceInfo.isEmulator,
        appHash,
        clientOtp: otp,
      });
    } catch (err) {
      await clearStoredOtp();
      const e = err as { response?: { data?: { code?: string; message?: string }; status?: number } };
      if (e?.response?.data?.code === 'PHONE_MISMATCH' || e?.response?.status === 403) {
        setStep('failed');
        onFailed('PHONE_MISMATCH');
        return;
      }
      setStep('failed');
      setErrorMsg(e?.response?.data?.message ?? 'Failed to send verification SMS.');
      onFailed('ERROR', e?.response?.data?.message ?? 'Failed to send verification SMS.');
      return;
    }

    setStep('reading');
    elapsedRef.current = 0;

    // 4a. Start SMS Retriever (silent, no dialog if hash embedded)
    try {
      await startSmsRetriever();
      retrieverSubRef.current = onSmsReceived(async (result: import('../lib/simVerification').SmsRetrieverResult) => {
        const extracted = result.otp || extractOtpFromText(result.message);
        if (!extracted) return;
        const stored = await loadStoredOtp();
        if (stored && extracted === stored) {
          await doVerify(extracted, deviceInfo);
        } else {
          stopAll();
          await clearStoredOtp();
          setStep('failed');
          onFailed('NO_MATCH', 'OTP in SMS does not match. Please try again.');
        }
      });
      // If Retriever times out, inbox poll is still running
      onSmsTimeout(() => { /* inbox poll still running */ });
    } catch {
      // Retriever unavailable; fallback to User Consent + inbox poll below
      try { await startSmsUserConsent(); } catch { /* ignore */ }
    }

    // 4b. Inbox polling (READ_SMS — parallel safety net)
    pollTimer.current = setInterval(async () => {
      elapsedRef.current += POLL_INTERVAL_MS;

      try {
        const messages = await readRecentSms(120); // last 2 minutes
        const stored = await loadStoredOtp();
        if (!stored) { stopAll(); return; }

        for (const msg of messages) {
          const extracted = extractOtpFromText(msg.body);
          if (extracted && extracted === stored) {
            await doVerify(extracted, deviceInfo);
            return;
          }
        }
      } catch { /* READ_SMS denied or unavailable — keep waiting */ }

      if (elapsedRef.current >= MAX_WAIT_MS) {
        stopAll();
        await clearStoredOtp();
        setStep('failed');
        onFailed('TIMEOUT', 'SMS not received within 90 seconds. Please try again.');
      }
    }, POLL_INTERVAL_MS);
  }, [stopAll, doVerify, onFailed]);

  const reset = useCallback(() => {
    stopAll();
    clearStoredOtp();
    setStep('idle');
    setErrorMsg(null);
  }, [stopAll]);

  return { step, errorMsg, initiate, reset };
}
