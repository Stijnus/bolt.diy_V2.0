# Database Migrations

This directory contains SQL migration scripts for updating existing Supabase databases.

## How to Apply Migrations

### Option 1: Manual Application (Recommended for Production)

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Execute the SQL script
5. Verify the changes

### Option 2: Using Supabase CLI

```bash
# Run a specific migration
supabase db execute --file scripts/migrations/001_fix_chats_unique_constraint.sql
```

## Migration History

### 001_fix_chats_unique_constraint.sql
- **Date:** 2025-10-06
- **Purpose:** Fix the chats table unique constraint mismatch
- **Changes:**
  - Removes `UNIQUE` constraint on `url_id` alone
  - Adds composite `UNIQUE(url_id, user_id)` constraint
- **Impact:** Allows different users to have chats with the same url_id
- **Required:** Yes, if you encounter "42P10" errors when syncing chats

## Notes

- Always backup your database before running migrations
- Test migrations in a development environment first
- Migrations are idempotent where possible
- For new installations, use `scripts/schema.sql` instead
