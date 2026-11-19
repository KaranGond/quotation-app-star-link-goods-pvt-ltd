import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Resolve Supabase credentials strictly from environment variables
const getSupabaseCredentials = () => {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://placeholder-supabase-url.supabase.co';

  // Read service role key or public key strictly from environment variables
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    // Build-time safe placeholder token so Next.js static page analysis does not throw
    'dummy-key-for-build-time-prerender';

  return { url, key };
};

// Lazy-initialized clients to avoid build-time static evaluation crashes
let _serverSupabase: SupabaseClient | null = null;

// Server-side client with service role key (with comprehensive environment fallback)
export const getServerSupabase = (): SupabaseClient => {
  if (!_serverSupabase) {
    const { url, key } = getSupabaseCredentials();
    _serverSupabase = createClient(url, key);
  }
  return _serverSupabase;
};

// Backward-compatible lazy proxy for `supabase` so top-level imports NEVER throw at build time
export const supabase = new Proxy({} as SupabaseClient, {
  get: (_target, prop) => {
    const client = getServerSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
