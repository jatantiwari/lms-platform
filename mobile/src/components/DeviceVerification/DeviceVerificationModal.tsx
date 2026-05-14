/**
 * DeviceVerificationModal (v3 — zero-input device-OTP flow)
 *
 * Steps:
 *  1. intro     – "Verify Your Device" with a single CTA button
 *  2. sending   – App generates 5-digit OTP locally, backend sends it via SMS
 *  3. reading   – SMS Retriever + inbox poll compare OTPs automatically
 *  4. verifying – backend confirm call
 *  5. success   – Device trusted ✓
 *  6. phone_mismatch / error – retry screens
 *
 * No manual OTP entry. No code input box. The user taps one button.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getDeviceFingerprint, getSecurityStatus } from '../../lib/simVerification';
import { useDeviceTrustStore } from '../../store/deviceTrustStore';
import { useDeviceOtpVerify } from '../../hooks/useDeviceOtpVerify';
import { Colors } from '../../constants/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_DEVICE_ID_KEY = 'fallback_device_id_v2';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getFallbackDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(FALLBACK_DEVICE_ID_KEY);
    if (stored) return stored;
    const id = generateUUID();
    await SecureStore.setItemAsync(FALLBACK_DEVICE_ID_KEY, id);
    return id;
  } catch {
    return generateUUID();
  }
}

const C = {
  text: Colors.gray900,
  textSecondary: Colors.gray500,
  success: '#22c55e',
  error: Colors.error,
  primary: Colors.primary,
  background: Colors.background,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeviceVerificationModalProps {
  visible: boolean;
  enrolledPhone: string | null;
  onVerified: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
}

type UIStep = 'intro' | 'sending' | 'reading' | 'verifying' | 'success' | 'phone_mismatch' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────

export const DeviceVerificationModal: React.FC<DeviceVerificationModalProps> = ({
  visible,
  enrolledPhone,
  onVerified,
  onDismiss,
  dismissible = false,
}) => {
  const [uiStep, setUiStep] = useState<UIStep>('intro');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [deviceId, setDeviceId] = useState('');
  const [fingerprintHash, setFingerprintHash] = useState('');

  const markTrusted = useDeviceTrustStore((s) => s.markTrusted);

  // ─── Zero-input OTP hook ────────────────────────────────────────────────────
  const { step: hookStep, initiate, reset } = useDeviceOtpVerify({
    onVerified: async () => {
      await markTrusted({ deviceId, fingerprintHash, phone: enrolledPhone });
      setUiStep('success');
      setTimeout(onVerified, 1200);
    },
    onFailed: (reason, msg) => {
      if (reason === 'PHONE_MISMATCH') {
        setUiStep('phone_mismatch');
      } else if (reason === 'TIMEOUT') {
        setErrorMsg('SMS not received within 90 seconds. Please try again.');
        setUiStep('error');
      } else {
        setErrorMsg(msg ?? 'Verification failed. Please try again.');
        setUiStep('error');
      }
    },
  });

  // Mirror hook step → UI step
  useEffect(() => {
    if (hookStep === 'sending') setUiStep('sending');
    else if (hookStep === 'reading') setUiStep('reading');
    else if (hookStep === 'verifying') setUiStep('verifying');
  }, [hookStep]);

  // Countdown while reading SMS
  useEffect(() => {
    if (uiStep !== 'reading') return;
    setCountdown(90);
    const t = setInterval(() => setCountdown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [uiStep]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setUiStep('intro');
      setErrorMsg('');
      reset();
      loadDeviceInfo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadDeviceInfo = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const fp = await getDeviceFingerprint();
      if (fp?.deviceId && fp?.fingerprintHash) {
        setDeviceId(fp.deviceId);
        setFingerprintHash(fp.fingerprintHash);
      } else {
        const id = await getFallbackDeviceId();
        setDeviceId(id);
        setFingerprintHash(id);
      }
    } catch {
      const id = await getFallbackDeviceId();
      setDeviceId(id);
      setFingerprintHash(id);
    }
  }, []);

  // ─── Start verification ─────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!deviceId || !fingerprintHash) {
      setErrorMsg('Device info not ready. Please wait a moment and try again.');
      setUiStep('error');
      return;
    }
    let isRooted = false;
    let isEmulator = false;
    try {
      const sec = await getSecurityStatus();
      isRooted = sec?.isRooted ?? false;
      isEmulator = sec?.isEmulator ?? false;
    } catch { /* non-fatal */ }

    await initiate({
      deviceId,
      fingerprintHash,
      platform: 'android',
      isRooted,
      isEmulator,
    });
  }, [deviceId, fingerprintHash, initiate]);

  // ─── Screens ────────────────────────────────────────────────────────────────

  const renderIntro = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark-outline" size={40} color={C.primary} />
      </View>
      <Text style={styles.title}>Verify Your Device</Text>
      <Text style={styles.subtitle}>
        To access course content we need to confirm this device belongs to your enrolled phone number.
        {'\n\n'}
        We'll send a one-time code to your registered number and read it automatically — no typing required.
      </Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleStart}
        accessibilityRole="button"
        accessibilityLabel="Send verification code"
      >
        <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryBtnText}>Send Verification Code</Text>
      </TouchableOpacity>

      {dismissible && (
        <TouchableOpacity style={styles.textBtn} onPress={onDismiss}>
          <Text style={styles.textBtnText}>Verify later</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSending = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={styles.spinnerTitle}>Sending verification code…</Text>
      <Text style={styles.subtitle}>Preparing a one-time code for your registered number.</Text>
    </View>
  );

  const renderReading = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="mail-outline" size={40} color={C.primary} />
      </View>
      <Text style={styles.title}>Waiting for SMS…</Text>
      <Text style={styles.subtitle}>
        A verification code was sent to your registered number.{'\n'}
        Reading SMS automatically — please keep the app open.
      </Text>

      <View style={styles.countdownRow}>
        <ActivityIndicator size="small" color={C.primary} />
        <Text style={styles.countdownText}>  Auto-reading  ·  {countdown}s remaining</Text>
      </View>

      <TouchableOpacity
        style={styles.textBtn}
        onPress={() => { reset(); setUiStep('intro'); }}
      >
        <Text style={styles.textBtnText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerifying = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={styles.spinnerTitle}>Verifying device…</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
        <Ionicons name="checkmark-circle" size={48} color={C.success} />
      </View>
      <Text style={styles.title}>Device Verified!</Text>
      <Text style={styles.subtitle}>Your device has been verified. Enjoy your course!</Text>
    </View>
  );

  const renderPhoneMismatch = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, styles.iconCircleError]}>
        <Ionicons name="warning-outline" size={40} color={C.error} />
      </View>
      <Text style={[styles.title, { color: C.error }]}>Phone Number Mismatch</Text>
      <Text style={styles.subtitle}>
        The code could not be sent to a verified number for this account
        {enrolledPhone ? ` (…${enrolledPhone.slice(-4)})` : ''}.
        {'\n\n'}
        Please use the device with your enrolled phone number, or contact support.
      </Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); setUiStep('intro'); }}>
        <Text style={styles.primaryBtnText}>Try Again</Text>
      </TouchableOpacity>
      {dismissible && (
        <TouchableOpacity style={styles.textBtn} onPress={onDismiss}>
          <Text style={styles.textBtnText}>Go Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderError = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, styles.iconCircleError]}>
        <Ionicons name="alert-circle-outline" size={40} color={C.error} />
      </View>
      <Text style={[styles.title, { color: C.error }]}>Something Went Wrong</Text>
      <Text style={styles.subtitle}>{errorMsg}</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); setUiStep('intro'); }}>
        <Text style={styles.primaryBtnText}>Try Again</Text>
      </TouchableOpacity>
      {dismissible && (
        <TouchableOpacity style={styles.textBtn} onPress={onDismiss}>
          <Text style={styles.textBtnText}>Go Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderStep = () => {
    switch (uiStep) {
      case 'intro':           return renderIntro();
      case 'sending':         return renderSending();
      case 'reading':         return renderReading();
      case 'verifying':       return renderVerifying();
      case 'success':         return renderSuccess();
      case 'phone_mismatch':  return renderPhoneMismatch();
      case 'error':           return renderError();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismissible ? onDismiss : undefined}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {dismissible && uiStep === 'intro' && (
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </TouchableOpacity>
        )}
        <View style={styles.container}>{renderStep()}</View>
      </SafeAreaView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircleSuccess: {
    backgroundColor: '#22c55e18',
  },
  iconCircleError: {
    backgroundColor: `${Colors.error}15`,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
    marginBottom: 12,
  },
  spinnerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textBtn: {
    paddingVertical: 8,
    marginTop: 4,
  },
  textBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}10`,
  },
  countdownText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});
