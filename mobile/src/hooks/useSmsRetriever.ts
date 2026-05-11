/**
 * useSmsRetriever — React hook for automatic OTP reading via SMS Retriever API.
 *
 * ── Flow ─────────────────────────────────────────────────────────────────
 * 1. Component mounts → hook calls startSmsRetriever()
 * 2. Component triggers OTP send to backend (via sendOtp prop/callback)
 * 3. Backend sends SMS ending with app hash to user's phone
 * 4. Google Play Services reads SMS silently → onSmsReceived fires
 * 5. Hook extracts OTP and calls onOtpDetected callback
 * 6. Component auto-fills OTP field
 * ────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import {
  startSmsRetriever,
  stopSmsRetriever,
  startSmsUserConsent,
  onSmsReceived,
  onSmsTimeout,
  onSmsError,
  isSmsRetrieverSupported,
} from '../lib/simVerification';

export type SmsRetrieverStatus =
  | 'idle'
  | 'listening'
  | 'received'
  | 'timeout'
  | 'error'
  | 'unsupported';

interface UseSmsRetrieverOptions {
  /** Called when OTP is successfully extracted from SMS */
  onOtpDetected: (otp: string) => void;
  /** Called when raw SMS is received (for logging/analytics) */
  onRawSmsReceived?: (message: string) => void;
  /** Whether to auto-start the retriever on mount */
  autoStart?: boolean;
  /** Use User Consent API as fallback (shows dialog) */
  fallbackToUserConsent?: boolean;
  /** Sender phone number filter for User Consent API */
  senderPhone?: string;
}

export function useSmsRetriever({
  onOtpDetected,
  onRawSmsReceived,
  autoStart = true,
  fallbackToUserConsent = true,
  senderPhone,
}: UseSmsRetrieverOptions) {
  const [status, setStatus] = useState<SmsRetrieverStatus>(
    isSmsRetrieverSupported ? 'idle' : 'unsupported'
  );
  const [error, setError] = useState<string | null>(null);

  // Stable callback refs to avoid re-registering listeners on every render
  const onOtpRef = useRef(onOtpDetected);
  const onRawRef = useRef(onRawSmsReceived);
  useEffect(() => { onOtpRef.current = onOtpDetected; }, [onOtpDetected]);
  useEffect(() => { onRawRef.current = onRawSmsReceived; }, [onRawSmsReceived]);

  const startRetriever = useCallback(async () => {
    if (!isSmsRetrieverSupported) {
      setStatus('unsupported');
      return false;
    }

    try {
      const started = await startSmsRetriever();
      if (started) {
        setStatus('listening');
        setError(null);
      }
      return started;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to start SMS Retriever';

      // Fallback: try User Consent API
      if (fallbackToUserConsent) {
        try {
          const consentStarted = await startSmsUserConsent(senderPhone);
          if (consentStarted) {
            setStatus('listening');
            setError(null);
            return true;
          }
        } catch (_) {
          // User Consent also failed — continue to error state
        }
      }

      setStatus('error');
      setError(message);
      return false;
    }
  }, [fallbackToUserConsent, senderPhone]);

  const stopRetriever = useCallback(async () => {
    await stopSmsRetriever();
    if (status === 'listening') setStatus('idle');
  }, [status]);

  // ─── Register event listeners ────────────────────────────────────────────────
  useEffect(() => {
    if (!isSmsRetrieverSupported) return;

    const receivedSub = onSmsReceived((result) => {
      setStatus('received');
      onRawRef.current?.(result.message);
      if (result.otp) {
        onOtpRef.current(result.otp);
      }
    });

    const timeoutSub = onSmsTimeout(() => {
      setStatus('timeout');
    });

    const errorSub = onSmsError((err) => {
      setStatus('error');
      setError(err.message);
    });

    return () => {
      receivedSub.remove();
      timeoutSub.remove();
      errorSub.remove();
    };
  }, []); // Empty deps — listeners registered once

  // ─── Auto-start on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (autoStart) {
      startRetriever();
    }
    // Cleanup: stop retriever if component unmounts while listening
    return () => {
      stopSmsRetriever().catch(() => {});
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, error, startRetriever, stopRetriever };
}
