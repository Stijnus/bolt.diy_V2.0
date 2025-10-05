import { json, type LoaderFunction } from '@remix-run/cloudflare';
import { testSupabaseConnection } from '~/lib/supabase/test-connection';

export const loader: LoaderFunction = async ({ request: _request, context: _context }) => {
  try {
    const result = await testSupabaseConnection();
    return json(result);
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
