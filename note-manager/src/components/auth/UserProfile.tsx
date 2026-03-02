// User profile management component

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Camera, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Globe,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  Check,
  AlertCircle
} from 'lucide-react';
import { useBlogAuth } from '../../contexts/blog/BlogAuthContext';
import { BlogUser, UserPreferences } from '../../types/blog/user';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Profile form validation schema
const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location too long').optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.enum(['en', 'zh-CN', 'zh-TW']),
  defaultPostType: z.string(),
  defaultPostStatus: z.string(),
  autoSave: z.boolean(),
  defaultPostVisibility: z.enum(['public', 'private', 'unlisted']),
  emailNotifications: z.object({
    newFollower: z.boolean(),
    newComment: z.boolean(),
    postLiked: z.boolean(),
    postShared: z.boolean(),
    weeklyDigest: z.boolean(),
    systemUpdates: z.boolean(),
  }),
  showEmail: z.boolean(),
  showRealName: z.boolean(),
  allowFollowing: z.boolean(),
  allowComments: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface UserProfileProps {
  userId?: string; // If viewing another user's profile
  isOwnProfile?: boolean;
  onClose?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  isOwnProfile = true, 
  onClose 
}) => {
  const { user: currentUser, updateUser, updatePreferences } = useBlogAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
    watch: watchProfile
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || '',
      bio: currentUser?.bio || '',
      website: currentUser?.website || '',
      location: currentUser?.location || '',
      socialLinks: currentUser?.socialLinks || {},
    }
  });

  // Preferences form
  const {
    register: registerPreferences,
    handleSubmit: handleSubmitPreferences,
    formState: { errors: preferencesErrors },
    reset: resetPreferences,
    watch: watchPreferences
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: currentUser?.preferences
  });

  // Update form data when user data changes
  useEffect(() => {
    if (currentUser) {
      resetProfile({
        displayName: currentUser.displayName || '',
        bio: currentUser.bio || '',
        website: currentUser.website || '',
        location: currentUser.location || '',
        socialLinks: currentUser.socialLinks || {},
      });
      
      if (currentUser.preferences) {
        resetPreferences(currentUser.preferences);
      }
    }
  }, [currentUser, resetProfile, resetPreferences]);

  // Handle profile update
  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      setMessage(null);

      await updateUser({
        displayName: data.displayName,
        bio: data.bio,
        website: data.website,
        location: data.location,
        socialLinks: data.socialLinks,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle preferences update
  const onSubmitPreferences = async (data: PreferencesFormData) => {
    try {
      setLoading(true);
      setMessage(null);

      await updatePreferences(data);

      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.displayName} />
            ) : (
              <User size={64} />
            )}
            {isOwnProfile && isEditing && (
              <button className="avatar-upload-btn">
                <Camera size={16} />
              </button>
            )}
          </div>
          
          <div className="profile-info">
            <h1>{currentUser.displayName || currentUser.username}</h1>
            <p className="profile-username">@{currentUser.username}</p>
            <p className="profile-role">{currentUser.role.replace('_', ' ')}</p>
            
            {currentUser.bio && (
              <p className="profile-bio">{currentUser.bio}</p>
            )}
            
            <div className="profile-meta">
              {currentUser.location && (
                <span className="meta-item">
                  <MapPin size={14} />
                  {currentUser.location}
                </span>
              )}
              {currentUser.website && (
                <span className="meta-item">
                  <Globe size={14} />
                  <a href={currentUser.website} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                </span>
              )}
              <span className="meta-item">
                <Calendar size={14} />
                Joined {new Date(currentUser.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="profile-actions">
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`btn ${isEditing ? 'btn-outline' : 'btn-primary'}`}
              >
                {isEditing ? (
                  <>
                    <X size={16} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 size={16} />
                    Edit Profile
                  </>
                )}
              </button>
            )}
            
            {onClose && (
              <button onClick={onClose} className="btn btn-outline">
                <X size={16} />
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {isOwnProfile && (
        <div className="profile-content">
          {/* Tab Navigation */}
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
            <button
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`message ${message.type}`}>
              {message.type === 'error' ? (
                <AlertCircle size={16} />
              ) : (
                <Check size={16} />
              )}
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
                <div className="form-section">
                  <h3>Basic Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="displayName">Display Name</label>
                    <input
                      id="displayName"
                      type="text"
                      {...registerProfile('displayName')}
                      disabled={!isEditing}
                      className={profileErrors.displayName ? 'error' : ''}
                    />
                    {profileErrors.displayName && (
                      <span className="error-message">{profileErrors.displayName.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      rows={4}
                      {...registerProfile('bio')}
                      disabled={!isEditing}
                      className={profileErrors.bio ? 'error' : ''}
                      placeholder="Tell us about yourself..."
                    />
                    {profileErrors.bio && (
                      <span className="error-message">{profileErrors.bio.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      type="url"
                      {...registerProfile('website')}
                      disabled={!isEditing}
                      className={profileErrors.website ? 'error' : ''}
                      placeholder="https://example.com"
                    />
                    {profileErrors.website && (
                      <span className="error-message">{profileErrors.website.message}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      type="text"
                      {...registerProfile('location')}
                      disabled={!isEditing}
                      className={profileErrors.location ? 'error' : ''}
                      placeholder="City, Country"
                    />
                    {profileErrors.location && (
                      <span className="error-message">{profileErrors.location.message}</span>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  <h3>Social Links</h3>
                  
                  <div className="form-group">
                    <label htmlFor="twitter">Twitter</label>
                    <input
                      id="twitter"
                      type="text"
                      {...registerProfile('socialLinks.twitter')}
                      disabled={!isEditing}
                      placeholder="@username"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="linkedin">LinkedIn</label>
                    <input
                      id="linkedin"
                      type="text"
                      {...registerProfile('socialLinks.linkedin')}
                      disabled={!isEditing}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="github">GitHub</label>
                    <input
                      id="github"
                      type="text"
                      {...registerProfile('socialLinks.github')}
                      disabled={!isEditing}
                      placeholder="github.com/username"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="tab-content">
              <form onSubmit={handleSubmitPreferences(onSubmitPreferences)}>
                <div className="form-section">
                  <h3>Display Settings</h3>
                  
                  <div className="form-group">
                    <label htmlFor="theme">Theme</label>
                    <select id="theme" {...registerPreferences('theme')}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="language">Language</label>
                    <select id="language" {...registerPreferences('language')}>
                      <option value="en">English</option>
                      <option value="zh-CN">简体中文</option>
                      <option value="zh-TW">繁體中文</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Content Settings</h3>
                  
                  <div className="form-group">
                    <label htmlFor="defaultPostType">Default Post Type</label>
                    <select id="defaultPostType" {...registerPreferences('defaultPostType')}>
                      <option value="article">Article</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="news">News</option>
                      <option value="opinion">Opinion</option>
                      <option value="review">Review</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('autoSave')}
                      />
                      Enable auto-save while writing
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Privacy Settings</h3>
                  
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('showEmail')}
                      />
                      Show email address on profile
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('allowFollowing')}
                      />
                      Allow others to follow me
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('allowComments')}
                      />
                      Allow comments on my posts
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Email Notifications</h3>
                  
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('emailNotifications.newFollower')}
                      />
                      New followers
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('emailNotifications.newComment')}
                      />
                      New comments on my posts
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('emailNotifications.postLiked')}
                      />
                      When someone likes my posts
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        {...registerPreferences('emailNotifications.weeklyDigest')}
                      />
                      Weekly digest
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save size={16} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="tab-content">
              <div className="form-section">
                <h3>Account Security</h3>
                
                <div className="security-item">
                  <div className="security-info">
                    <h4>Password</h4>
                    <p>Update your password to keep your account secure</p>
                  </div>
                  <button className="btn btn-outline">
                    Change Password
                  </button>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h4>Email Address</h4>
                    <p>{currentUser.email}</p>
                    {currentUser.isVerified ? (
                      <span className="status verified">Verified</span>
                    ) : (
                      <span className="status unverified">Unverified</span>
                    )}
                  </div>
                  {!currentUser.isVerified && (
                    <button className="btn btn-outline">
                      Verify Email
                    </button>
                  )}
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className="btn btn-outline">
                    Enable 2FA
                  </button>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h4>Active Sessions</h4>
                    <p>Manage your active login sessions</p>
                  </div>
                  <button className="btn btn-outline">
                    View Sessions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Public Profile View */}
      {!isOwnProfile && (
        <div className="public-profile-content">
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{currentUser.postCount}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat">
              <span className="stat-number">{currentUser.followerCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat">
              <span className="stat-number">{currentUser.followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
            <div className="stat">
              <span className="stat-number">{currentUser.totalViews}</span>
              <span className="stat-label">Views</span>
            </div>
          </div>

          {/* Recent posts would go here */}
          <div className="recent-posts">
            <h3>Recent Posts</h3>
            {/* Post list component would be rendered here */}
          </div>
        </div>
      )}
    </div>
  );
};