import { openDatabase, getAll } from '~/lib/persistence/db';
import { createClient } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Migration');

export interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
  totalChats: number;
}

export async function migrateIndexedDBToSupabase(): Promise<MigrationResult> {
  const supabase = createClient();

  // check if user is logged in
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User must be logged in to migrate. Please sign in first.');
  }

  logger.info('Starting migration for user:', user.email);

  // get all chats from IndexedDB
  const db = await openDatabase();

  if (!db) {
    throw new Error('Could not open IndexedDB. Migration cannot proceed.');
  }

  const chats = await getAll(db);

  logger.info(`Found ${chats.length} chats in IndexedDB`);

  const results: MigrationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    totalChats: chats.length,
  };

  if (chats.length === 0) {
    logger.info('No chats to migrate');
    return results;
  }

  // check which chats already exist in Supabase to avoid duplicates
  const { data: existingChats } = await supabase.from('chats').select('url_id').eq('user_id', user.id);

  const existingUrlIds = new Set(existingChats?.map((c: any) => c.url_id) || []);

  // migrate each chat to Supabase
  for (const chat of chats) {
    try {
      const urlId = chat.urlId || chat.id;

      // skip if already migrated
      if (existingUrlIds.has(urlId)) {
        logger.info(`Skipping chat ${urlId} - already exists in Supabase`);
        results.skipped++;
        continue;
      }

      const { error } = await supabase.from('chats').upsert(
        {
          user_id: user.id,
          url_id: urlId,
          description: chat.description || null,
          messages: chat.messages as any,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'url_id,user_id',
        },
      );

      if (error) {
        throw error;
      }

      logger.info(`Successfully migrated chat ${urlId}`);
      results.success++;
    } catch (error: any) {
      logger.error(`Failed to migrate chat ${chat.id}:`, error);
      results.failed++;
      results.errors.push(`Chat ${chat.urlId || chat.id}: ${error.message}`);
    }
  }

  logger.info('Migration complete:', results);

  return results;
}

export async function hasLocalChats(): Promise<boolean> {
  try {
    const db = await openDatabase();

    if (!db) {
      return false;
    }

    const chats = await getAll(db);

    return chats.length > 0;
  } catch (error) {
    logger.error('Error checking for local chats:', error);
    return false;
  }
}
