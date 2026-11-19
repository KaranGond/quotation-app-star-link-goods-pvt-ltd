import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { admin } from 'better-auth/plugins';

// Configure PostgreSQL pool connection for Better Auth
export const dbPool = new Pool({
  connectionString: process.env.PG_URI,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export const auth = betterAuth({
  database: dbPool,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-arpit-solar-shop-2026-auth-key-32',
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
