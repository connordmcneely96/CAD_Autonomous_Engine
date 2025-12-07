'use client';

import { SignUp } from '@clerk/nextjs';

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
