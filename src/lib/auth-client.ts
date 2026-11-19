import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

const getClientBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getClientBaseUrl(),
  plugins: [
    adminClient(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
