/**
 * DeviceVerificationModal
 *
 * Full-screen overlay shown when a student tries to access a course on an
 * unverified device. Guides them through:
 *   1. Detecting SIM cards and device fingerprint
 *   2. Sending OTP to enrolled phone (with optional SIM mismatch error)
 *   3. Auto-reading OTP via SMS Retriever or manual entry
 *   4. On success → marks device as trusted → calls onVerified()
 *
 * Does NOT navigate away — embeds the full flow inline so the student
 * returns seamlessly to the course they tried to open.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { OtpInput } from '../PhoneVerification/OtpInput';
import { SimSelector } from '../PhoneVerification/SimSelector';
import { useSmsRetriever } from '../../hooks/useSmsRetriever';
import { useSimPermissions } from '../../hooks/useSimPermissions';
import { getSimCards, getDeviceFingerprint, getSecurityStatus } from '../../lib/simVerification';
import { useDeviceTrustStore } from '../../store/deviceTrustStore';
import { deviceTrustApi } from '../../lib/api';
import { Colors, Spacing } from '../../constants/theme';

const C = {
  text: Colors.gray900,
  textSecondary: Colors.gray500,
  success: '#22c55e',
  background: Colors.background,
  card: Colors.card,
  primary: Colors.primary,
  error: Colors.error,
};
import type { SimCardInfo } from '../../../modules/sim-verification';

interface DeviceVerificationModalProps {
  visible: boolean;
  enrolledPhone: string | null;
  onVerified: () => void;
  onDismiss?: () => void;
  /** Whether user is allowed to close without verifying */
  dismissible?: boolean;
}

type Step = 'intro' | 'sending' | 'otp' | 'verifying' | 'success' | 'phone_mismatch' | 'error';

const EMPTY_DIGITS = () => Array(6).fill('') as string[];

