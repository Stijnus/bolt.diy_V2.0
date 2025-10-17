# Usage Tracking Implementation Summary

## Overview
Complete implementation of token usage tracking with cloud sync capabilities, model-change reset, and enhanced UI display.

## Features Implemented

### 1. Core Usage Tracking
- ✅ Real-time token usage tracking per conversation
- ✅ Cost calculation based on model pricing
- ✅ Dual storage: IndexedDB (local) + Supabase (cloud)
- ✅ Usage metadata extraction from AI streaming responses
- ✅ Automatic persistence after each assistant message

### 2. User Preferences
Added two new preference flags in Settings → Usage:

#### Reset Usage on Model Change
- **Default:** Off
- **Behavior:** When enabled, token/cost counters reset to zero when switching between models
- **Use Case:** Track usage per model separately within a conversation

#### Sync Usage to Supabase
- **Default:** Off
- **Behavior:** When enabled and authenticated, usage records sync to cloud database
- **Use Case:** Cross-device usage history and cloud backup
- **Note:** Only available when signed in

### 3. UI Enhancements

#### Chat Footer (UsageStats Component)
- Live token counters (input/output/total)
- Cost display with currency formatting
- Model badge showing current `provider:model`
- Responsive design (model badge hidden on small screens)

#### Settings → Usage Dashboard
- Fetches from both IndexedDB and Supabase (when authenticated and sync enabled)
- Displays usage history with filtering and charts
- CSV export functionality
- Provider and model breakdown

### 4. Database Schema

#### Supabase `usage` Table
```sql
CREATE TABLE public.usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chat_id TEXT,
  message_id TEXT,
  provider TEXT,
  model_id TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
- `usage_user_id_idx` on `user_id`
- `usage_created_at_idx` on `created_at DESC`

**RLS Policies:**
- `usage_select_own`: Users can only read their own usage records
- `usage_insert_own`: Users can only insert their own usage records

## Files Modified

### Core Logic
- **app/components/chat/Chat.client.tsx**
  - Added usage tracking effect that monitors messages
  - Extracts usage metadata from assistant messages
  - Implements model-change reset behavior
  - Implements optional Supabase sync

### State Management
- **app/lib/stores/settings.ts**
  - Added `resetUsageOnModelChange?: boolean`
  - Added `syncUsageToSupabase?: boolean`

### Settings UI
- **app/components/settings/useSettingsManager.ts**
  - Updated validation schema for new preferences

- **app/components/settings/tabs/UsageTab.tsx**
  - Complete rewrite to accept props
  - Added toggle switches for new preferences
  - Disabled Supabase sync toggle when not authenticated

- **app/components/settings/SettingsContent.tsx**
  - Updated to pass required props to UsageTab

### Display Components
- **app/components/chat/UsageStats.tsx**
  - Added model badge with `BadgeInfo` icon
  - Shows current `provider:model` next to usage stats

- **app/components/settings/UsageDashboard.tsx**
  - Enhanced to fetch from both IndexedDB and Supabase
  - Merges local and cloud usage records
  - Sorts by newest first

### Database
- **scripts/schema.sql**
  - Added usage table definition for new installations

- **scripts/migrations/2025-10-14-usage.sql**
  - Migration script for existing databases
  - Creates usage table with indexes and RLS policies

### Bug Fixes
- **app/components/projects/ProjectContextBadge.tsx**
  - Fixed lint error: consistent-return in useEffect cleanup

- **app/lib/stores/project.ts**
  - Fixed lint error: removed unused `_error` variable

- **app/components/workbench/FileTree.tsx**
  - Removed unused `RootActions` component and interface

## Setup Instructions

### For New Installations
1. Run `pnpm run setup` - the usage table is included in the main schema
2. Enable the new preferences in Settings → Usage

### For Existing Installations
1. Run the migration in Supabase SQL Editor:
   ```bash
   # Copy migration to clipboard
   cat scripts/migrations/2025-10-14-usage.sql | pbcopy
   
   # Or run directly in Supabase Dashboard → SQL Editor
   ```

2. Enable preferences in Settings → Usage:
   - Toggle "Reset usage on model change" (optional)
   - Toggle "Sync usage to Supabase" (requires authentication)

## Usage Flow

### Without Supabase Sync (Default)
1. User sends a message
2. AI responds with streaming content
3. Usage metadata extracted from response
4. Session totals updated in memory (`$sessionUsage`)
5. Record saved to IndexedDB
6. UI updates to show new totals

### With Supabase Sync (Enabled + Authenticated)
1-5. Same as above
6. Record also synced to Supabase `usage` table
7. UI updates to show new totals
8. Usage Dashboard can now fetch from cloud

### Model Change Reset (When Enabled)
1. User switches model in chat
2. `useEffect` detects model change
3. Session usage counters reset to zero
4. New usage tracking starts for new model

## Testing Checklist

- [ ] Usage stats appear in chat footer after AI response
- [ ] Model badge displays correctly next to usage stats
- [ ] Usage resets when switching chats
- [ ] Usage resets when switching models (if preference enabled)
- [ ] Supabase sync works when authenticated (if preference enabled)
- [ ] Settings toggles work correctly
- [ ] Usage Dashboard displays data from both IndexedDB and Supabase
- [ ] Cloud sync status indicator appears when syncing to Supabase
- [ ] TypeScript compiles without errors (`pnpm run typecheck`)
- [ ] ESLint passes without errors (`pnpm run lint`)

## Technical Notes

### Dual Storage Pattern
- **Primary:** IndexedDB for fast local access and offline support
- **Optional:** Supabase for cloud backup and cross-device sync
- **Sync Strategy:** Write to IndexedDB first, then optionally to Supabase
- **Dashboard:** Merges both sources when available

### Cost Calculation
- Costs calculated server-side in `app/lib/.server/llm/cost-calculator.ts`
- Based on model pricing per 1M tokens
- Included in streaming response metadata

### Security
- RLS policies ensure users only access their own usage data
- Client-side inserts use authenticated Supabase client
- Service role key never exposed to client

## Future Enhancements (Optional)

1. **Usage Limits:** Add per-user or per-model usage limits with warnings
2. **Usage Analytics:** Add charts showing usage trends over time
3. **Export Options:** Add more export formats (JSON, PDF)
4. **Usage Alerts:** Notify users when approaching usage thresholds
5. **Server Endpoint:** Move Supabase inserts to server endpoint for better security
6. **Batch Sync:** Batch multiple usage records for more efficient syncing

