import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, KeyRound, LogOut, Camera } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { authApi } from '@/api/auth';
import { uploadsApi } from '@/api/uploads';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { classNames } from '@/utils/helpers';

const profileSchema = z.object({
  full_name: z.string().max(100, 'Max 100 characters').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  team: z.string().max(50, 'Max 50 characters').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Min 8 characters').max(128, 'Max 128 characters'),
  confirm_password: z.string().min(1, 'Required'),
}).refine((data) => data.new_password !== data.old_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export const UserSettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      team: user?.team || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast({ type: 'error', message: 'Only JPG, PNG, and WebP are allowed' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast({ type: 'error', message: 'Image must be under 10MB' });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const { url } = await uploadsApi.uploadAvatar(file);
      await updateProfile({ avatar_url: url });
      showToast({ type: 'success', message: 'Avatar updated!' });
    } catch {
      showToast({ type: 'error', message: 'Failed to upload avatar' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile({
        full_name: data.full_name || undefined,
        email: data.email || undefined,
        team: data.team || undefined,
      });
      showToast({ type: 'success', message: 'Profile updated!' });
    } catch {
      showToast({ type: 'error', message: 'Failed to update profile' });
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await authApi.changePassword(data.old_password, data.new_password);
      showToast({ type: 'success', message: 'Password changed!' });
      resetPassword();
    } catch {
      showToast({ type: 'error', message: 'Failed to change password. Check your current password.' });
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'password' as const, label: 'Password', icon: KeyRound },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      {/* User card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-semibold text-primary-700">
                    {user?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.full_name || user?.username}
              </h2>
              <p className="text-sm text-gray-500">@{user?.username}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                {user?.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <Input
                label="Username"
                value={user?.username || ''}
                disabled
                helperText="Username cannot be changed"
              />
              <Input
                label="Full Name"
                placeholder="Your full name"
                error={profileErrors.full_name?.message}
                {...registerProfile('full_name')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                error={profileErrors.email?.message}
                {...registerProfile('email')}
              />
              <Input
                label="Team"
                placeholder="e.g. Engineering, Design..."
                error={profileErrors.team?.message}
                {...registerProfile('team')}
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isProfileSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                error={passwordErrors.old_password?.message}
                {...registerPassword('old_password')}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min 8 characters"
                error={passwordErrors.new_password?.message}
                {...registerPassword('new_password')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                error={passwordErrors.confirm_password?.message}
                {...registerPassword('confirm_password')}
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={isPasswordSubmitting}>
                  Change Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Sign Out</h3>
              <p className="text-sm text-gray-500">Sign out of your account on this device</p>
            </div>
            <Button variant="danger" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
