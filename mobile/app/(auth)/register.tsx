import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/lib/api';
import { setAccessToken, setRefreshToken } from '../../src/lib/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Colors, Spacing } from '../../src/constants/theme';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().regex(/^[+]?[0-9]{7,15}$/, 'Enter a valid phone number'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { data: res } = await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      const { accessToken, refreshToken, user } = res.data;
      await setAccessToken(accessToken);
      await setRefreshToken(refreshToken);
      setUser(user);
      Toast.show({ type: 'success', text1: 'Account created!', text2: 'Check your email for the verification code.' });
      router.replace('/(auth)/verify-email');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Registration failed';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="school" size={32} color={Colors.primary} />
            <Text style={styles.logo}> ADI Boost</Text>
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start learning today</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Full Name" placeholder="Your full name" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message} />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Phone Number *" placeholder="+91 9876543210" keyboardType="phone-pad" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.phone?.message} />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Min 8 characters"
                secureTextEntry={!showPwd}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
                rightIcon={<Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray500} />}
                onRightIconPress={() => setShowPwd(!showPwd)}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Confirm Password" placeholder="Repeat password" secureTextEntry={!showPwd} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.confirmPassword?.message} />
            )}
          />

          <View style={{ height: Spacing.sm }} />
          <Button title={isSubmitting ? 'Creating account…' : 'Create Account'} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing.lg, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  logo: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  title: { fontSize: 26, fontWeight: '800', color: Colors.gray900 },
  subtitle: { fontSize: 16, color: Colors.gray500, marginTop: 6 },
  form: { backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.lg, gap: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.gray500, fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
