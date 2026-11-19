import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — created on first use, not at import time.
// This prevents "supabaseKey is required" crashes during Next.js build
// when environment variables are not yet injected.
let _supabase: SupabaseClient | null = null;

export const getServerSupabase = (): SupabaseClient => {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
};
