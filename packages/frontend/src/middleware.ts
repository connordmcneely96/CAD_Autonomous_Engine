import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup'];

// Routes that should redirect to /projects if already authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user is authenticated by looking for auth data in cookies
  const authStorage = request.cookies.get('cad-auth-storage');
  let isAuthenticated = false;

  if (authStorage) {
    try {
      const authData = JSON.parse(authStorage.value);
      isAuthenticated = authData.state?.isAuthenticated || false;
    } catch (error) {
      // Invalid auth data, treat as not authenticated
      isAuthenticated = false;
    }
  }

  // If trying to access auth pages while already authenticated, redirect to projects
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/projects', request.url));
  }

  // If trying to access protected route while not authenticated, redirect to login
  if (!isAuthenticated && !publicRoutes.includes(pathname) && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect root to appropriate page
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/projects', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
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
