'use client';

import { SignIn } from '@clerk/nextjs';

// Force dynamic rendering - completely disable static optimization
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
