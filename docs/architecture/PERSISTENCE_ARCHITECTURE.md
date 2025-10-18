# Persistence Architecture

## Overview
This document explains how bolt.diy handles data persistence for both guest and authenticated users.

## Key Principles

### 1. Workspace Persistence (DISABLED BY DEFAULT)
- **Location**: `app/lib/persistence/db.ts` → `workspace_state` store in IndexedDB
- **Status**: **DISABLED** (opt-in via `VITE_ENABLE_WORKSPACE_PERSISTENCE=true`)
- **Why Disabled**: Causes file pollution across different projects/chats
  - Single global snapshot not scoped per-project or per-chat
  - Switching between projects accumulates files from both
  - Redundant with chat history's per-conversation file states

### 2. Chat History Persistence (ENABLED)
- **Location**: `app/lib/persistence/useChatHistory.ts`
- **Status**: **ALWAYS ENABLED**
- **Scope**: Per-conversation file snapshots

#### Guest Mode (No Authentication)
```
┌─────────────┐
│   Browser   │
│  IndexedDB  │──► Local storage only
│  (chats)    │    - Chat messages
│             │    - File states per chat
└─────────────┘    - Terminal/editor state
```

#### User Mode (Authenticated via Supabase)
```
┌─────────────┐     ┌──────────────┐
│   Browser   │────►│   Supabase   │
│  IndexedDB  │     │  (chats)     │
│  (cache)    │◄────│              │
└─────────────┘     └──────────────┘
     │                      │
     └──────────────────────┘
       Both updated on save
       IndexedDB = fallback/offline
       Supabase = cloud sync
```

## File Restoration Flow

### Previous Problematic Flow (Workspace Enabled)
1. Page loads → Workspace restore dumps ALL historical files into WebContainer
2. Chat history loads → Tries to restore chat-specific files
3. **Result**: Mixed files from multiple projects/chats

### Current Fixed Flow (Workspace Disabled)
1. Page loads → Workspace restore **skipped** (disabled by default)
2. Chat history loads → Restores only files from that specific conversation
3. **Result**: Clean project separation

## Implementation Details

### Files Modified

#### 1. `app/lib/persistence/db.ts`
```typescript
// DISABLED by default - requires explicit opt-in
export const workspacePersistenceEnabled = 
  import.meta.env.VITE_ENABLE_WORKSPACE_PERSISTENCE === 'true';

// Auto-clear when empty
export async function saveWorkspaceState(files: FileMap) {
  if (sanitizedEntries.length === 0) {
    await clearWorkspaceState();
    return;
  }
  // ... save logic
}

// New helper to manually clear
export async function clearWorkspaceState(): Promise<void>
```

#### 2. `app/lib/stores/workbench.ts`
```typescript
async #restoreWorkspaceState() {
  // Check if disabled OR new chat flag set
  const skipRestore =
    !workspacePersistenceEnabled || 
    sessionStorage.getItem('bolt:startNewChat') === 'true';
  
  if (!skipRestore) {
    // Only restore if explicitly enabled
  }
}
```

#### 3. `app/components/sidebar/Menu.client.tsx`
```typescript
// "Start new chat" button sets flag before navigation
onClick={() => {
  sessionStorage.setItem('bolt:startNewChat', 'true');
  window.location.href = '/';
}}
```

#### 4. `app/lib/persistence/useChatHistory.ts`
- Always saves to IndexedDB (lines 1075-1090)
- Additionally syncs to Supabase if user logged in (lines 1092+)
- Restores files from chat history per-conversation (lines 227-307)

## Storage Locations

### IndexedDB (`boltHistory` database)
- **chats**: Chat messages + file states + metadata
- **workspace_state**: Global workspace snapshot (UNUSED when disabled)
- **usage**: Token usage tracking
- **app_settings**: Guest user settings

### Supabase (Authenticated Users Only)
- **chats**: Synced chat messages + file states + metadata
- **projects**: Project metadata and grouping
- **usage**: Token usage (when `syncUsageToSupabase` enabled)

## Recommendations

### For Guests
- ✅ All data stays in IndexedDB (local browser storage)
- ✅ Clear IndexedDB to reset completely
- ⚠️ Data lost if browser storage cleared or different device used

### For Authenticated Users
- ✅ Data synced to Supabase (cloud)
- ✅ IndexedDB acts as cache/offline fallback
- ✅ Accessible across devices
- ✅ Projects help organize related chats

### Workspace Persistence
- ❌ **Keep disabled** unless you need instant recovery from page refresh
- ❌ Causes file pollution when switching projects/chats
- ✅ Chat history already provides per-conversation file restoration

## Troubleshooting

### Issue: Mixed files from different projects appear in file tree
**Solution**: Workspace persistence was enabled. Now disabled by default.

### Issue: Files not persisting between sessions (guest mode)
**Check**: IndexedDB not cleared, `VITE_DISABLE_PERSISTENCE` not set to true

### Issue: Files not syncing across devices (user mode)
**Check**: Supabase configured correctly, user authenticated, network connection

### Manually Clear Stale Workspace State
```javascript
// Run in browser console
(async () => {
  const db = await new Promise(r => {
    const req = indexedDB.open('boltHistory');
    req.onsuccess = () => r(req.result);
  });
  const tx = db.transaction('workspace_state', 'readwrite');
  await tx.objectStore('workspace_state').delete('default');
})();
```

## Future Improvements

1. **Per-Project Workspace**: Scope workspace snapshots to project IDs
2. **Smart Workspace Sync**: Only restore workspace if matches current project
3. **Workspace TTL**: Auto-expire old workspace snapshots
4. **Guest → User Migration**: Tool to migrate IndexedDB data to Supabase on signup
