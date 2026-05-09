import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing } from '../../src/constants/theme';

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { user, fetchMe } = useAuthStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Auto-send OTP as soon as the screen mounts
    sendOtp();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    try {
      await authApi.sendPhoneOtp();
      setOtpSent(true);
      setCooldown(90);
      Toast.show({ type: 'success', text1: 'OTP Sent!', text2: `Check SMS on ${user?.phone ?? 'your number'}` });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to send OTP';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setIsSending(false);
    }
  };

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    if (otp.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter all 6 digits' });
      return;
    }
    setIsVerifying(true);
    try {
      await authApi.verifyPhoneOtp(otp);
      await fetchMe();
      Toast.show({ type: 'success', text1: 'Phone verified! ✅' });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid OTP. Please try again.';
      Toast.show({ type: 'error', text1: 'Verification failed', text2: msg });
      // Clear digits on failure for re-entry
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

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

        {/* Loading state while sending first OTP */}
        {!otpSent && isSending && (
          <View style={styles.sendingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.sendingText}>Sending OTP…</Text>
          </View>
        )}

        {/* OTP input boxes */}
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
              value={d}
              onChangeText={(v) => handleDigit(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyDown(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={otpSent && !isVerifying}
            />
          ))}
        </View>

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
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gray900,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  verifyBtn: { width: '100%', marginBottom: Spacing.md },
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
