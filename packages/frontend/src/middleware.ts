import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simplified middleware for Next.js
// Auth is handled client-side via AuthGuard since auth state is in localStorage
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to login page (client-side auth will handle further redirects)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