export const DeviceVerificationModal: React.FC<DeviceVerificationModalProps> = ({
  visible,
  enrolledPhone,
  onVerified,
  onDismiss,
  dismissible = false,
}) => {
  const [step, setStep] = useState<Step>('intro');
  const [digits, setDigits] = useState<string[]>(EMPTY_DIGITS());
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [simCards, setSimCards] = useState<SimCardInfo[]>([]);
  const [selectedSimSlot, setSelectedSimSlot] = useState<number>(0);
  const [loadingSims, setLoadingSims] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [fingerprintHash, setFingerprintHash] = useState('');
  const [simPhone, setSimPhone] = useState('');
  const [simCarrier, setSimCarrier] = useState('');

  const markTrusted = useDeviceTrustStore((s) => s.markTrusted);
  const { requestPermissions } = useSimPermissions();

  // ─── SMS Retriever ───────────────────────────────────────────────────────────
  const { status: smsStatus } = useSmsRetriever({
    autoStart: step === 'otp',
    onOtpDetected: (otp) => {
      const arr = otp.split('').slice(0, 6);
      while (arr.length < 6) arr.push('');
      setDigits(arr);
    },
  });

  // ─── Reset on modal open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep('intro');
      setDigits(EMPTY_DIGITS());
      setShakeTrigger(false);
      setErrorMsg('');
      loadDeviceInfo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ─── Load device fingerprint + SIM cards ─────────────────────────────────────
  const loadDeviceInfo = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    setLoadingSims(true);
    try {
      const fp = await getDeviceFingerprint();
      if (fp) {
        setDeviceId(fp.deviceId);
        setFingerprintHash(fp.fingerprintHash);
      }

      const perms = await requestPermissions();
      if (perms.phoneState === 'granted') {
        const cards = await getSimCards();
        setSimCards(cards);
        const defaultSlot = cards.findIndex((c) => c.isDefaultSms);
        setSelectedSimSlot(defaultSlot >= 0 ? defaultSlot : 0);
        if (cards.length > 0) {
          const selected = cards[defaultSlot >= 0 ? defaultSlot : 0];
          setSimPhone(selected.phoneNumber ?? '');
          setSimCarrier(selected.carrierName ?? '');
        }
      }
    } catch { /* ignore, graceful degradation */ }
    setLoadingSims(false);
  }, [requestPermissions]);

  // Update simPhone when user changes SIM selection
  useEffect(() => {
    if (simCards.length > 0 && selectedSimSlot < simCards.length) {
      setSimPhone(simCards[selectedSimSlot].phoneNumber ?? '');
      setSimCarrier(simCards[selectedSimSlot].carrierName ?? '');
    }
  }, [selectedSimSlot, simCards]);

  // ─── Send OTP ─────────────────────────────────────────────────────────────────
  const handleSendOtp = useCallback(async () => {
    if (!deviceId || !fingerprintHash) {
      Toast.show({ type: 'error', text1: 'Device fingerprint not available. Please restart the app.' });
      return;
    }
    setStep('sending');
    try {
      const secStatus = Platform.OS === 'android' ? await getSecurityStatus() : null;
      const { data } = await deviceTrustApi.sendOtp({
        deviceId,
        fingerprintHash,
        simPhoneNumber: simPhone,
        simCarrier,
        simSlot: selectedSimSlot,
        platform: Platform.OS as 'android' | 'ios',
        isRooted: secStatus?.isRooted ?? false,
        isEmulator: secStatus?.isEmulator ?? false,
      });
      setMaskedPhone(data?.data?.maskedPhone ?? '');
      setStep('otp');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string; message?: string }; status?: number } };
      if (e?.response?.data?.code === 'PHONE_MISMATCH' || e?.response?.status === 403) {
        setStep('phone_mismatch');
      } else {
        setErrorMsg(e?.response?.data?.message ?? 'Failed to send OTP. Please try again.');
        setStep('error');
      }
    }
  }, [deviceId, fingerprintHash, simPhone, simCarrier, selectedSimSlot]);

  // ─── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async () => {
    const otp = digits.join('');
    if (otp.length < 6) {
      setShakeTrigger((v) => !v);
      return;
    }
    setStep('verifying');
    try {
      const secStatus = Platform.OS === 'android' ? await getSecurityStatus() : null;
      await deviceTrustApi.verifyOtp({
        otp,
        deviceId,
        fingerprintHash,
        simPhoneNumber: simPhone,
        simCarrier,
        simSlot: selectedSimSlot,
        isRooted: secStatus?.isRooted ?? false,
        isEmulator: secStatus?.isEmulator ?? false,
      });

      // Persist trust locally
      await markTrusted({ deviceId, fingerprintHash, phone: enrolledPhone });
      setStep('success');

      // Brief success moment then close
      setTimeout(onVerified, 1200);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: e?.response?.data?.message ?? 'Invalid OTP. Please try again.',
      });
      setDigits(EMPTY_DIGITS());
      setShakeTrigger((v) => !v);
      setStep('otp');
    }
  }, [digits, deviceId, fingerprintHash, simPhone, simCarrier, selectedSimSlot, markTrusted, enrolledPhone, onVerified]);

  // ─── Render helpers ───────────────────────────────────────────────────────────

  const renderIntro = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark-outline" size={40} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Verify Your Device</Text>
      <Text style={styles.subtitle}>
        To access course content, we need to verify that this is your registered mobile device.
        {'\n\n'}An OTP will be sent to your enrolled mobile number.
      </Text>

      {Platform.OS === 'android' && simCards.length > 1 && (
        <View style={styles.simSection}>
          <Text style={styles.sectionLabel}>Select SIM to verify with:</Text>
          <SimSelector
            simCards={simCards}
            selectedSlot={selectedSimSlot}
            onSelect={setSelectedSimSlot}
          />
        </View>
      )}

      {loadingSims && (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, loadingSims && styles.btnDisabled]}
        onPress={handleSendOtp}
        disabled={loadingSims}
        accessibilityRole="button"
        accessibilityLabel="Send verification OTP"
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
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={[styles.subtitle, { marginTop: 16 }]}>Sending OTP…</Text>
    </View>
  );

  const renderOtp = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="phone-portrait-outline" size={40} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{' '}
        <Text style={styles.phoneText}>{maskedPhone || 'your registered number'}</Text>
      </Text>

      {smsStatus === 'listening' && (
        <View style={styles.smsBadge}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.smsBadgeText}> Auto-reading SMS…</Text>
        </View>
      )}
      {smsStatus === 'received' && (
        <View style={[styles.smsBadge, styles.smsBadgeSuccess]}>
          <Ionicons name="checkmark-circle" size={16} color={C.success} />
          <Text style={[styles.smsBadgeText, { color: C.success }]}> SMS auto-read</Text>
        </View>
      )}

      <OtpInput
        value={digits}
        onChange={setDigits}
        shake={shakeTrigger}
      />

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleVerifyOtp}
        accessibilityRole="button"
        accessibilityLabel="Verify OTP"
      >
        <Text style={styles.primaryBtnText}>Verify & Access Course</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.textBtn} onPress={() => setStep('intro')}>
        <Text style={styles.textBtnText}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerifying = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={[styles.subtitle, { marginTop: 16 }]}>Verifying your device…</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
        <Ionicons name="checkmark-circle" size={48} color={C.success} />
      </View>
      <Text style={styles.title}>Device Verified!</Text>
      <Text style={styles.subtitle}>You now have access to this course. Enjoy learning!</Text>
    </View>
  );

  const renderPhoneMismatch = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, styles.iconCircleError]}>
        <Ionicons name="warning-outline" size={40} color={C.error} />
      </View>
      <Text style={[styles.title, { color: C.error }]}>SIM Card Mismatch</Text>
      <Text style={styles.subtitle}>
        The SIM card in this device does not match your enrolled mobile number
        {enrolledPhone ? ` (${enrolledPhone.slice(0, 3)}****${enrolledPhone.slice(-3)})` : ''}.
        {'\n\n'}
        To access courses, please use the device with your registered SIM, or contact support to update your number.
      </Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => setStep('intro')}
        accessibilityRole="button"
      >
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

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => setStep('intro')}
        accessibilityRole="button"
      >
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
    switch (step) {
      case 'intro': return renderIntro();
      case 'sending': return renderSending();
      case 'otp': return renderOtp();
      case 'verifying': return renderVerifying();
      case 'success': return renderSuccess();
      case 'phone_mismatch': return renderPhoneMismatch();
      case 'error': return renderError();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismissible ? onDismiss : undefined}
    >
      <SafeAreaView style={styles.container}>
        {dismissible && step !== 'verifying' && step !== 'success' && (
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
        )}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  stepContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: Spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${C.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleSuccess: {
    backgroundColor: `${C.success}15`,
  },
  iconCircleError: {
    backgroundColor: `${C.error}15`,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneText: {
    fontWeight: '600',
    color: C.text,
  },
  sectionLabel: {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  simSection: {
    width: '100%',
    gap: 8,
  },
  smsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: `${C.primary}12`,
  },
  smsBadgeSuccess: {
    backgroundColor: `${C.success}12`,
  },
  smsBadgeText: {
    fontSize: 13,
    color: C.primary,
    fontWeight: '500',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  textBtn: {
    paddingVertical: 10,
  },
  textBtnText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
