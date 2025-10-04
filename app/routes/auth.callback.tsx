import type { LoaderFunction } from '@remix-run/cloudflare'
import { redirect } from '@remix-run/cloudflare'
import { createSupabaseServerClient } from '~/lib/supabase/server'

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/'

  if (code) {
    try {
      const { supabase, headers } = createSupabaseServerClient(request, context)
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)
        // Redirect to home with error (you could add error query param)
        return redirect('/?auth_error=callback_failed')
      }

      // Return redirect with auth cookies set
      return redirect(next, { headers })
    } catch (error) {
      console.error('Auth callback exception:', error)
      return redirect('/?auth_error=callback_exception')
    }
  }

  // Redirect to the intended destination or home
  return redirect(next)
}