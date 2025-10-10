# BoltDIY V2.0 - Application Flow & Architecture Reference

> **Comprehensive guide to understanding the application flow, component hierarchy, and where to find everything in the codebase**

## Table of Contents

1. [Application Entry Point & Flow](#1-application-entry-point--flow)
2. [Complete Component Hierarchy](#2-complete-component-hierarchy)
3. [File Location Reference](#3-file-location-reference)
4. [User Journey & Component Interactions](#4-user-journey--component-interactions)
5. [State Management Flow](#5-state-management-flow)
6. [AI Integration Architecture](#6-ai-integration-architecture)
7. [Common Development Tasks](#7-common-development-tasks)
8. [Visual Flow Diagrams](#8-visual-flow-diagrams)

---

## 1. Application Entry Point & Flow

### Root Application Structure

```
app/root.tsx (Root Layout)
    ↓
app/routes/_index.tsx (Main Route)
    ├── Header
    └── Chat (ClientOnly)
        └── BaseChat (Fallback)
```

### Entry Point Details

**File:** `app/root.tsx`
- Sets up global providers: `DirectionProvider`, `AuthProvider`
- Manages theme initialization and dark mode
- Loads global styles: Tailwind CSS, xterm.js, react-toastify
- Applies theme attribute to `<html>` element

**File:** `app/routes/_index.tsx`
- Main route component that renders the application
- Layout: Header (fixed top) + Chat (full height below)
- Uses `ClientOnly` wrapper to prevent SSR issues with browser-only components

---

## 2. Complete Component Hierarchy

### Visual Component Tree

```
App (root.tsx)
└── DirectionProvider
    └── AuthProvider
        └── Outlet (routes)
            └── Index (_index.tsx)
                ├── Header (app/components/header/Header.tsx)
                │   ├── ConnectionStatus (app/components/header/ConnectionStatus.tsx)
                │   ├── ChatDescription (app/lib/persistence/ChatDescription.client.tsx)
                │   ├── ModelBadge (app/components/chat/ModelBadge.tsx)
                │   └── HeaderActionButtons (app/components/header/HeaderActionButtons.client.tsx)
                │       ├── Button (Chat) - Toggle chat visibility
                │       ├── Button (Code) - Toggle workbench visibility
                │       ├── Button (Settings) - Open settings modal
                │       └── SettingsModal (app/components/settings/SettingsModal.tsx)
                │
                └── Chat (app/components/chat/Chat.client.tsx)
                    └── BaseChat (app/components/chat/BaseChat.tsx)
                        ├── Menu (app/components/sidebar/Menu.client.tsx)
                        │   ├── UserPanel (app/components/sidebar/UserPanel.tsx)
                        │   ├── HistoryItem (app/components/sidebar/HistoryItem.tsx)
                        │   └── LoginModal (app/components/auth/LoginModal.tsx)
                        │
                        ├── Welcome Screen (when !chatStarted)
                        │   ├── AnimatedBadge (app/components/ui/AnimatedBadge.tsx)
                        │   ├── GradientText (app/components/ui/GradientText.tsx)
                        │   └── FeatureCard × 3 (app/components/ui/FeatureCard.tsx)
                        │
                        ├── Messages (app/components/chat/Messages.client.tsx)
                        │   ├── UserMessage (app/components/chat/UserMessage.tsx)
                        │   └── AssistantMessage (app/components/chat/AssistantMessage.tsx)
                        │
                        ├── Input Area
                        │   ├── Textarea (message input)
                        │   ├── SendButton (app/components/chat/SendButton.client.tsx)
                        │   ├── IconButton (Enhance Prompt)
                        │   ├── UsageStats (app/components/chat/UsageStats.tsx)
                        │   └── ModelSelector (app/components/chat/ModelSelector.tsx)
                        │
                        └── Workbench (app/components/workbench/Workbench.client.tsx)
                            ├── Slider (Code/Preview toggle)
                            ├── PanelHeaderButton (Toggle Terminal)
                            ├── IconButton (Close Workbench)
                            │
                            ├── View: Code (EditorPanel)
                            │   └── EditorPanel (app/components/workbench/EditorPanel.tsx)
                            │       └── PanelGroup (vertical split)
                            │           ├── Panel: Editor Area
                            │           │   └── PanelGroup (horizontal split)
                            │           │       ├── Panel: File Tree
                            │           │       │   ├── PanelHeader
                            │           │       │   └── FileTree (app/components/workbench/FileTree.tsx)
                            │           │       │       ├── Folder (expandable/collapsible)
                            │           │       │       └── File (selectable, shows unsaved indicator)
                            │           │       │
                            │           │       └── Panel: Code Editor
                            │           │           ├── FileBreadcrumb (app/components/workbench/FileBreadcrumb.tsx)
                            │           │           ├── PanelHeaderButton (Save)
                            │           │           ├── PanelHeaderButton (Reset)
                            │           │           └── CodeMirrorEditor (app/components/editor/codemirror/CodeMirrorEditor.tsx)
                            │           │
                            │           └── Panel: Terminal (collapsible)
                            │               ├── Terminal Tabs (up to 3 terminals)
                            │               ├── IconButton (Add Terminal)
                            │               ├── IconButton (Close Terminal)
                            │               └── Terminal × N (app/components/workbench/terminal/Terminal.tsx)
                            │
                            └── View: Preview
                                └── Preview (app/components/workbench/Preview.tsx)
                                    ├── IconButton (Reload)
                                    ├── Input (URL bar)
                                    ├── PortDropdown (app/components/workbench/PortDropdown.tsx)
                                    └── iframe (preview content)
```

---

## 3. File Location Reference

### Quick Lookup Table

| Component/Feature | File Path | Description |
|-------------------|-----------|-------------|
| **Entry Points** |
| Root Layout | `app/root.tsx` | App wrapper, global providers, theme setup |
| Main Route | `app/routes/_index.tsx` | Homepage with Header + Chat |
| Chat API | `app/routes/api.chat.ts` | AI streaming endpoint |
| **Main Components** |
| Header | `app/components/header/Header.tsx` | Top navigation bar |
| Header Actions | `app/components/header/HeaderActionButtons.client.tsx` | Chat/Code/Settings buttons |
| Chat Container | `app/components/chat/Chat.client.tsx` | Main chat logic with useChat hook |
| Base Chat UI | `app/components/chat/BaseChat.tsx` | Chat UI layout and structure |
| Messages | `app/components/chat/Messages.client.tsx` | Message list renderer |
| Model Selector | `app/components/chat/ModelSelector.tsx` | AI model dropdown |
| Usage Stats | `app/components/chat/UsageStats.tsx` | Token usage display |
| **Sidebar** |
| Menu | `app/components/sidebar/Menu.client.tsx` | Slide-out sidebar with history |
| History Item | `app/components/sidebar/HistoryItem.tsx` | Individual chat item |
| User Panel | `app/components/sidebar/UserPanel.tsx` | User auth/profile section |
| **Workbench** |
| Workbench Container | `app/components/workbench/Workbench.client.tsx` | Main IDE container |
| Editor Panel | `app/components/workbench/EditorPanel.tsx` | File tree + editor + terminal |
| File Tree | `app/components/workbench/FileTree.tsx` | File/folder browser |
| Preview | `app/components/workbench/Preview.tsx` | iframe preview with URL bar |
| Terminal | `app/components/workbench/terminal/Terminal.tsx` | xterm.js terminal |
| **Editor** |
| CodeMirror | `app/components/editor/codemirror/CodeMirrorEditor.tsx` | Code editor component |
| **Authentication** |
| Auth Context | `app/lib/contexts/AuthContext.tsx` | React context for user session |
| Login Modal | `app/components/auth/LoginModal.tsx` | Sign in/up modal |
| **State Management** |
| Workbench Store | `app/lib/stores/workbench.ts` | WebContainer, files, editor state |
| Chat Store | `app/lib/stores/chat.ts` | Chat visibility, started state |
| Files Store | `app/lib/stores/files.ts` | File system state |
| Model Store | `app/lib/stores/model.ts` | AI model selection |
| Settings Store | `app/lib/stores/settings.ts` | User preferences |
| Theme Store | `app/lib/stores/theme.ts` | Dark/light mode |
| Terminal Store | `app/lib/stores/terminal.ts` | Terminal state |
| Connection Store | `app/lib/stores/connection.ts` | Supabase connection status |
| **AI Integration** |
| Prompts | `app/lib/.server/llm/prompts.ts` | System prompts, AI instructions |
| Model Config | `app/lib/.server/llm/model-config.ts` | All 19+ model configurations |
| Provider Factory | `app/lib/.server/llm/provider-factory.ts` | Multi-provider routing |
| Stream Text | `app/lib/.server/llm/stream-text.ts` | Streaming handler |
| Anthropic Provider | `app/lib/.server/llm/providers/anthropic.ts` | Claude models |
| OpenAI Provider | `app/lib/.server/llm/providers/openai.ts` | GPT models |
| Google Provider | `app/lib/.server/llm/providers/google.ts` | Gemini models |
| DeepSeek Provider | `app/lib/.server/llm/providers/deepseek.ts` | DeepSeek models |
| xAI Provider | `app/lib/.server/llm/providers/xai.ts` | Grok models |
| Mistral Provider | `app/lib/.server/llm/providers/mistral.ts` | Mistral models |
| **Runtime** |
| Action Runner | `app/lib/runtime/action-runner.ts` | Executes AI-generated actions |
| Message Parser | `app/lib/runtime/message-parser.ts` | Extracts actions from AI responses |
| **WebContainer** |
| WebContainer API | `app/lib/webcontainer/index.ts` | Browser-based Node.js environment |
| **Persistence** |
| IndexedDB | `app/lib/persistence/db.ts` | Local database layer |
| Chat History | `app/lib/persistence/useChatHistory.tsx` | Chat persistence hook |
| **Supabase** |
| Client | `app/lib/supabase/client.ts` | Browser Supabase client |
| Server | `app/lib/supabase/server.ts` | SSR-safe Supabase client |
| Types | `app/lib/supabase/types.ts` | TypeScript types |

---

## 4. User Journey & Component Interactions

### Step-by-Step Flow

#### 1. **Application Loads**

```
User visits app
    ↓
app/root.tsx renders
    ↓
AuthProvider initializes (checks for existing session)
    ↓
app/routes/_index.tsx renders
    ↓
Header appears (shows ConnectionStatus, ModelBadge)
    ↓
Chat.client.tsx loads
    ↓
useChatHistory() hook:
    - Opens IndexedDB
    - Loads initial messages from database
    - If user is authenticated, syncs with Supabase
    ↓
BaseChat renders with welcome screen (!chatStarted)
```

**Files Involved:**
- `app/root.tsx:78-85` - App component
- `app/lib/contexts/AuthContext.tsx` - Auth initialization
- `app/routes/_index.tsx:19-26` - Index route
- `app/components/header/Header.tsx:11-50` - Header
- `app/components/chat/Chat.client.tsx:24-61` - Chat wrapper
- `app/lib/persistence/useChatHistory.tsx` - Load messages

#### 2. **User Hovers on Left Edge**

```
Mouse moves to x < 40px
    ↓
Menu.client.tsx onMouseMove event (line 279)
    ↓
setOpen(true)
    ↓
Framer Motion animates menu from left: -150px to left: 0
    ↓
Menu slides in showing:
    - User panel (sign in/out, avatar)
    - New chat button
    - My Projects button (if authenticated)
    - Chat history list
```

**Files Involved:**
- `app/components/sidebar/Menu.client.tsx:279-294` - Mouse detection
- `app/components/sidebar/Menu.client.tsx:298-304` - Motion animation
- `app/components/sidebar/UserPanel.tsx` - User section
- `app/components/sidebar/HistoryItem.tsx` - Chat items

#### 3. **User Types Message & Sends**

```
User types in textarea
    ↓
BaseChat.tsx textarea onChange (line 175)
    ↓
handleInputChange updates input state
    ↓
User presses Enter (without Shift)
    ↓
BaseChat.tsx onKeyDown (line 163-172)
    ↓
sendMessage?.(event) called
    ↓
Chat.client.tsx sendMessageHandler (line 197)
    ↓
Sequence:
    1. workbenchStore.saveAllFiles() - Save any unsaved editor changes
    2. workbenchStore.getFileModifications() - Get file diffs
    3. runAnimation() - Fade out welcome screen
    4. useChat().sendMessage() - Send to API
    5. setChatStarted(true) - Show messages area
    ↓
API Request to app/routes/api.chat.ts
```

**Files Involved:**
- `app/components/chat/BaseChat.tsx:163-172` - Enter key handler
- `app/components/chat/Chat.client.tsx:197-236` - Send logic
- `app/routes/api.chat.ts:8-145` - API endpoint

#### 4. **AI Processes Request & Streams Response**

```
app/routes/api.chat.ts receives request
    ↓
Extract messages, model selection from body
    ↓
Call streamText() with messages and model
    ↓
app/lib/.server/llm/stream-text.ts
    ↓
providerFactory.createProvider(modelId)
    ↓
Provider-specific implementation (e.g., anthropic.ts)
    ↓
Vercel AI SDK streams response
    ↓
Server-Sent Events (SSE) stream to client
    ↓
Chat.client.tsx useChat hook receives chunks
    ↓
messages state updates in real-time
    ↓
BaseChat → Messages.client → AssistantMessage renders streaming text
```

**Files Involved:**
- `app/routes/api.chat.ts:26-145` - Chat action
- `app/lib/.server/llm/stream-text.ts` - Streaming logic
- `app/lib/.server/llm/provider-factory.ts` - Provider selection
- `app/lib/.server/llm/providers/anthropic.ts` (or other provider)
- `app/components/chat/Chat.client.tsx:80-85` - useChat hook
- `app/components/chat/Messages.client.tsx` - Message rendering

#### 5. **AI Response Contains Actions**

```
AI response includes artifacts with shell commands and file operations
    ↓
Chat.client.tsx useEffect watches messages (line 103)
    ↓
parseMessages(messages, isLoading) called
    ↓
app/lib/runtime/message-parser.ts extracts actions
    ↓
ActionCallbacks fired for each action
    ↓
ActionRunner.addAction() queues action
    ↓
ActionRunner.runAction() executes:
    - File actions: Write to WebContainer filesystem
    - Shell actions: Spawn process in WebContainer
    ↓
WebContainer executes actions in browser
    ↓
Files appear in workbenchStore.files
    ↓
FileTree updates automatically
```

**Files Involved:**
- `app/components/chat/Chat.client.tsx:103-105` - Message parsing trigger
- `app/lib/hooks/useMessageParser.ts` - Parse messages hook
- `app/lib/runtime/message-parser.ts` - Extract actions
- `app/lib/runtime/action-runner.ts:66-127` - Queue actions
- `app/lib/runtime/action-runner.ts:136-183` - Execute actions
- `app/lib/webcontainer/index.ts` - WebContainer API

#### 6. **Workbench Opens Automatically**

```
Files written to WebContainer
    ↓
workbenchStore.files updates
    ↓
Workbench.client.tsx useEffect (line 97-99)
    ↓
workbenchStore.setDocuments(files)
    ↓
If preview detected:
    workbenchStore.currentView.set('preview')
    ↓
Workbench motion.div animates open
    ↓
Shows either:
    - EditorPanel (code view): FileTree + Editor + Terminal
    - Preview (preview view): iframe with dev server
```

**Files Involved:**
- `app/components/workbench/Workbench.client.tsx:91-99` - Auto-open logic
- `app/components/workbench/Workbench.client.tsx:133-138` - Animation
- `app/lib/stores/workbench.ts` - Workbench state

#### 7. **User Toggles Between Chat and Code**

```
User clicks "Code" button in Header
    ↓
HeaderActionButtons.client.tsx onClick (line 36-42)
    ↓
workbenchStore.showWorkbench.set(!showWorkbench)
    ↓
If workbench opening and chat hidden:
    chatStore.setKey('showChat', true)
    ↓
Workbench.client.tsx motion.div reacts to showWorkbench
    ↓
Animates width from 0 to var(--workbench-width)
    ↓
BaseChat responds to showChat state
    ↓
Layout adjusts to show both or either panel
```

**Files Involved:**
- `app/components/header/HeaderActionButtons.client.tsx:34-46` - Button logic
- `app/lib/stores/workbench.ts` - Workbench visibility
- `app/lib/stores/chat.ts` - Chat visibility
- `app/components/workbench/Workbench.client.tsx:133-138` - Animation

#### 8. **User Edits File in Editor**

```
User clicks file in FileTree
    ↓
FileTree.tsx onClick (line 135-137)
    ↓
onFileSelect?.(fileOrFolder.fullPath)
    ↓
Workbench.client.tsx onFileSelect (line 117-119)
    ↓
workbenchStore.setSelectedFile(filePath)
    ↓
workbenchStore.currentDocument updates
    ↓
EditorPanel receives new editorDocument prop
    ↓
CodeMirrorEditor loads file content
    ↓
User types in editor
    ↓
CodeMirrorEditor onChange (EditorPanel.tsx line 101)
    ↓
workbenchStore.setCurrentDocumentContent(update.content)
    ↓
If autoSave enabled:
    debouncedAutoSave() triggers after delay
    ↓
unsavedFiles Set updated
    ↓
FileTree shows orange dot indicator
```

**Files Involved:**
- `app/components/workbench/FileTree.tsx:130-138` - File selection
- `app/components/workbench/Workbench.client.tsx:117-125` - Save logic
- `app/components/workbench/EditorPanel.tsx:101-111` - Editor change
- `app/lib/stores/workbench.ts` - Document state
- `app/components/editor/codemirror/CodeMirrorEditor.tsx` - Editor

#### 9. **Dev Server Starts in Terminal**

```
AI sends shell action: "npm run dev"
    ↓
ActionRunner executes shell action
    ↓
WebContainer spawns process: jsh -c "npm run dev"
    ↓
ActionRunner detects dev server command (line 354)
    ↓
Monitors output for success patterns (line 388-427)
    ↓
When "Local: http://localhost:3000" appears:
    - Marks action as complete
    - Keeps process running (doesn't kill it)
    ↓
WebContainer exposes preview URL
    ↓
workbenchStore.previews updates
    ↓
Workbench auto-switches to preview view
    ↓
Preview.tsx iframe loads URL
```

**Files Involved:**
- `app/lib/runtime/action-runner.ts:185-255` - Shell execution
- `app/lib/runtime/action-runner.ts:354-383` - Dev server detection
- `app/lib/runtime/action-runner.ts:388-427` - Success patterns
- `app/lib/stores/workbench.ts` - Preview state
- `app/components/workbench/Preview.tsx:8-122` - Preview UI

#### 10. **Messages Persist to Database**

```
Streaming completes (isLoading changes to false)
    ↓
Chat.client.tsx useEffect (line 108-140)
    ↓
Waits 2 seconds for:
    - Actions to parse
    - Files to write
    - State to stabilize
    ↓
storeMessageHistory(messages, modelId) called
    ↓
useChatHistory.tsx storeMessageHistory function
    ↓
Dual storage:
    1. Save to IndexedDB (fast, offline)
    2. If authenticated: Sync to Supabase
    ↓
IndexedDB: setMessages(db, chatId, messages, ...)
    ↓
Supabase: upsert with onConflict: 'url_id,user_id'
    ↓
Success: lastSavedCountRef updated
```

**Files Involved:**
- `app/components/chat/Chat.client.tsx:108-140` - Save trigger
- `app/lib/persistence/useChatHistory.tsx` - Persistence logic
- `app/lib/persistence/db.ts` - IndexedDB operations
- `app/lib/supabase/client.ts` - Supabase client

---

## 5. State Management Flow

### Nanostores Architecture

BoltDIY uses [Nanostores](https://github.com/nanostores/nanostores) for state management - a tiny (less than 1KB) state manager.

#### Core Stores

**1. workbenchStore** (`app/lib/stores/workbench.ts`)
```typescript
// Primary store for IDE functionality
{
  showWorkbench: atom<boolean>,           // Workbench visibility
  currentView: atom<WorkbenchViewType>,   // 'code' | 'preview'
  showTerminal: atom<boolean>,            // Terminal panel visibility
  files: atom<FileMap>,                   // File system state
  selectedFile: atom<string | undefined>, // Active file path
  currentDocument: atom<EditorDocument>,  // Active editor document
  unsavedFiles: atom<Set<string>>,        // Files with unsaved changes
  previews: atom<PreviewInfo[]>,          // Preview URLs and ports
  actions: map<Record<string, ActionState>> // AI actions state
}

// Methods:
- setSelectedFile(path)
- setCurrentDocumentContent(content)
- saveCurrentDocument()
- saveAllFiles()
- attachTerminal(terminal)
- onTerminalResize(cols, rows)
- abortAllActions()
```

**2. chatStore** (`app/lib/stores/chat.ts`)
```typescript
{
  started: boolean,      // Has conversation started?
  aborted: boolean,      // Was streaming aborted?
  showChat: boolean      // Chat panel visibility
}
```

**3. filesStore** (`app/lib/stores/files.ts`)
```typescript
// Manages file system state
{
  files: map<FileMap>  // Path → FileInfo mapping
}

// Watches WebContainer for changes
// Updates automatically when files change
```

**4. currentModel** (`app/lib/stores/model.ts`)
```typescript
{
  providerId: string,    // 'anthropic', 'openai', etc.
  modelId: string,       // 'claude-sonnet-4.5', etc.
  fullId: string         // 'anthropic/claude-sonnet-4.5'
}

// Persists to localStorage
// Used by API to select AI provider
```

**5. settingsStore** (`app/lib/stores/settings.ts`)
```typescript
{
  preferences: {
    autoSave: boolean,
    autoSaveDelay: number
  },
  editor: {
    fontSize: number,
    tabSize: number,
    lineHeight: number,
    wordWrap: boolean,
    minimap: boolean,
    lineNumbers: boolean
  }
}
```

**6. themeStore** (`app/lib/stores/theme.ts`)
```typescript
atom<'light' | 'dark' | 'lightning'>

// Syncs with localStorage
// Updates <html data-theme> attribute
```

### State Flow Diagram

```
User Action
    ↓
Component Event Handler
    ↓
Store Method Called
    ↓
Store Updates (atom.set() or map.setKey())
    ↓
useStore() hooks react
    ↓
Components Re-render
    ↓
UI Updates
```

### Example: File Selection Flow

```typescript
// 1. User clicks file in FileTree
<File onClick={() => onFileSelect?.(filePath)} />

// 2. Event bubbles to Workbench
const onFileSelect = useCallback((filePath: string | undefined) => {
  workbenchStore.setSelectedFile(filePath);
}, []);

// 3. Store updates
export function setSelectedFile(filePath: string | undefined) {
  selectedFile.set(filePath);
  // Compute currentDocument from selectedFile
  // ...
}

// 4. Components observe store
const selectedFile = useStore(workbenchStore.selectedFile);
const currentDocument = useStore(workbenchStore.currentDocument);

// 5. Editor receives new document
<CodeMirrorEditor doc={currentDocument} />
```

---

## 6. AI Integration Architecture

### Message → Action → Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                   │
├─────────────────────────────────────────────────────────────────┤
│ User types: "Create a React app with Vite"                     │
│                                                                 │
│ Component: BaseChat.tsx → Chat.client.tsx                      │
│ Handler: sendMessageHandler()                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API REQUEST                                                  │
├─────────────────────────────────────────────────────────────────┤
│ POST /api/chat                                                  │
│ Body: {                                                         │
│   messages: [...],                                              │
│   model: "anthropic/claude-sonnet-4.5"                          │
│ }                                                               │
│                                                                 │
│ File: app/routes/api.chat.ts                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PROVIDER ROUTING                                             │
├─────────────────────────────────────────────────────────────────┤
│ streamText() → providerFactory.createProvider(modelId)         │
│                                                                 │
│ Routes to appropriate provider:                                │
│ - anthropic.ts (Claude)                                         │
│ - openai.ts (GPT)                                               │
│ - google.ts (Gemini)                                            │
│ - etc.                                                          │
│                                                                 │
│ File: app/lib/.server/llm/provider-factory.ts                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. AI PROCESSING                                                │
├─────────────────────────────────────────────────────────────────┤
│ Provider SDK (e.g., @anthropic-ai/sdk)                          │
│ + System Prompt (app/lib/.server/llm/prompts.ts)               │
│ + User Messages                                                 │
│                                                                 │
│ → AI generates response with artifacts:                        │
│                                                                 │
│ <boltArtifact title="package.json">                             │
│ <boltAction type="file" filePath="package.json">                │
│ {                                                               │
│   "name": "vite-react-app",                                     │
│   "scripts": { "dev": "vite" }                                  │
│ }                                                               │
│ </boltAction>                                                   │
│ </boltArtifact>                                                 │
│                                                                 │
│ <boltAction type="shell">                                       │
│ npm install                                                     │
│ </boltAction>                                                   │
│                                                                 │
│ <boltAction type="shell">                                       │
│ npm run dev                                                     │
│ </boltAction>                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. STREAMING RESPONSE                                           │
├─────────────────────────────────────────────────────────────────┤
│ Server-Sent Events (SSE) stream chunks to client               │
│                                                                 │
│ useChat() hook receives and concatenates chunks                │
│                                                                 │
│ File: app/components/chat/Chat.client.tsx                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. MESSAGE PARSING                                              │
├─────────────────────────────────────────────────────────────────┤
│ useMessageParser() hook parses response                         │
│                                                                 │
│ Extracts:                                                       │
│ - File actions: { type: 'file', filePath, content }            │
│ - Shell actions: { type: 'shell', content }                    │
│                                                                 │
│ File: app/lib/runtime/message-parser.ts                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. ACTION QUEUEING                                              │
├─────────────────────────────────────────────────────────────────┤
│ ActionRunner.addAction(actionData)                              │
│                                                                 │
│ Deduplication logic:                                            │
│ - Same file path? → Update content (last write wins)           │
│ - Same shell command? → Skip duplicate                          │
│ - Dev server command? → Mark as global, prevent duplicates     │
│                                                                 │
│ File: app/lib/runtime/action-runner.ts:66-127                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. ACTION EXECUTION                                             │
├─────────────────────────────────────────────────────────────────┤
│ ActionRunner.runAction(actionData)                              │
│                                                                 │
│ For file actions:                                               │
│   webcontainer.fs.writeFile(path, content)                     │
│   → File appears in WebContainer filesystem                    │
│                                                                 │
│ For shell actions:                                              │
│   webcontainer.spawn('jsh', ['-c', command])                   │
│   → Command executes in terminal                               │
│   → Output streams to terminal UI                              │
│                                                                 │
│ File: app/lib/runtime/action-runner.ts:136-255                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. WEBCONTAINER EXECUTION                                       │
├─────────────────────────────────────────────────────────────────┤
│ Browser-based Node.js environment                               │
│                                                                 │
│ npm install → Downloads packages in browser                    │
│ npm run dev → Starts Vite dev server in browser                │
│                                                                 │
│ Dev server exposes preview URL                                  │
│                                                                 │
│ File: app/lib/webcontainer/index.ts                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. UI UPDATES                                                  │
├─────────────────────────────────────────────────────────────────┤
│ workbenchStore.files updates                                    │
│   → FileTree shows new files                                   │
│                                                                 │
│ workbenchStore.previews updates                                 │
│   → Workbench switches to preview view                         │
│   → Preview iframe loads http://localhost:3000                 │
│                                                                 │
│ Terminal shows command output                                   │
│                                                                 │
│ User sees: Working React app in preview!                       │
└─────────────────────────────────────────────────────────────────┘
```

### AI Provider System

**Provider Factory Pattern** (`app/lib/.server/llm/provider-factory.ts`)

```typescript
interface AIProvider {
  createProvider(modelId: string): LanguageModel;
  usageMetadata(result: StreamTextResult): UsageMetadata;
}

// Example: Anthropic Provider
class AnthropicProvider implements AIProvider {
  createProvider(modelId: string) {
    const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return anthropic(modelId); // e.g., 'claude-sonnet-4.5'
  }
}

// Routing
function createProvider(fullModelId: string): AIProvider {
  const [providerId, modelId] = fullModelId.split('/');

  switch (providerId) {
    case 'anthropic': return new AnthropicProvider();
    case 'openai': return new OpenAIProvider();
    case 'google': return new GoogleProvider();
    // ... etc
  }
}
```

**Model Configuration** (`app/lib/.server/llm/model-config.ts`)

```typescript
export const MODEL_LIST: ModelInfo[] = [
  {
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    maxTokens: 8192,
    capabilities: ['coding', 'fast', 'smart'],
    providerId: 'anthropic',
    modelId: 'claude-sonnet-4-5-20250929'
  },
  // ... 18 more models
];

// Used by:
// - ModelSelector to show available models
// - Provider factory to route requests
// - Settings to display model info
```

---

## 7. Common Development Tasks

### Where to Look for Typical Changes

#### Task: Add a New AI Model

**Files to Modify:**

1. **`app/lib/.server/llm/model-config.ts`**
   ```typescript
   // Add to MODEL_LIST array
   {
     name: 'New Model Name',
     provider: 'ProviderName',
     maxTokens: 8192,
     providerId: 'provider-id',
     modelId: 'model-id-from-api'
   }
   ```

2. **`app/lib/.server/llm/providers/new-provider.ts`** (if new provider)
   ```typescript
   export class NewProvider implements AIProvider {
     createProvider(modelId: string) {
       const client = createClient({ apiKey: env.NEW_API_KEY });
       return client(modelId);
     }
   }
   ```

3. **`app/lib/.server/llm/provider-factory.ts`**
   ```typescript
   case 'new-provider': return new NewProvider();
   ```

4. **`.env.local`**
   ```bash
   NEW_API_KEY=your-api-key
   ```

#### Task: Modify AI System Prompt

**Files to Modify:**

1. **`app/lib/.server/llm/prompts.ts`**
   ```typescript
   export const SYSTEM_PROMPT = `
   You are BoltDIY, an AI assistant...

   [Modify the prompt here]

   Available shell commands:
   - npm, pnpm, yarn
   - git (NOT available - mention this)
   `;
   ```

This is the ONLY place to change AI behavior instructions.

#### Task: Add New UI Component to Chat

**Files to Modify:**

1. **Create component:** `app/components/chat/NewComponent.tsx`
2. **Import in BaseChat:** `app/components/chat/BaseChat.tsx`
   ```typescript
   import { NewComponent } from './NewComponent';

   // Add to JSX
   <div className="...">
     <NewComponent />
   </div>
   ```

#### Task: Add New Keyboard Shortcut

**Files to Modify:**

1. **`app/lib/hooks/useShortcuts.ts`**
   ```typescript
   useEffect(() => {
     const handler = (e: KeyboardEvent) => {
       if (e.ctrlKey && e.key === 'k') {
         e.preventDefault();
         // Your action
       }
     };

     window.addEventListener('keydown', handler);
     return () => window.removeEventListener('keydown', handler);
   }, []);
   ```

#### Task: Customize Theme Colors

**Files to Modify:**

1. **`app/styles/tailwind.css`**
   ```css
   [data-theme='dark'] {
     --bolt-elements-background-depth-1: #1a1a1a;
     --bolt-elements-textPrimary: #ffffff;
     /* etc */
   }
   ```

2. **`tailwind.config.js`**
   ```javascript
   theme: {
     extend: {
       colors: {
         'custom-primary': 'var(--custom-primary)',
       }
     }
   }
   ```

#### Task: Add New Settings Option

**Files to Modify:**

1. **`app/lib/stores/settings.ts`**
   ```typescript
   export const settingsStore = map<Settings>({
     preferences: {
       newOption: true, // Add here
     }
   });
   ```

2. **`app/components/settings/SettingsModal.tsx`**
   ```tsx
   <Switch
     checked={settings.preferences.newOption}
     onChange={(checked) => {
       settingsStore.setKey('preferences', {
         ...settings.preferences,
         newOption: checked
       });
     }}
   />
   ```

#### Task: Add Authentication Provider (e.g., Google OAuth)

**Files to Modify:**

1. **Supabase Dashboard:**
   - Enable Google provider
   - Configure OAuth credentials

2. **`app/components/auth/LoginModal.tsx`**
   ```typescript
   const signInWithGoogle = async () => {
     const supabase = createClient();
     await supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
         redirectTo: `${window.location.origin}/auth/callback`
       }
     });
   };
   ```

#### Task: Add New File Operation (e.g., Delete File)

**Files to Modify:**

1. **`app/lib/stores/workbench.ts`**
   ```typescript
   export async function deleteFile(filePath: string) {
     const webcontainer = await webcontainerPromise;
     await webcontainer.fs.rm(filePath);

     // Update files store
     files.setKey(filePath, undefined);
   }
   ```

2. **`app/components/workbench/FileTree.tsx`**
   ```tsx
   <ContextMenu>
     <MenuItem onClick={() => workbenchStore.deleteFile(filePath)}>
       Delete
     </MenuItem>
   </ContextMenu>
   ```

#### Task: Customize Terminal Behavior

**Files to Modify:**

1. **`app/components/workbench/terminal/Terminal.tsx`**
   - Modify xterm.js configuration
   - Add custom terminal commands
   - Change terminal styling

2. **`app/lib/stores/terminal.ts`**
   - Add terminal-specific state
   - Terminal history management

---

## 8. Visual Flow Diagrams

### Data Flow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐   ┌──────────┐   ┌─────────────────────────────┐   │
│  │  Header   │   │   Chat   │   │       Workbench             │   │
│  │           │   │          │   │  ┌──────────┐  ┌──────────┐ │   │
│  │ - Model   │   │ - Input  │   │  │FileTree  │  │ Editor   │ │   │
│  │ - Status  │   │ - Msgs   │   │  │          │  │          │ │   │
│  │ - Actions │   │ - Send   │   │  └──────────┘  └──────────┘ │   │
│  └───────────┘   └──────────┘   │  ┌────────────────────────┐ │   │
│                                  │  │      Terminal          │ │   │
│                                  │  └────────────────────────┘ │   │
│                                  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT (Nanostores)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  chatStore          workbenchStore         filesStore              │
│  - started          - showWorkbench        - files map             │
│  - showChat         - currentView          - watchers              │
│  - aborted          - files                                        │
│                     - selectedFile         settingsStore           │
│  currentModel       - currentDocument      - preferences           │
│  - providerId       - unsavedFiles         - editor config         │
│  - modelId          - previews                                     │
│  - fullId           - terminal             themeStore              │
│                                            - theme mode             │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Message Parser  │  │  Action Runner   │  │   Persistence   │  │
│  │                  │  │                  │  │                 │  │
│  │ - Extract actions│  │ - Queue actions  │  │ - IndexedDB     │  │
│  │ - Parse markdown │  │ - Deduplicate    │  │ - Supabase sync │  │
│  │ - Fire callbacks │  │ - Execute        │  │ - Chat history  │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                         RUNTIME LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │               WebContainer (Browser Node.js)               │   │
│  │                                                            │   │
│  │  - Virtual filesystem (/home/project)                     │   │
│  │  - Package manager (npm/pnpm/yarn)                        │   │
│  │  - Shell (jsh - limited zsh emulation)                    │   │
│  │  - Dev servers (Vite, Next.js, etc.)                      │   │
│  │  - Terminal integration (xterm.js)                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│  │  AI APIs     │   │  Supabase    │   │  Browser APIs         │  │
│  │              │   │              │   │                       │  │
│  │ - Anthropic  │   │ - Auth       │   │ - IndexedDB           │  │
│  │ - OpenAI     │   │ - PostgreSQL │   │ - LocalStorage        │  │
│  │ - Google     │   │ - Realtime   │   │ - File System Access  │  │
│  │ - DeepSeek   │   │ - Storage    │   │ - Clipboard           │  │
│  │ - xAI        │   │              │   │                       │  │
│  │ - Mistral    │   │              │   │                       │  │
│  └──────────────┘   └──────────────┘   └───────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### File Operation Flow

```
AI generates file action
        ↓
message-parser.ts extracts action
        ↓
ActionRunner.addAction()
        ↓
Deduplication check
        ↓
ActionRunner.runAction()
        ↓
webcontainer.fs.writeFile()
        ↓
WebContainer file watcher fires
        ↓
filesStore updates
        ↓
FileTree re-renders
        ↓
File appears in UI
```

### Authentication Flow

```
User clicks "Sign In"
        ↓
LoginModal opens
        ↓
User enters credentials
        ↓
supabase.auth.signInWithPassword()
        ↓
JWT token received
        ↓
Session stored in localStorage
        ↓
AuthContext updates user state
        ↓
Components react to user !== null
        ↓
Menu shows user profile
        ↓
Chat history syncs from Supabase
        ↓
IndexedDB populated with remote chats
```

### Preview Generation Flow

```
AI writes package.json + src files
        ↓
AI runs "npm install"
        ↓
Packages download in WebContainer
        ↓
AI runs "npm run dev"
        ↓
Dev server starts (Vite/Next/etc)
        ↓
WebContainer exposes localhost URL
        ↓
workbenchStore.previews updates
        ↓
Workbench.client.tsx detects preview
        ↓
currentView.set('preview')
        ↓
Preview.tsx receives URL
        ↓
iframe src set to preview URL
        ↓
User sees running application
```

---

## Quick Reference: Key Keyboard Shortcuts

| Shortcut | Action | File |
|----------|--------|------|
| `Ctrl+K` | Focus chat input | `useShortcuts.ts` |
| `Ctrl+Shift+O` | Toggle workbench | `useShortcuts.ts` |
| `Ctrl+\`` | Toggle terminal | `useShortcuts.ts` |
| `Ctrl+S` | Save current file | `CodeMirrorEditor.tsx` |
| `Enter` | Send message | `BaseChat.tsx:164` |
| `Shift+Enter` | New line in input | `BaseChat.tsx:165` |

---

## Debugging Tips

### Enable Debug Logging

**File:** `.env.local`
```bash
VITE_LOG_LEVEL=debug
```

**Console logs show:**
- File operations: `[FileTree]`, `[Files]`
- Actions: `[ActionRunner]`
- WebContainer: `[WebContainer]`
- Chat: `[Chat]`

### Inspect Stores

**Browser Console:**
```javascript
// Access stores via window (for debugging)
import { workbenchStore } from '~/lib/stores/workbench';
console.log(workbenchStore.files.get());
console.log(workbenchStore.selectedFile.get());
```

### Common Issues

**Issue: Chat not saving**
- Check: `useChatHistory.tsx` console logs
- Verify: IndexedDB in DevTools → Application → IndexedDB
- Check: Supabase connection status in header

**Issue: Files not appearing in FileTree**
- Check: `workbenchStore.files` in console
- Verify: WebContainer file watcher is running
- Check: File path format (should start with `/home/project/`)

**Issue: Preview not loading**
- Check: `workbenchStore.previews` array
- Verify: Dev server started successfully in terminal
- Check: WebContainer port mapping

**Issue: Actions not executing**
- Check: ActionRunner logs
- Verify: Actions array in `workbenchStore.actions`
- Check: WebContainer initialization

---

## Conclusion

This document provides a comprehensive map of the BoltDIY V2.0 architecture. Use it as a reference when:

- **Adding features** → Check component hierarchy and state flow
- **Debugging issues** → Trace through the user journey section
- **Modifying AI behavior** → Follow AI integration architecture
- **Understanding data flow** → Review state management and visual diagrams

**Keep this document updated** as the codebase evolves!

---

**Last Updated:** 2025-10-10
**Version:** BoltDIY V2.0
**Maintainers:** Development Team
