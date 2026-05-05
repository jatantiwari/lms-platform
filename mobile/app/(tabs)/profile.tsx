import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, Switch, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../src/store/authStore';
import { userApi } from '../../src/lib/api';
import { scheduleDailyReminder, cancelDailyReminder } from '../../src/lib/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Colors, Spacing } from '../../src/constants/theme';

const profileSchema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  headline: z.string().optional(),
});
const pwdSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PwdForm = z.infer<typeof pwdSchema>;

export default function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const { user, logout, fetchMe } = useAuthStore();
  const qc = useQueryClient();
  const [reminder, setReminder] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { control: pc, handleSubmit: hsp, formState: { errors: pe, isDirty: pd } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '', bio: user?.bio ?? '', headline: user?.headline ?? '' },
  });

  const { control: wc, handleSubmit: hsw, reset: rwc, formState: { errors: we, isSubmitting: ws } } = useForm<PwdForm>({ resolver: zodResolver(pwdSchema) });

  const saveMutation = useMutation({
    mutationFn: (data: ProfileForm) => userApi.updateProfile(data),
    onSuccess: async () => {
      await fetchMe();
      Toast.show({ type: 'success', text1: 'Profile updated!' });
    },
    onError: (err: unknown) => {
      Toast.show({ type: 'error', text1: 'Update failed', text2: (err as { response?: { data?: { message?: string } } })?.response?.data?.message });
    },
  });

  const pwdMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: PwdForm) =>
      userApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      rwc();
      setShowPwd(false);
      Toast.show({ type: 'success', text1: 'Password changed!' });
    },
    onError: (err: unknown) => {
      Toast.show({ type: 'error', text1: 'Error', text2: (err as { response?: { data?: { message?: string } } })?.response?.data?.message });
    },
  });

  const handleAvatarPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const fd = new FormData();
    fd.append('avatar', { uri: asset.uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
    setUploadingAvatar(true);
    try {
      await userApi.uploadAvatar(fd);
      await fetchMe();
      Toast.show({ type: 'success', text1: 'Avatar updated!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleReminderToggle = async (v: boolean) => {
    setReminder(v);
    if (v) {
      await scheduleDailyReminder(9, 0); // 9 AM
      Toast.show({ type: 'info', text1: 'Daily reminder set for 9:00 AM' });
    } else {
      await cancelDailyReminder();
      Toast.show({ type: 'info', text1: 'Daily reminder cancelled' });
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); } },
    ]);
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: top || Spacing.md }]}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleAvatarPick} disabled={uploadingAvatar}>
          {user?.avatar ? (
            <Image
              key={user.avatar}
              source={{ uri: user.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            {uploadingAvatar ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="pencil" size={14} color={Colors.white} />}
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Profile form */}
      <Card title="Edit Profile">
        <Controller control={pc} name="name" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Full Name" value={value} onChangeText={onChange} onBlur={onBlur} error={pe.name?.message} />
        )} />
        <Controller control={pc} name="phone" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Phone" value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="phone-pad" error={pe.phone?.message} />
        )} />
        <Controller control={pc} name="headline" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Headline" value={value} onChangeText={onChange} onBlur={onBlur} placeholder="e.g. Full-Stack Developer" error={pe.headline?.message} />
        )} />
        <Controller control={pc} name="bio" render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Bio" value={value} onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={3} error={pe.bio?.message} />
        )} />
        <Button title={saveMutation.isPending ? 'Saving…' : 'Save Profile'} loading={saveMutation.isPending} onPress={hsp((d) => saveMutation.mutate(d))} disabled={!pd} />
      </Card>

      {/* Change Password */}
      <Card title="Change Password">
        {!showPwd ? (
          <TouchableOpacity onPress={() => setShowPwd(true)}>
            <Text style={styles.link}>Change password →</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Controller control={wc} name="currentPassword" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Current Password" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={we.currentPassword?.message} />
            )} />
            <Controller control={wc} name="newPassword" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="New Password" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={we.newPassword?.message} />
            )} />
            <Controller control={wc} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Confirm Password" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={we.confirmPassword?.message} />
            )} />
            <Button title={ws ? 'Changing…' : 'Change Password'} loading={ws} onPress={hsw((d) => pwdMutation.mutate(d))} />
            <Button title="Cancel" variant="ghost" onPress={() => { rwc(); setShowPwd(false); }} style={{ marginTop: 8 }} />
          </>
        )}
      </Card>

      {/* Settings */}
      <Card title="Notifications">
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Daily learning reminder</Text>
          <Switch value={reminder} onValueChange={handleReminderToggle} thumbColor={Colors.white} trackColor={{ true: Colors.primary, false: Colors.gray300 }} />
        </View>
      </Card>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={cardStyles.wrap}>
      <Text style={cardStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: { backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.md },
  title: { fontSize: 16, fontWeight: '800', color: Colors.gray900, marginBottom: Spacing.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.gray900, marginTop: 10 },
  userEmail: { fontSize: 13, color: Colors.gray500 },
  link: { color: Colors.primary, fontWeight: '600' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: 14, color: Colors.gray700 },
  logoutBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.errorBg, borderRadius: 12,
    padding: Spacing.md, alignItems: 'center',
  },
  logoutText: { color: Colors.error, fontWeight: '800', fontSize: 15 },
});
