'use client';

/**
 * Mock Clerk components and hooks for build time
 * These are used when real Clerk keys are not available
 */

export function MockClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    isSignedIn: false,
    isLoaded: true,
    userId: null,
    sessionId: null,
    getToken: async () => null,
  };
}

export function useUser() {
  return {
    isSignedIn: false,
    isLoaded: true,
    user: null,
  };
}

export function useClerk() {
  return {
    signOut: () => Promise.resolve(),
    openSignIn: () => {},
    openSignUp: () => {},
  };
}
