'use client';

import { SignIn } from '@clerk/nextjs';

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
