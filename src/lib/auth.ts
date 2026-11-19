import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { admin } from 'better-auth/plugins';

// Database connection string strictly sourced from environment variables
const pgConnectionString =
  process.env.PG_URI ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!pgConnectionString && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: PG_URI environment variable is not defined. PostgreSQL database operations will fail.');
}

// Configure PostgreSQL pool connection for Better Auth
export const dbPool = new Pool({
  connectionString: pgConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

// Dynamic Base URL detection: seamlessly handles both Localhost and Vercel Production
const getAuthBaseUrl = () => {
  // 1. When deployed to Vercel or running in production cloud
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes('localhost')) {
      return process.env.BETTER_AUTH_URL;
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'https://quotation-app-star-link-goods-pvt-l.vercel.app';
  }

  // 2. When running locally (npm run dev on http://localhost:3000)
  return 'http://localhost:3000';
};

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: BETTER_AUTH_SECRET is not defined in production environment variables.');
}

export const auth = betterAuth({
  database: dbPool,
  baseURL: getAuthBaseUrl(),
  secret: authSecret || 'fallback-dev-secret-do-not-use-in-production',
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
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
