import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { UserProfile, SocialLinks, NotificationPreferences } from '../../types/blog/user';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name must be less than 50 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal(''))
});

const socialLinksSchema = z.object({
  twitter: z.string().optional().or(z.literal('')),
  github: z.string().optional().or(z.literal('')),
  linkedin: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  youtube: z.string().optional().or(z.literal('')),
  medium: z.string().optional().or(z.literal('')),
  devto: z.string().optional().or(z.literal(''))
});

const notificationSchema = z.object({
  emailOnComment: z.boolean(),
  emailOnLike: z.boolean(),
  emailOnFollow: z.boolean(),
  emailOnMention: z.boolean(),
  emailWeeklyDigest: z.boolean(),
  emailMonthlyReport: z.boolean(),
  pushOnComment: z.boolean(),
  pushOnLike: z.boolean(),
  pushOnFollow: z.boolean()
});

type ProfileFormData = z.infer<typeof profileSchema>;
type SocialLinksFormData = z.infer<typeof socialLinksSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;

export const AuthorSettings: React.FC = () => {
  const { user, updateProfile } = useBlogAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'notifications' | 'privacy'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.profile?.displayName || '',
      bio: user?.profile?.bio || '',
      website: user?.profile?.website || '',
      location: user?.profile?.location || '',
      avatar: user?.profile?.avatar || ''
    }
  });

  const socialForm = useForm<SocialLinksFormData>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: user?.profile?.socialLinks || {}
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: user?.profile?.notificationPreferences || {
      emailOnComment: true,
      emailOnLike: false,
      emailOnFollow: true,
      emailOnMention: true,
      emailWeeklyDigest: true,
      emailMonthlyReport: false,
      pushOnComment: true,
      pushOnLike: false,
      pushOnFollow: true
    }
  });

  useEffect(() => {
    if (user?.profile) {
      profileForm.reset({
        displayName: user.profile.displayName || '',
        bio: user.profile.bio || '',
        website: user.profile.website || '',
        location: user.profile.location || '',
        avatar: user.profile.avatar || ''
      });
      socialForm.reset(user.profile.socialLinks || {});
      notificationForm.reset(user.profile.notificationPreferences || {});
    }
  }, [user?.profile, profileForm, socialForm, notificationForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${user?.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      await updateProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSocialSubmit = async (data: SocialLinksFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${user?.id}/social-links`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update social links');
      }

      const updatedProfile = await response.json();
      await updateProfile(updatedProfile);
      setSuccess('Social links updated successfully!');
    } catch (err) {
      console.error('Failed to update social links:', err);
      setError('Failed to update social links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onNotificationSubmit = async (data: NotificationFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${user?.id}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      const updatedProfile = await response.json();
      await updateProfile(updatedProfile);
      setSuccess('Notification preferences updated successfully!');
    } catch (err) {
      console.error('Failed to update notifications:', err);
      setError('Failed to update notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image file must be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`/api/users/${user?.id}/avatar`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const { avatarUrl } = await response.json();
      profileForm.setValue('avatar', avatarUrl);
      setSuccess('Avatar uploaded successfully!');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'social', label: 'Social Links', icon: '🔗' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Author Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your profile, social links, and preferences
        </p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setSuccess(null);
                  setError(null);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-4">
                    <img
                      src={profileForm.watch('avatar') || '/default-avatar.png'}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Upload New Photo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    {...profileForm.register('displayName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {profileForm.formState.errors.displayName && (
                    <p className="text-red-500 text-xs mt-1">
                      {profileForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    {...profileForm.register('location')}
                    type="text"
                    placeholder="e.g., San Francisco, CA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {profileForm.formState.errors.location && (
                    <p className="text-red-500 text-xs mt-1">
                      {profileForm.formState.errors.location.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    {...profileForm.register('website')}
                    type="url"
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {profileForm.formState.errors.website && (
                    <p className="text-red-500 text-xs mt-1">
                      {profileForm.formState.errors.website.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    {...profileForm.register('bio')}
                    rows={4}
                    placeholder="Tell readers about yourself..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="text-red-500 text-xs mt-1">
                      {profileForm.formState.errors.bio.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {profileForm.watch('bio')?.length || 0}/500 characters
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🐦 Twitter
                  </label>
                  <input
                    {...socialForm.register('twitter')}
                    type="text"
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🐙 GitHub
                  </label>
                  <input
                    {...socialForm.register('github')}
                    type="text"
                    placeholder="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💼 LinkedIn
                  </label>
                  <input
                    {...socialForm.register('linkedin')}
                    type="text"
                    placeholder="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📘 Facebook
                  </label>
                  <input
                    {...socialForm.register('facebook')}
                    type="text"
                    placeholder="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📷 Instagram
                  </label>
                  <input
                    {...socialForm.register('instagram')}
                    type="text"
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📺 YouTube
                  </label>
                  <input
                    {...socialForm.register('youtube')}
                    type="text"
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Medium
                  </label>
                  <input
                    {...socialForm.register('medium')}
                    type="text"
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    👩‍💻 Dev.to
                  </label>
                  <input
                    {...socialForm.register('devto')}
                    type="text"
                    placeholder="username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Social Links'}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Comments</h4>
                      <p className="text-sm text-gray-500">Get notified when someone comments on your posts</p>
                    </div>
                    <input
                      {...notificationForm.register('emailOnComment')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Likes</h4>
                      <p className="text-sm text-gray-500">Get notified when someone likes your posts</p>
                    </div>
                    <input
                      {...notificationForm.register('emailOnLike')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">New Followers</h4>
                      <p className="text-sm text-gray-500">Get notified when someone follows you</p>
                    </div>
                    <input
                      {...notificationForm.register('emailOnFollow')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Mentions</h4>
                      <p className="text-sm text-gray-500">Get notified when someone mentions you</p>
                    </div>
                    <input
                      {...notificationForm.register('emailOnMention')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Weekly Digest</h4>
                      <p className="text-sm text-gray-500">Get a weekly summary of your blog activity</p>
                    </div>
                    <input
                      {...notificationForm.register('emailWeeklyDigest')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Monthly Report</h4>
                      <p className="text-sm text-gray-500">Get a monthly analytics report</p>
                    </div>
                    <input
                      {...notificationForm.register('emailMonthlyReport')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Comments</h4>
                      <p className="text-sm text-gray-500">Get push notifications for new comments</p>
                    </div>
                    <input
                      {...notificationForm.register('pushOnComment')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Likes</h4>
                      <p className="text-sm text-gray-500">Get push notifications for new likes</p>
                    </div>
                    <input
                      {...notificationForm.register('pushOnLike')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">New Followers</h4>
                      <p className="text-sm text-gray-500">Get push notifications for new followers</p>
                    </div>
                    <input
                      {...notificationForm.register('pushOnFollow')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Notifications'}
                </button>
              </div>
            </form>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Public Profile</h4>
                        <p className="text-sm text-gray-500">Make your profile visible to everyone</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Show Email</h4>
                        <p className="text-sm text-gray-500">Display email address on your public profile</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Analytics Tracking</h4>
                        <p className="text-sm text-gray-500">Allow analytics tracking for better insights</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                <div className="space-y-4">
                  <button className="w-full text-left px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100">
                    <h4 className="text-sm font-medium text-yellow-800">Export Data</h4>
                    <p className="text-sm text-yellow-600">Download all your data in JSON format</p>
                  </button>

                  <button className="w-full text-left px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100">
                    <h4 className="text-sm font-medium text-red-800">Delete Account</h4>
                    <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorSettings;