import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { Providers } from '@/components/Providers';
import ToastProvider from '@/components/ToastProvider';
import { ConditionalLayout } from '@/components/ConditionalLayout';

export const metadata: Metadata = {
  title: 'FlowVision - AI-Powered Business Intelligence',
  description:
    'Transform friction into flow. Professional AI-powered business intelligence platform for architecture and engineering teams to detect operational friction, categorize improvement ideas, and create strategic roadmaps.',
  keywords: [
    'business intelligence',
    'AI-powered analytics',
    'workflow optimization',
    'operational efficiency',
    'strategic planning',
    'architecture engineering',
    'process improvement',
  ],
  authors: [{ name: 'FlowVision Team' }],
  creator: 'FlowVision',
  publisher: 'FlowVision',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FlowVision',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'FlowVision',
    'application-name': 'FlowVision',
    'msapplication-TileColor': '#3B82F6',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#3B82F6',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3B82F6',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <ToastProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
