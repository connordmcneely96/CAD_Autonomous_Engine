import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Providers } from '@/components/providers';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CAD Autonomous Engine',
  description: 'AI-powered CAD SaaS platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
