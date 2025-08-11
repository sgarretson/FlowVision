'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { PlanNavigation } from '@/components/PlanNavigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Determine if we should show navigation
  const isAuthPage = pathname === '/auth' || pathname === '/auth/register';
  const showNavigation = session && !isAuthPage;

  // If loading session, show basic layout
  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl p-4">{children}</div>
      </div>
    );
  }

  // If on auth page or not authenticated, show minimal layout
  if (isAuthPage || !session) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Show full layout with navigation for authenticated users
  return (
    <div className="min-h-screen">
      <Header />
      <PlanNavigation />
      <div className="mx-auto max-w-7xl p-4">{children}</div>
    </div>
  );
}
