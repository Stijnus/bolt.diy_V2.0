import { createServerClient, parse, serialize } from '@supabase/ssr'
import type { AppLoadContext } from '@remix-run/cloudflare'
import type { Database } from './types'

// Type for our Cloudflare environment variables
interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ANTHROPIC_API_KEY: string
  [key: string]: string
}

export function createSupabaseServerClient(request: Request, context: AppLoadContext) {
  const cookies = parse(request.headers.get('Cookie') ?? '')
  const env = context.env as Env
  
  // For server-side operations, we need to handle cookie management
  const headers = new Headers()

  const supabase = createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key]
        },
        set(key, value, options) {
          headers.append('Set-Cookie', serialize(key, value, options))
        },
        remove(key, options) {
          headers.append('Set-Cookie', serialize(key, '', options))
        },
      },
    }
  )

  return { supabase, headers }
}

// Alternative simplified version for basic operations
export function createSupabaseServerClientSimple(context: AppLoadContext) {
  const env = context.env as Env
  
  return createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  )
}