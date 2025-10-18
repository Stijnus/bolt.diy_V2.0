# Manual File Persistence Fix

## Problem
Manually added files and folders through the UI (using "New File" and "New Folder" buttons) were not persisting across page reloads. This happened because:

1. **Files were created in WebContainer** ✅ - Files were properly created in the WebContainer file system
2. **Files were added to FilesStore** ✅ - Files were added to the in-memory FilesStore 
3. **Files triggered workspace persistence** ✅ - Files triggered workspace persistence (but this is disabled by default)
4. **Files were NOT saved to chat history** ❌ - **This was the missing piece!**
5. **Folders were NOT saved to chat history** ❌ - **Folders were completely ignored!**

The issue was that manually added files only triggered workspace persistence (which is disabled by default), but they didn't trigger the chat history persistence that actually saves files across page reloads. Additionally, the chat history persistence logic only saved files with content, completely ignoring folders.

## Solution

### 1. Custom Event System
Added custom events that are emitted when files are manually created:

**In `app/lib/stores/workbench.ts`:**
- `createFile()` and `createFolder()` methods now emit `bolt:file-manually-added` events
- Added `triggerFilePersistence()` method that emits `bolt:trigger-file-persistence` event

### 2. File Watcher in Chat History
**In `app/lib/persistence/useChatHistory.ts`:**
- Added file watcher that listens for file changes in the workbench store
- Added event listeners for custom events (`bolt:file-manually-added` and `bolt:trigger-file-persistence`)
- Triggers chat history persistence when files are manually added
- Uses debouncing to batch multiple file changes

### 3. Folder Persistence Support
**In `app/lib/persistence/useChatHistory.ts`:**
- **Fixed file state persistence**: Now saves both files AND folders to chat history
- **Fixed file state restoration**: Now properly restores both files AND folders from chat history
- **Folder detection**: Folders are identified by empty content and non-binary type
- **Folder storage**: Folders are saved with empty content to preserve structure

### 4. Multiple Persistence Triggers
The solution provides multiple ways to trigger persistence:

1. **File Store Subscription**: Watches for changes in the workbench files store
2. **Custom Events**: Direct events when files are created through UI
3. **Manual Trigger**: `workbenchStore.triggerFilePersistence()` method for manual triggering

## Implementation Details

### Event Flow
```
User clicks "New File" → 
EditorPanel.handleCreateConfirm() → 
workbenchStore.createFile() → 
Custom event emitted → 
useChatHistory listener → 
storeMessageHistory() → 
Files saved to IndexedDB/Supabase
```

### Logging
Added comprehensive logging with `[FilePersistence]` prefix to help debug:
- When files are manually added
- When persistence is triggered
- Success/failure of persistence operations

### Debouncing
- File store changes: 2 second delay to batch changes
- Manual file additions: 500ms delay for immediate response
- General triggers: 500ms delay

## Testing
To test the fix:

1. Open the workbench
2. Create a new file using the "New File" button
3. Add some content to the file
4. Create a new folder using the "New Folder" button
5. Reload the page
6. Both the file AND folder should still be there

## Files Modified
- `app/lib/stores/workbench.ts` - Added custom events and trigger method
- `app/lib/persistence/useChatHistory.ts` - Added file watcher and event listeners

## Backward Compatibility
This fix is fully backward compatible and doesn't affect existing functionality. It only adds persistence for manually added files without changing the existing chat history persistence system.
