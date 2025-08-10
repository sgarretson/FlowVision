'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navSections = [
    {
      title: 'Identify',
      href: '/issues',
      description: 'Discover problems',
      active: pathname === '/issues'
    },
    {
      title: 'Plan', 
      href: '/initiatives',
      description: 'Create solutions',
      active: pathname?.startsWith('/initiatives') || pathname === '/prioritize' || pathname === '/ideas'
    },
    {
      title: 'Execute',
      href: '/track',
      description: 'Track progress',
      active: pathname === '/track' || pathname === '/roadmap'
    },
    {
      title: 'Analyze',
      href: '/logs',
      description: 'Review insights',
      active: pathname === '/logs' || pathname === '/profile'
    }
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/logo-flowvision.svg" alt="FlowVision" className="h-8 w-auto mr-2" />
            <div className="text-xl font-bold text-blue-600">FlowVision</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navSections.map((section) => (
              <Link
                key={section.title}
                href={section.href as any}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  section.active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div>{section.title}</div>
                  <div className="text-xs opacity-75">{section.description}</div>
                </div>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            {session?.user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {session.user.email}
                </span>
                <button 
                  onClick={() => signOut()} 
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn()} 
                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {navSections.map((section) => (
                <Link
                  key={section.title}
                  href={section.href as any}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm font-medium ${
                    section.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div>{section.title}</div>
                  <div className="text-xs opacity-75">{section.description}</div>
                </Link>
              ))}
              
              {/* Mobile User Menu */}
              <div className="pt-3 border-t border-gray-200">
                {session?.user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-700">
                      {session.user.email}
                    </div>
                    <button 
                      onClick={() => signOut()} 
                      className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => signIn()} 
                    className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
