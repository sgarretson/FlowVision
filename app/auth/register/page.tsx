'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

type RegistrationStep = 'account' | 'profile' | 'complete';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<RegistrationStep>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account details
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // Business profile
  const [profileData, setProfileData] = useState({
    industry: '',
    size: 0,
    metrics: {},
  });

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (accountData.password !== accountData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (accountData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountData.email,
          password: accountData.password,
          name: accountData.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep('profile');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in first
      const signInResult = await signIn('credentials', {
        email: accountData.email,
        password: accountData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Failed to sign in after registration');
        return;
      }

      // Create business profile
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (profileRes.ok) {
        setStep('complete');
      } else {
        setError('Failed to create business profile');
      }
    } catch (err) {
      setError('Failed to complete setup');
    } finally {
      setLoading(false);
    }
  }

  function handleComplete() {
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo-flowvision.svg" alt="FlowVision" className="h-12 w-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Welcome to FlowVision</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Transform friction into flow with AI-powered efficiency intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === 'account' ? 'bg-primary text-white' : 'bg-green-500 text-white'
                }`}
              >
                {step === 'account' ? '1' : '✓'}
              </div>
              <div
                className={`flex-1 h-1 mx-4 ${
                  ['profile', 'complete'].includes(step) ? 'bg-green-500' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === 'profile'
                    ? 'bg-primary text-white'
                    : step === 'complete'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step === 'complete' ? '✓' : '2'}
              </div>
              <div
                className={`flex-1 h-1 mx-4 ${
                  step === 'complete' ? 'bg-green-500' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === 'complete' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step === 'complete' ? '✓' : '3'}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Account</span>
              <span>Profile</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Account Setup Step */}
          {step === 'account' && (
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Your Account</h3>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-sm text-gray-500">Minimum 8 characters</p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={accountData.confirmPassword}
                  onChange={(e) =>
                    setAccountData({ ...accountData, confirmPassword: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Business Profile Step */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tell Us About Your Organization
              </h3>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Industry
                </label>
                <select
                  id="industry"
                  required
                  value={profileData.industry}
                  onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="">Select Industry</option>
                  <option value="Architecture">Architecture & Engineering</option>
                  <option value="Consulting">Professional Services</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial">Financial Services</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                  Organization Size
                </label>
                <select
                  id="size"
                  required
                  value={profileData.size}
                  onChange={(e) =>
                    setProfileData({ ...profileData, size: parseInt(e.target.value) })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value={0}>Select Size</option>
                  <option value={10}>1-10 employees</option>
                  <option value={25}>11-25 employees</option>
                  <option value={50}>26-50 employees</option>
                  <option value={100}>51-100 employees</option>
                  <option value={200}>101-200 employees</option>
                  <option value={500}>200+ employees</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What comes next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Access your personalized dashboard</li>
                  <li>• Start identifying operational friction points</li>
                  <li>• Create your first improvement initiative</li>
                  <li>• Collaborate with your team on solutions</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </form>
          )}

          {/* Completion Step */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Welcome to FlowVision!</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Your account has been created successfully. You're ready to transform friction
                  into flow.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Start Guide:</h4>
                <div className="text-sm text-gray-600 space-y-1 text-left">
                  <div>1. Explore your dashboard to see the big picture</div>
                  <div>2. Identify issues your team is experiencing</div>
                  <div>3. Brainstorm ideas and solutions collaboratively</div>
                  <div>4. Create initiatives to drive meaningful change</div>
                  <div>5. Track progress and celebrate success</div>
                </div>
              </div>

              <button onClick={handleComplete} className="w-full btn-primary">
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
