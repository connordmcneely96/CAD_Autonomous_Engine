'use client';

import { SignUp } from '@clerk/nextjs';

// Force dynamic rendering - completely disable static optimization
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
