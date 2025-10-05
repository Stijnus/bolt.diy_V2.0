import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase environment variables. Authentication features will be disabled. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file to enable authentication.',
    );

    // return a mock client that won't break the app
    return null as any;
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// export a singleton instance for convenience
export const supabase = createClient();
