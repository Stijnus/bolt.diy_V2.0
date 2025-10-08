import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import type { Settings } from '~/lib/stores/settings';
import { createSupabaseServerClient } from '~/lib/supabase/server';

export async function loader({ request, context }: LoaderFunctionArgs) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { supabase } = createSupabaseServerClient(request, context);

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Retrieve user settings
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('settings')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is okay for new users
      console.error('Error fetching user settings:', userError);
      return new Response('Internal server error', { status: 500 });
    }

    const settings = userData?.settings || {};

    return new Response(JSON.stringify({ settings }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Settings loader error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { supabase } = createSupabaseServerClient(request, context);

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // POST: Update user settings
    const body = await request.json();
    const { settings } = body as { settings: Partial<Settings> };

    if (!settings || typeof settings !== 'object') {
      return new Response('Invalid settings data', { status: 400 });
    }

    // Validate settings structure
    const validSettings: Partial<Settings> = {};

    if (settings.editor && typeof settings.editor === 'object') {
      validSettings.editor = settings.editor;
    }

    if (settings.ai && typeof settings.ai === 'object') {
      validSettings.ai = settings.ai;
    }

    if (settings.preferences && typeof settings.preferences === 'object') {
      validSettings.preferences = settings.preferences;
    }

    if (Object.keys(validSettings).length === 0) {
      return new Response('No valid settings provided', { status: 400 });
    }

    // Update or create user record with settings
    const { error: updateError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
      settings: validSettings as any, // Cast to any to bypass JSON type constraints
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      console.error('Error updating user settings:', updateError);
      return new Response('Failed to save settings', { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, settings: validSettings }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
