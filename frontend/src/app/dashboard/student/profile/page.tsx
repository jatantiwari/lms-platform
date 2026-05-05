'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useUser } from '@/store/authStore';
import { userApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { User, Mail, Globe, FileText, Briefcase, Lock, CheckCircle, Loader2, Camera, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const user = useUser();
  const { setUser } = useAuthStore();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    headline: user?.headline ?? '',
    website: user?.website ?? '',
    phone: user?.phone ?? '',
  });

  // Sync form when Zustand rehydrates from localStorage
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name ?? '',
        bio: user.bio ?? '',
        headline: user.headline ?? '',
        website: user.website ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return null;

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await userApi.updateProfile({
        name: profileForm.name,
        bio: profileForm.bio,
        headline: profileForm.headline,
        website: profileForm.website,
        phone: profileForm.phone,
      });
      setUser(data.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await userApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to change password';
      setPwError(msg);
    } finally {
      setSavingPw(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data } = await userApi.uploadAvatar(file);
      setUser(data.data);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and password</p>
      </div>

      {/* Avatar + name */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          {/* Avatar with upload */}
          <label className="relative cursor-pointer group shrink-0">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-primary-100">
                {getInitials(user.name)}
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
          </label>

          <div>
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span
              className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                user.role === 'INSTRUCTOR'
                  ? 'bg-indigo-100 text-indigo-600'
                  : user.role === 'ADMIN'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </span>
            {user.emailVerified && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile details form */}
      <form
        onSubmit={handleProfileSave}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" /> Personal Information
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </span>
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="input-field opacity-60 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Headline
            </span>
          </label>
          <input
            type="text"
            value={profileForm.headline}
            onChange={(e) => setProfileForm((p) => ({ ...p, headline: e.target.value }))}
            placeholder="e.g. Full-Stack Developer & Instructor"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Website
            </span>
          </label>
          <input
            type="url"
            value={profileForm.website}
            onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://yourwebsite.com"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone Number{user.role === 'STUDENT' ? ' *' : ''}
            </span>
          </label>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+91 9876543210"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Bio
            </span>
          </label>
          <textarea
            value={profileForm.bio}
            onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
            rows={4}
            placeholder="Tell us a little about yourself..."
            className="input-field resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form
        onSubmit={handlePasswordChange}
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-500" /> Change Password
        </h2>

        {pwError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {pwError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
            autoComplete="current-password"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            autoComplete="new-password"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
            autoComplete="new-password"
            className="input-field"
            required
          />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={savingPw} className="btn-primary flex items-center gap-2">
            {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
