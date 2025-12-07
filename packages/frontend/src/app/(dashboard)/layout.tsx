'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Sidebar } from '@/components/dashboard/Sidebar';

// Force dynamic rendering - completely disable static optimization
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state until auth is ready
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
