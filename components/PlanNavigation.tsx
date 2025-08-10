'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PlanNavigation() {
  const pathname = usePathname();

  const planPages = [
    {
      name: 'Ideas',
      href: '/ideas',
      description: 'Brainstorm & capture',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      name: 'Initiatives',
      href: '/initiatives',
      description: 'Create & manage',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      name: 'Prioritize',
      href: '/prioritize',
      description: 'Rank & compare',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  // Only show this navigation on plan-related pages
  const isPlanPage = pathname === '/ideas' || pathname?.startsWith('/initiatives') || pathname === '/prioritize';
  
  if (!isPlanPage) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex space-x-8">
          {planPages.map((page) => {
            const isActive = pathname === page.href || 
              (page.href === '/initiatives' && pathname?.startsWith('/initiatives'));
            
            return (
              <Link
                key={page.name}
                href={page.href as any}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {page.icon}
                <span>{page.name}</span>
                <span className="hidden md:inline text-xs opacity-75">
                  {page.description}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}