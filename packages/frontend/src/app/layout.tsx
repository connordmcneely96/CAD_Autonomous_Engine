import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Providers } from '@/components/providers';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CAD Autonomous Engine',
  description: 'AI-powered CAD SaaS platform',
};

// Check if we have real Clerk keys (not placeholders)
const hasRealClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_PLACEHOLDER_KEY_FOR_BUILD_ONLY' &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('PLACEHOLDER');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {hasRealClerkKeys ? (
          <ClerkProvider>
            <Providers>{children}</Providers>
          </ClerkProvider>
        ) : (
          <Providers>{children}</Providers>
        )}
      </body>
    </html>
  );
}
