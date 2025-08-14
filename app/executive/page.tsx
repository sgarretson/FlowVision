'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExecutivePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new Insights page
    router.replace('/insights');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Redirecting to Insights...</h2>
        <p className="text-gray-500">The Executive Dashboard has moved to the new Insights tab.</p>
      </div>
    </div>
  );
}
