# Supabase Constraint Fix - Chat Upsert Issue

## Problem Summary

The application was experiencing a 400 error (PostgreSQL error code 42P10) when syncing chat history to Supabase. The error message was:

```
"there is no unique or exclusion constraint matching the ON CONFLICT specification"
```

## Root Cause

There was a mismatch between the database schema and the application code:

1. **Database Schema** (`scripts/schema.sql:47`):
   - Had `url_id TEXT NOT NULL UNIQUE` (unique constraint on `url_id` alone)

2. **Application Code** (`app/lib/persistence/useChatHistory.ts:216`):
   - Used `.upsert(..., { onConflict: 'url_id,user_id' })` (expecting composite constraint)

The database didn't have a unique constraint on the `(url_id, user_id)` pair, but the code was trying to use it for conflict resolution.

## Solution Implemented

### 1. Updated Database Schema

**File:** `scripts/schema.sql`

Changed the chats table definition from:
```sql
url_id TEXT NOT NULL UNIQUE,
```

To:
```sql
url_id TEXT NOT NULL,
...
UNIQUE(url_id, user_id)
```

This allows different users to have chats with the same `url_id`, which is the intended behavior.

### 2. Created Migration Script

**File:** `scripts/migrations/001_fix_chats_unique_constraint.sql`

Created a migration script for existing databases that:
- Drops the old unique constraint on `url_id` alone
- Adds a new composite unique constraint on `(url_id, user_id)`
- Verifies the constraint was created successfully

### 3. Updated Migration Code

**Files Updated:**
- `app/lib/migration/migrate-to-supabase.ts`
- `app/components/settings/MigrationSettings.tsx`

Changed from `.insert()` to `.upsert()` with `onConflict: 'url_id,user_id'` to:
- Handle duplicate migrations gracefully
- Match the new schema constraint
- Prevent errors if the same chat is migrated twice

## How to Apply the Fix

### For New Installations

Use the updated `scripts/schema.sql` file when setting up your Supabase database.

### For Existing Installations

Run the migration script in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `scripts/migrations/001_fix_chats_unique_constraint.sql`
4. Execute the SQL script
5. Verify the fix by checking for the new constraint:

```sql
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'public.chats'::regclass;
```

You should see `chats_url_id_user_id_unique` with type `u` (unique).

## Files Modified

1. `scripts/schema.sql` - Updated chats table definition
2. `scripts/migrations/001_fix_chats_unique_constraint.sql` - New migration script
3. `scripts/migrations/README.md` - Migration documentation
4. `app/lib/migration/migrate-to-supabase.ts` - Changed insert to upsert
5. `app/components/settings/MigrationSettings.tsx` - Changed insert to upsert
6. `app/lib/persistence/useChatHistory.ts` - Already had correct upsert code

## Verification

After applying the migration:

1. The 400 error should no longer occur when syncing chats
2. Users can successfully save and sync chat history to Supabase
3. Different users can have chats with the same `url_id`
4. The same user cannot have duplicate chats with the same `url_id`

## Technical Details

**PostgreSQL Error Code 42P10**: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

This error occurs when using `ON CONFLICT` with columns that don't have a matching unique constraint. The fix ensures the database constraint matches what the application code expects.

**Why Composite Constraint?**

The composite constraint `UNIQUE(url_id, user_id)` makes sense for this application because:
- Each user should have unique chat URLs within their account
- Different users should be able to use the same chat URL patterns
- This enables multi-user support with proper isolation

## Testing

TypeScript type checking passed:
```bash
pnpm run typecheck
✓ All types valid
```

The fix is backward compatible and doesn't require changes to existing client code.
