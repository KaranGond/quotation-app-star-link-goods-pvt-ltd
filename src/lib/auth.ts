import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { admin } from 'better-auth/plugins';

// Database connection string with resilient fallback to Supabase PostgreSQL
const pgConnectionString =
  process.env.PG_URI ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:gnWuCJeERIZR3gCG@db.eugejgacxgxwfiwxzqck.supabase.co:5432/postgres';

// Configure PostgreSQL pool connection for Better Auth
export const dbPool = new Pool({
  connectionString: pgConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

// Dynamic Base URL detection for Vercel, Production, and Localhost
const getAuthBaseUrl = () => {
  // If running locally in development (npm run dev), always use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // If explicitly configured with a remote/production URL, use it
  if (process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes('localhost')) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Vercel auto-provided URLs
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Deployment specific domain for Vercel
  if (process.env.NODE_ENV === 'production') {
    return 'https://quotation-app-star-link-goods-pvt-l.vercel.app';
  }
  return 'http://localhost:3000';
};

export const auth = betterAuth({
  database: dbPool,
  baseURL: getAuthBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET || '4f71e9b2cc03bf9e83cd641e459be2d3cb0b06afbdf385ce8bf41485455b4194',
  trustedOrigins: [
    'http://localhost:3000',
    'https://*.vercel.app',
    'https://quotation-app-star-link-goods-pvt-l.vercel.app',
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
  ],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Closed enterprise system: public registration disabled
    requireEmailVerification: false,
    minPasswordLength: 6,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days session
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [
    admin({
      defaultRole: 'sales',
      adminRole: 'admin',
    }),
  ],
});
