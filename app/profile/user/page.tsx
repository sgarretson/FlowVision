'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type UserProfile = {
  name: string;
  email: string;
  role: 'ADMIN' | 'LEADER';
  preferences: {
    notifications: {
      email: boolean;
      browser: boolean;
      digest: 'daily' | 'weekly' | 'none';
    };
    theme: 'light' | 'dark' | 'system';
    timezone: string;
  };
};

export default function UserProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    role: 'LEADER',
    preferences: {
      notifications: {
        email: true,
        browser: true,
        digest: 'weekly'
      },
      theme: 'light',
      timezone: 'America/New_York'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth');
      return;
    }
    loadUserProfile();
  }, [session, router]);

  async function loadUserProfile() {
    try {
      const res = await fetch('/api/profile/user');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'LEADER',
          preferences: data.preferences || profile.preferences
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/profile/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (res.ok) {
        setMessage('Profile updated successfully');
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48"></div>
        <div className="card-secondary p-6">
          <div className="space-y-4">
            <div className="skeleton h-4 w-24"></div>
            <div className="skeleton h-10 w-full"></div>
            <div className="skeleton h-4 w-24"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h1">Personal Profile</h1>
        <p className="text-body text-gray-600 mt-2">
          Manage your personal information and preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <div className="card-secondary p-6">
          <h2 className="text-h2 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="form-input bg-gray-50 text-gray-500 cursor-not-allowed"
                title="Email cannot be changed"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                id="role"
                type="text"
                value={profile.role}
                disabled
                className="form-input bg-gray-50 text-gray-500 cursor-not-allowed"
                title="Role can only be changed by an administrator"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                id="timezone"
                value={profile.preferences.timezone}
                onChange={(e) => setProfile({
                  ...profile,
                  preferences: {...profile.preferences, timezone: e.target.value}
                })}
                className="form-select"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card-secondary p-6">
          <h2 className="text-h2 mb-4">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive updates via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.preferences.notifications.email}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      notifications: {
                        ...profile.preferences.notifications,
                        email: e.target.checked
                      }
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Browser Notifications</div>
                <div className="text-sm text-gray-500">Show notifications in your browser</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.preferences.notifications.browser}
                  onChange={(e) => setProfile({
                    ...profile,
                    preferences: {
                      ...profile.preferences,
                      notifications: {
                        ...profile.preferences.notifications,
                        browser: e.target.checked
                      }
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div>
              <label htmlFor="digest" className="block text-sm font-medium text-gray-700 mb-2">
                Email Digest Frequency
              </label>
              <select
                id="digest"
                value={profile.preferences.notifications.digest}
                onChange={(e) => setProfile({
                  ...profile,
                  preferences: {
                    ...profile.preferences,
                    notifications: {
                      ...profile.preferences.notifications,
                      digest: e.target.value as 'daily' | 'weekly' | 'none'
                    }
                  }
                })}
                className="form-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card-secondary p-6">
          <h2 className="text-h2 mb-4">Appearance</h2>
          
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              id="theme"
              value={profile.preferences.theme}
              onChange={(e) => setProfile({
                ...profile,
                preferences: {...profile.preferences, theme: e.target.value as 'light' | 'dark' | 'system'}
              })}
              className="form-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Choose your preferred theme appearance
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            {message && (
              <div className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => loadUserProfile()}
              className="btn-secondary"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}