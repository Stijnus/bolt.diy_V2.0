import type { AppLoadContext } from '@remix-run/cloudflare';
import { createServerClient, parse, serialize } from '@supabase/ssr';
import type { Database } from './types';

// type for our Cloudflare environment variables
interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
  [key: string]: string;
}

export function createSupabaseServerClient(request: Request, context: AppLoadContext) {
  const cookies = parse(request.headers.get('Cookie') ?? '');

  // in development, context.env might be undefined, so we fall back to process.env
  const env = (context.env as Env) || (process.env as any);

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for server client');
  }

  // for server-side operations, we need to handle cookie management
  const headers = new Headers();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(key) {
        return cookies[key];
      },
      set(key, value, options) {
        headers.append('Set-Cookie', serialize(key, value, options));
      },
      remove(key, options) {
        headers.append('Set-Cookie', serialize(key, '', options));
      },
    },
  });

  return { supabase, headers };
}

// alternative simplified version for basic operations
export function createSupabaseServerClientSimple(context: AppLoadContext) {
  const env = (context.env as Env) || (process.env as any);

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for server client');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {
        return;
      },
      remove() {
        return;
      },
    },
  });
}
