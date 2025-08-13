'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth');
    }
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Authenticating...</h2>
          <p className="text-sm text-gray-600">Verifying your credentials</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to login...</h2>
          <p className="text-sm text-gray-600">Taking you to the authentication page</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
