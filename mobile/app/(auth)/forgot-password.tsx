import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Colors, Spacing } from '../../src/constants/theme';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormData) => {
    try {
      await authApi.forgotPassword(email);
      Toast.show({ type: 'success', text1: 'Email sent!', text2: 'Check your inbox for the reset link.' });
      router.back();
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: 'Error', text2: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong' });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.iconWrap}>
          <Ionicons name="key-outline" size={52} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message} />
            )}
          />
          <View style={{ height: Spacing.sm }} />
          <Button title={isSubmitting ? 'Sending…' : 'Send Reset Link'} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.lg, paddingTop: 60 },
  back: { marginBottom: Spacing.xl },
  backText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  iconWrap: { alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: Colors.gray900, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.gray500, textAlign: 'center', marginTop: 8, marginBottom: Spacing.xl },
  form: { backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.lg },
});
