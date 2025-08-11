import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { Providers } from '@/components/Providers';
import { ConditionalLayout } from '@/components/ConditionalLayout';

export const metadata: Metadata = {
  title: 'FlowVision - Efficiency Intelligence Platform',
  description:
    'Transform friction into flow. AI-powered efficiency intelligence platform for SMB leadership to detect operational friction, categorize improvement ideas, and create strategic roadmaps.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
