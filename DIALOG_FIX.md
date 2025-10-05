# Dialog Component Fix

## Issue
The EditProjectDialog was trying to import Dialog components that don't exist in the codebase's Dialog component.

### Error:
```
The requested module '/app/components/ui/Dialog.tsx' does not provide an export named 'DialogContent'
```

## Root Cause
The codebase uses a custom Dialog component structure that's different from the standard shadcn/ui Dialog pattern.

### Expected Imports (shadcn/ui standard):
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/Dialog';
```

### Actual Exports (in your codebase):
```tsx
export {
  Dialog,           // The content wrapper
  DialogRoot,       // The root provider
  DialogClose,      // Close button
  DialogTitle,      // Title component
  DialogDescription, // Description component
  DialogButton,     // Button component
}
```

## Solution
Updated `EditProjectDialog.tsx` to use the correct Dialog structure:

### Before:
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    {/* form content */}
    <DialogFooter>
      {/* buttons */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### After:
```tsx
<DialogRoot open={open} onOpenChange={onOpenChange}>
  <Dialog className="w-[95vw] max-w-[500px]">
    <DialogTitle>
      <span>...</span>
    </DialogTitle>
    <DialogDescription>...</DialogDescription>
    {/* form content */}
    <div className="flex gap-2 justify-end">
      <DialogButton type="secondary">Cancel</DialogButton>
      <button type="submit">Save</button>
    </div>
  </Dialog>
</DialogRoot>
```

## Key Differences

1. **DialogRoot** wraps everything (handles open/close state)
2. **Dialog** is the content container (not DialogContent)
3. **DialogTitle** and **DialogDescription** are used directly
4. **DialogButton** is available for styled buttons
5. No **DialogHeader** or **DialogFooter** - use regular divs
6. Close button (X) is automatically added by the Dialog component

## Fixed File
- `app/components/projects/EditProjectDialog.tsx` ✅

## Status
✅ **FIXED** - EditProjectDialog now works with your Dialog component structure.