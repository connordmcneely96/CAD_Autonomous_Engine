'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sign-up');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Redirecting to sign up...
    </div>
  );
}
