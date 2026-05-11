import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing } from '../../src/constants/theme';
import { OtpInput } from '../../src/components/PhoneVerification/OtpInput';
import { SimSelector } from '../../src/components/PhoneVerification/SimSelector';
import { useSmsRetriever } from '../../src/hooks/useSmsRetriever';
import { useSimPermissions } from '../../src/hooks/useSimPermissions';
import { getSimCards, getAppHash } from '../../src/lib/simVerification';
import type { SimCardInfo } from '../../src/lib/simVerification';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();

  // ─── OTP state ───────────────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // ─── SIM state ────────────────────────────────────────────────────────────────
  const [simCards, setSimCards] = useState<SimCardInfo[]>([]);
  const [selectedSimSlot, setSelectedSimSlot] = useState<number | null>(null);
  const [loadingSims, setLoadingSims] = useState(false);

  const { requestPermissions, hasPhoneStatePermission } = useSimPermissions();

  // ─── SMS Retriever ────────────────────────────────────────────────────────────
  const { status: smsStatus } = useSmsRetriever({
    autoStart: true, // Start 5-min window immediately on mount
    fallbackToUserConsent: true,
    onOtpDetected: (otp) => {
      // Auto-fill OTP when SMS is detected
      const autoFilled = otp.slice(0, 6).split('').concat(Array(6).fill('')).slice(0, 6);
      setDigits(autoFilled);
      Toast.show({
        type: 'success',
        text1: 'OTP detected automatically',
        text2: 'Tap Verify to proceed',
      });
    },
    onRawSmsReceived: (msg) => {
      // Optional: log for debugging (remove in production)
      if (__DEV__) console.log('[SMS Retriever] Raw SMS received');
    },
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Load SIM cards (best-effort — doesn't block OTP flow)
    loadSimCards();
    // Auto-send OTP on mount
    sendOtp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ─── SIM loading ─────────────────────────────────────────────────────────────

  const loadSimCards = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    setLoadingSims(true);
    try {
      // Request permission first
      const perms = await requestPermissions();
      if (perms.phoneState !== 'granted') return;

      const cards = await getSimCards();
      setSimCards(cards);

      // Auto-select default SMS SIM
      const defaultSim = cards.find((c) => c.isDefaultSms) ?? cards[0];
      if (defaultSim) setSelectedSimSlot(defaultSim.slotIndex);
    } catch (e) {
      // SIM info is optional — don't block OTP flow
    } finally {
      setLoadingSims(false);
    }
  }, [requestPermissions]);

  // ─── OTP send ─────────────────────────────────────────────────────────────────

  const sendOtp = useCallback(async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      // Get app hash for SMS Retriever (backend appends it to SMS body)
      let appHash = '';
      if (Platform.OS === 'android') {
        try { appHash = await getAppHash(); } catch (_) {}
      }

      await authApi.sendPhoneOtp({ appHash, simSlot: selectedSimSlot ?? undefined });
      setOtpSent(true);
      setCooldown(90);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent!',
        text2: `Check SMS on ${user?.phone ?? 'your number'}`,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to send OTP';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setIsSending(false);
    }
  }, [cooldown, isSending, selectedSimSlot, user?.phone]);

  // ─── OTP verify ───────────────────────────────────────────────────────────────

  const handleVerify = useCallback(async () => {
    const otp = digits.join('');
    if (otp.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter all 6 digits' });
      return;
    }
    setIsVerifying(true);
    try {
      await authApi.verifyPhoneOtp(otp);
      await fetchMe();
      Toast.show({ type: 'success', text1: 'Phone verified!' });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid OTP. Please try again.';
      setShakeTrigger((v) => !v); // Trigger shake animation
      Toast.show({ type: 'error', text1: 'Verification failed', text2: msg });
      setDigits(['', '', '', '', '', '']);
    } finally {
      setIsVerifying(false);
    }
  }, [digits, fetchMe, router]);

  // ─── SMS status badge ─────────────────────────────────────────────────────────

  const smsBadge = smsStatus === 'listening'
    ? { icon: 'radio-outline' as const, text: 'Auto-detecting OTP…', color: Colors.primary }
    : smsStatus === 'received'
    ? { icon: 'checkmark-circle-outline' as const, text: 'OTP detected!', color: '#16A34A' }
    : smsStatus === 'timeout'
    ? { icon: 'time-outline' as const, text: 'Auto-read timed out', color: '#F59E0B' }
    : null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="phone-portrait-outline" size={56} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Verify your phone</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit OTP via SMS to{'\n'}
          <Text style={styles.phone}>{user?.phone ?? 'your registered number'}</Text>
        </Text>

        {/* SIM Selector (dual-SIM devices) */}
        <SimSelector
          sims={simCards}
          selectedSimSlot={selectedSimSlot}
          onSelect={(sim) => setSelectedSimSlot(sim.slotIndex)}
          loading={loadingSims}
          disabled={isSending || isVerifying}
        />

        {/* SMS Retriever status */}
        {smsBadge && (
          <View style={styles.smsBadge}>
            <Ionicons name={smsBadge.icon} size={15} color={smsBadge.color} />
            <Text style={[styles.smsBadgeText, { color: smsBadge.color }]}>{smsBadge.text}</Text>
          </View>
        )}

        {/* Sending indicator */}
        {!otpSent && isSending && (
          <View style={styles.sendingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.sendingText}>Sending OTP…</Text>
          </View>
        )}

        {/* Enhanced OTP Input */}
        <OtpInput
          value={digits}
          onChange={setDigits}
          shake={shakeTrigger}
          disabled={!otpSent || isVerifying}
          testID="phone-otp-input"
        />

        <Button
          onPress={handleVerify}
          disabled={isVerifying || digits.join('').length !== 6}
          style={styles.verifyBtn}
        >
          {isVerifying ? 'Verifying…' : 'Verify OTP'}
        </Button>

        {/* Resend row */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn&apos;t receive the OTP?</Text>
          <TouchableOpacity onPress={sendOtp} disabled={cooldown > 0 || isSending}>
            <Text style={[styles.resendLink, (cooldown > 0 || isSending) && styles.resendDisabled]}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : isSending ? 'Sending…' : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Change phone hint */}
        <Text style={styles.hint}>
          Wrong number? Update it in your profile settings first.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconWrap: { marginBottom: Spacing.md },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  phone: {
    fontWeight: '600',
    color: Colors.gray700,
  },
  smsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  smsBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  sendingText: {
    fontSize: 14,
    color: Colors.gray500,
  },
  verifyBtn: { width: '100%', marginTop: Spacing.lg, marginBottom: Spacing.md },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  resendLabel: { fontSize: 14, color: Colors.gray500 },
  resendLink: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  resendDisabled: { color: Colors.gray400 },
  hint: {
    fontSize: 12,
    color: Colors.gray400,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
