/**
 * useDeviceSmsVerify
 *
 * Handles the mobile-originated SMS verification flow:
 *  1. Calls backend to get session token + target number + SMS body
 *  2. Sends SMS from device SIM via SmsManager
 *  3. Polls backend every 2 s (up to 45 s) for webhook confirmation
 *  4. On success  → calls onVerified()
 *  5. On timeout / send failure → calls onFallbackToOtp()
 *
 * The SMS Retriever is started BEFORE sending the verification SMS,
 * so the backend's confirmation OTP (if any) is auto-read.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { sendSmsForVerification } from '../lib/simVerification';
import { deviceTrustApi, InitSmsVerifyPayload } from '../lib/api';

export type SmsVerifyStep =
  | 'idle'
  | 'requesting'   // calling init-sms-verify
  | 'sending'      // sending SMS from device SIM
  | 'waiting'      // polling backend
  | 'verified'
  | 'failed';

interface UseDeviceSmsVerifyOptions {
  onVerified: (deviceBindingHint?: string) => void;
  onFallbackToOtp: () => void;
}

const POLL_INTERVAL_MS = 2_000;
const MAX_WAIT_MS = 45_000;

export function useDeviceSmsVerify({ onVerified, onFallbackToOtp }: UseDeviceSmsVerifyOptions) {
  const [step, setStep] = useState<SmsVerifyStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    elapsedRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const fallback = useCallback(() => {
    stopPolling();
    onFallbackToOtp();
  }, [stopPolling, onFallbackToOtp]);

  /**
   * Main entry point — called when user taps "Verify Device".
   * @param payload    Device info collected by the modal
   * @param simSlotIndex  The slot of the SIM to send from
   */
  const initiate = useCallback(
    async (
      payload: InitSmsVerifyPayload & { simSlotIndex: number },
    ): Promise<void> => {
      if (Platform.OS !== 'android') {
        // iOS: no SmsManager → go straight to OTP
        fallback();
        return;
      }

      setStep('requesting');
      setErrorMsg(null);

      // ── Step 1: get session from backend ─────────────────────────────────────
      let sessionToken: string;
      let targetNumber: string;
      let smsBody: string;

      try {
        const { data } = await deviceTrustApi.initSmsVerify({
          deviceId: payload.deviceId,
          fingerprintHash: payload.fingerprintHash,
          simPhoneNumber: payload.simPhoneNumber,
          simCarrier: payload.simCarrier,
          simSlot: payload.simSlot,
          platform: payload.platform,
          isRooted: payload.isRooted,
          isEmulator: payload.isEmulator,
        });
        const session = data.data as { sessionToken: string; targetNumber: string; smsBody: string };
        sessionToken = session.sessionToken;
        targetNumber = session.targetNumber;
        smsBody = session.smsBody;
      } catch (err) {
        const e = err as { response?: { data?: { code?: string; message?: string }; status?: number } };
        if (e?.response?.data?.code === 'PHONE_MISMATCH' || e?.response?.status === 403) {
          // Surface mismatch error to the modal — don't fall back to OTP
          setStep('failed');
          setErrorMsg('PHONE_MISMATCH');
          return;
        }
        if (e?.response?.status === 503) {
          // Feature not configured on server → fall back to OTP silently
          fallback();
          return;
        }
        setStep('failed');
        setErrorMsg(e?.response?.data?.message ?? 'Failed to initiate verification');
        fallback();
        return;
      }

      // ── Step 2: send SMS from device SIM ──────────────────────────────────────
      setStep('sending');
      try {
        await sendSmsForVerification(targetNumber, smsBody, payload.simSlotIndex);
      } catch {
        // SMS send failed (permission denied, SIM error) → fall back to OTP
        fallback();
        return;
      }

      // ── Step 3: poll for backend confirmation ────────────────────────────────
      setStep('waiting');
      elapsedRef.current = 0;

      pollTimer.current = setInterval(async () => {
        elapsedRef.current += POLL_INTERVAL_MS;

        try {
          const { data } = await deviceTrustApi.smsVerifyStatus(sessionToken);
          const status = data.data as { verified: boolean; expired: boolean };

          if (status.verified) {
            stopPolling();
            setStep('verified');
            onVerified();
            return;
          }

          if (status.expired || elapsedRef.current >= MAX_WAIT_MS) {
            stopPolling();
            fallback();
          }
        } catch {
          if (elapsedRef.current >= MAX_WAIT_MS) {
            stopPolling();
            fallback();
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling, fallback, onVerified],
  );

  const reset = useCallback(() => {
    stopPolling();
    setStep('idle');
    setErrorMsg(null);
  }, [stopPolling]);

  return { step, errorMsg, initiate, reset };
}
