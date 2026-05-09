import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Colors, Spacing } from '../../src/constants/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { fetchMe } = useAuthStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
    const code = digits.join('');
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter all 6 digits' });
      return;
    }
    setIsVerifying(true);
    try {
      await authApi.verifyEmail(code);
      const user = await fetchMe();
      Toast.show({ type: 'success', text1: 'Email verified! 🎉' });
      if (!user) {
        router.replace('/(auth)/login');
      } else if (!user.phoneVerified) {
        router.replace('/(auth)/verify-phone');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Invalid code';
      Toast.show({ type: 'error', text1: 'Verification failed', text2: msg });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    try {
      await authApi.resendVerification();
      setCooldown(120);
      Toast.show({ type: 'success', text1: 'Code sent!', text2: 'Check your inbox.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Could not resend';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Ionicons name="mail-outline" size={56} color={Colors.primary} style={styles.icon} />
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to your email address. Enter it below.
        </Text>

        {/* OTP inputs */}
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
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title={isVerifying ? 'Verifying…' : 'Verify Email'}
          loading={isVerifying}
          onPress={handleVerify}
          style={styles.verifyBtn}
        />

        <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || isResending} style={styles.resendWrap}>
          <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive it? Resend code"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { useAuthStore.getState().logout(); router.replace('/(auth)/login'); }}
          style={styles.logoutWrap}
        >
          <Text style={styles.logoutText}>Use a different account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  icon: { marginBottom: Spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: Colors.gray900, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.gray500, textAlign: 'center', maxWidth: 300, marginBottom: Spacing.xl },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gray900,
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: Colors.primary },
  verifyBtn: { width: '100%' },
  resendWrap: { marginTop: Spacing.lg },
  resendText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  resendDisabled: { color: Colors.gray400 },
  logoutWrap: { marginTop: Spacing.md },
  logoutText: { color: Colors.gray400, fontSize: 13, textDecorationLine: 'underline' },
});
