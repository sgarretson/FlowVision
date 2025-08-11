'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'LEADER';
  createdAt: string;
};

type SystemStats = {
  totalUsers: number;
  totalInitiatives: number;
  activeInitiatives: number;
  totalIssues: number;
  criticalIssues: number;
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    if (session && (session.user as any)?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [session, router]);

  useEffect(() => {
    if (session && (session.user as any)?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [session]);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/admin/stats')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Failed to delete user');
    }
  }

  async function toggleUserRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'ADMIN' ? 'LEADER' : 'ADMIN';
    
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === userId ? { ...u, role: updatedUser.role } : u));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update user role');
      }
    } catch (err) {
      console.error('Update role error:', err);
      alert('Failed to update user role');
    }
  }

  if (!session) return <div>Loading...</div>;
  
  if ((session.user as any)?.role !== 'ADMIN') {
    return (
      <div className="card-secondary p-8 text-center">
        <h1 className="text-h2 text-danger mb-4">Access Denied</h1>
        <p className="text-body">You need admin privileges to access this page.</p>
        <Link href="/" className="btn-primary mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="card-secondary p-6">
              <div className="skeleton h-4 w-24 mb-2"></div>
              <div className="skeleton h-8 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-h1">System Administration</h1>
        <button className="btn-primary" onClick={() => alert('User management coming soon')}>
          Add New User
        </button>
      </div>

      {/* System Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="card-secondary p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{stats.totalUsers}</div>
            <div className="text-caption">Total Users</div>
          </div>
          <div className="card-secondary p-6 text-center">
            <div className="text-3xl font-bold text-success mb-2">{stats.totalInitiatives}</div>
            <div className="text-caption">Total Initiatives</div>
          </div>
          <div className="card-secondary p-6 text-center">
            <div className="text-3xl font-bold text-warning mb-2">{stats.activeInitiatives}</div>
            <div className="text-caption">Active Initiatives</div>
          </div>
          <div className="card-secondary p-6 text-center">
            <div className="text-3xl font-bold text-gray-600 mb-2">{stats.totalIssues}</div>
            <div className="text-caption">Total Issues</div>
          </div>
          <div className="card-secondary p-6 text-center">
            <div className="text-3xl font-bold text-danger mb-2">{stats.criticalIssues}</div>
            <div className="text-caption">Critical Issues</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button type="button" className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow group text-left" onClick={() => alert('User management coming soon')}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-h3 mb-2 text-center">Manage Users</h3>
          <p className="text-caption text-center">Add, edit, and manage user accounts and roles</p>
        </button>

        <Link href="/logs" className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow group">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-h3 mb-2 text-center">Audit Logs</h3>
          <p className="text-caption text-center">View system activity and user actions</p>
        </Link>

        <Link href="/admin/openai" className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow group">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-h3 mb-2 text-center">OpenAI Integration</h3>
          <p className="text-caption text-center">Configure AI-powered features and API settings</p>
        </Link>

        <button type="button" className="card-tertiary p-6 hover:shadow-card-secondary transition-shadow group text-left" onClick={() => alert('Settings coming soon')}>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-h3 mb-2 text-center">System Settings</h3>
          <p className="text-caption text-center">Configure system-wide settings and preferences</p>
        </button>
      </div>

      {/* Recent Users */}
      <div className="card-secondary">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-h2">Recent Users</h2>
            <button className="text-sm text-primary hover:underline" onClick={() => alert('View all users coming soon')}>
              View All Users
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.slice(0, 5).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleUserRole(user.id, user.role)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Toggle Role
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
}