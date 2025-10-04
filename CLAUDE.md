# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm install` - Install dependencies (requires pnpm v9.4.0, Node.js >=18.18.0)
- `pnpm run dev` - Start Remix Vite development server
- `pnpm run build` - Build for production
- `pnpm run start` - Run production build locally with Wrangler Pages (uses bindings.sh)
- `pnpm run preview` - Build and run production preview locally
- `pnpm run deploy` - Build and deploy to Cloudflare Pages

### Testing & Code Quality
- `pnpm test` - Run Vitest test suite once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run lint` - Run ESLint with caching
- `pnpm run lint:fix` - Run ESLint and auto-fix issues
- `pnpm run typegen` - Generate TypeScript types using Wrangler

### Environment Setup
Create `.env.local` with required variables:
```
ANTHROPIC_API_KEY=XXX
SUPABASE_URL=XXX
SUPABASE_ANON_KEY=XXX
SUPABASE_SERVICE_ROLE_KEY=XXX
VITE_LOG_LEVEL=debug  # Optional
```

**Important:** Chrome 129 has known issues with Vite local development. Use Chrome Canary for development testing. Production builds work fine in Chrome 129.

## Architecture Overview

### Tech Stack
Bolt.new is an AI-powered in-browser IDE built with:
- **Framework:** Remix (React) with Vite and TypeScript
- **Deployment:** Cloudflare Pages + Workers
- **Styling:** UnoCSS (Tailwind-compatible atomic CSS)
- **State:** Nanostores (lightweight reactive state)
- **AI:** Claude Sonnet 3.5 via Anthropic API (using Vercel AI SDK)
- **Runtime:** WebContainer API (browser-based Node.js environment)
- **Editor:** CodeMirror 6 with language support
- **Terminal:** xterm.js
- **Auth/DB:** Supabase (in progress - see recent commits)
- **UI Components:** Radix UI primitives

### Core Concepts

#### WebContainer Runtime
- Provides full-stack Node.js sandbox environment in the browser
- Manages filesystem, package manager, dev server, and terminal
- No native binaries (uses web-based implementations)
- Python available but standard library only (no pip)
- Git is NOT available in WebContainer
- Entry point: `app/lib/webcontainer/index.ts`
- Working directory: Controlled by `WORK_DIR_NAME` constant

#### AI Integration Layer
Located in `app/lib/.server/llm/`:
- `prompts.ts` - System prompts and AI instruction templates (modify here for AI behavior changes)
- `model.ts` - Claude Sonnet 3.5 configuration
- `stream-text.ts` - Streaming response handler
- `constants.ts` - Model limits (MAX_TOKENS: 8192, MAX_RESPONSE_SEGMENTS: 2)

The AI has complete control over the WebContainer environment including filesystem, terminal, and package manager.

#### State Management
Nanostores in `app/lib/stores/`:
- `workbench.ts` - Primary workbench state and WebContainer orchestration
- `files.ts` - File system operations and tree management
- `editor.ts` - Code editor state and content
- `terminal.ts` - Terminal state and command execution
- `chat.ts` - AI conversation state
- `previews.ts` - Preview iframe management
- `theme.ts` - Theme preferences
- `settings.ts` - User settings

#### Persistence
- **Client-side:** IndexedDB (`app/lib/persistence/db.ts`) stores chat history locally
- **Server-side:** Supabase integration in progress (see `app/lib/supabase/`)
  - Database schema defined in `app/lib/supabase/types.ts`
  - Tables: users, projects, chats, project_collaborators
  - Client setup: `app/lib/supabase/client.ts`
  - Server setup: `app/lib/supabase/server.ts`

### Project Structure

```
app/
├── lib/
│   ├── .server/          # Server-only code (never imported client-side)
│   │   └── llm/          # AI/LLM integration layer
│   ├── contexts/         # React contexts
│   ├── hooks/            # React hooks
│   ├── persistence/      # IndexedDB and data persistence
│   ├── runtime/          # Action runner for AI-generated actions
│   ├── stores/           # Nanostores state management
│   ├── supabase/         # Supabase auth and database integration
│   └── webcontainer/     # WebContainer API integration
├── components/
│   ├── auth/             # Authentication UI (in progress)
│   ├── chat/             # AI conversation interface
│   ├── editor/           # CodeMirror editor integration
│   ├── header/           # App header and action buttons
│   ├── sidebar/          # File explorer sidebar
│   ├── ui/               # Reusable UI components (Radix UI based)
│   └── workbench/        # Main IDE (editor, terminal, preview)
├── routes/               # Remix routes
│   ├── _index.tsx        # Main chat interface
│   ├── api.chat.ts       # AI chat streaming endpoint
│   ├── api.enhancer.ts   # Prompt enhancement endpoint
│   ├── auth.callback.tsx # Supabase auth callback
│   └── chat.$id.tsx      # Individual chat sessions
├── styles/               # Global styles and CSS
├── types/                # TypeScript type definitions
└── utils/                # Shared utilities
```

### Key Implementation Details

#### File Organization Conventions
- **Server-only code:** Must be in `app/lib/.server/` (Remix enforces this)
- **Client-only code:** Suffix with `.client.ts` or `.client.tsx`
- **Shared code:** Regular `.ts` or `.tsx` files
- **Type definitions:** Centralized in `app/types/`
- **Path alias:** `~/` maps to `app/` (configured in tsconfig.json)

#### WebContainer Development
- WebContainer instance is globally managed and persisted across HMR
- All file operations must go through WebContainer API
- Terminal uses xterm.js with WebContainer shell integration
- Preview uses iframe with WebContainer-served URL
- Shell is zsh emulation with limited command set (see `prompts.ts` for available commands)

#### AI Streaming Architecture
- All LLM interactions use streaming responses via Vercel AI SDK
- Chat route (`api.chat.ts`) streams Server-Sent Events (SSE)
- AI generates structured artifacts containing shell commands and file operations
- Action runner (`app/lib/runtime/action-runner.ts`) executes AI-generated actions in WebContainer
- Message parser (`app/utils/markdown/message-parser.ts`) extracts and parses AI responses

#### Supabase Integration (Recent Addition)
- Phase 1 (completed): Basic setup and connection
- Phase 2 (completed): Authentication implementation
- Currently on feature branch: `feature/supabase-integration`
- Server-side client uses environment variables (SUPABASE_URL, etc.)
- Client-side client uses Vite env vars (import.meta.env.VITE_SUPABASE_URL)
- Auth helpers: `@supabase/auth-helpers-remix` and `@supabase/ssr`

### Development Guidelines

#### When Making Changes
1. **Always run `pnpm run typecheck`** before committing
2. **Run `pnpm run lint:fix`** to auto-fix linting issues
3. **Test in WebContainer environment** - features must work in the browser runtime
4. **Consider WebContainer limitations:**
   - No native binaries
   - No Git (implement alternatives if needed)
   - Python standard library only
   - Prefer npm packages that run in browser (no native dependencies)

#### Common Patterns
- **Adding AI capabilities:** Modify `app/lib/.server/llm/prompts.ts`
- **New file operations:** Add to `app/lib/stores/files.ts`
- **WebContainer actions:** Extend `app/lib/runtime/action-runner.ts`
- **UI components:** Use Radix UI primitives from `app/components/ui/`
- **State management:** Create new store in `app/lib/stores/` following nanostore patterns
- **New routes:** Add to `app/routes/` (Remix file-based routing)

#### Testing Strategy
- Unit tests with Vitest in `*.spec.ts` files
- Example: `app/utils/markdown/message-parser.spec.ts`
- Run individual tests: `pnpm test -- <test-file-path>`
- Test WebContainer integration manually in dev mode

### Current Development Status

Based on recent commits, the project is:
- ✅ Core AI-powered IDE functionality complete
- 🚧 Supabase authentication and database integration in progress
- 📋 Feature roadmap defined in `FEATURE_ROADMAP.md`
- 📋 Sprint planning in `docs/SPRINT_CURRENT.md`

The codebase is a fork of StackBlitz's bolt.new with custom enhancements, particularly around authentication and persistence layers.

### Important Constraints
- WebContainer API requires commercial license for commercial use
- Can only run JavaScript/WebAssembly in browser (no native code compilation)
- Database alternatives must not use native binaries (prefer libsql, sqlite, wasm-based solutions)
- All AI prompts and system constraints are centralized in `prompts.ts`

### Resources
- WebContainer docs: https://webcontainers.io/
- Original bolt.new: https://bolt.new
- Contributing guide: See `CONTRIBUTING.md`
- Current architecture: See `docs/CURRENT_ARCHITECTURE.md`
- Design system: See `docs/DESIGN_SYSTEM.md`
