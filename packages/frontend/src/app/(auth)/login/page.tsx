'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sign-in');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Redirecting to sign in...
    </div>
  );
}
