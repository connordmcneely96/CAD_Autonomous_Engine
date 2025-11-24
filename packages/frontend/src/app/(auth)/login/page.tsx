'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
