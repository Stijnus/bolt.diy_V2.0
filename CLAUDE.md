# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm install` - Install dependencies (requires pnpm v10.18.0, Node.js >=18.18.0)
- `pnpm run dev` - Start Remix Vite development server
- `pnpm run build` - Build for production
- `pnpm run start` - Run production build locally with Wrangler Pages (uses bindings.sh)
- `pnpm run preview` - Build and run production preview locally
- `pnpm run deploy` - Build and deploy to Cloudflare Pages
- `pnpm run setup` - Automated Supabase database setup with guided instructions

### Testing & Code Quality
- `pnpm test` - Run Vitest test suite once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm run typecheck` - Run TypeScript type checking (ALWAYS run before committing)
- `pnpm run lint` - Run ESLint with caching
- `pnpm run lint:fix` - Run ESLint and auto-fix issues
- `pnpm run typegen` - Generate TypeScript types using Wrangler

### Utility Commands
- `pnpm run clean` - Clean build artifacts and cache directories
- `pnpm run clean:cache` - Remove all cache files (.vite, .remix, node_modules/.cache)
- `pnpm run clean:build` - Remove build outputs (dist, build, public/build)

### Environment Setup
Create `.env.local` with required variables:
```bash
# Required - Anthropic (default model)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Required - Supabase (authentication & persistence)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional - Additional AI Providers (19+ models supported)
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=xxxxx
DEEPSEEK_API_KEY=xxxxx
XAI_API_KEY=xxxxx
MISTRAL_API_KEY=xxxxx

# Optional - Debugging
VITE_LOG_LEVEL=debug
```

**Setup Database**: Run `pnpm run setup` for guided Supabase database setup, or manually execute `scripts/schema.sql` in Supabase SQL Editor.

**Important:** Chrome 129 has known issues with Vite local development. Use Chrome Canary for development testing. Production builds work fine in Chrome 129.

## Architecture Overview

### Tech Stack
BoltDIY V2.0 is an AI-powered in-browser IDE built with:
- **Framework:** Remix (React) with Vite and TypeScript
- **Deployment:** Cloudflare Pages + Workers
- **Styling:** Tailwind CSS with UnoCSS compatibility
- **State:** Nanostores (lightweight reactive state)
- **AI:** Multi-model support (19+ models from 6 providers via Vercel AI SDK):
  - **Anthropic**: Claude Sonnet 4.5, Claude Sonnet 4
  - **OpenAI**: GPT-5, GPT-4.1, o3, o4-mini, GPT-4o
  - **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash, Experimental
  - **DeepSeek**: V3.2, Reasoner
  - **xAI**: Grok Code Fast 1, Grok 3, Grok 4
  - **Mistral**: Codestral 25.08, Large, Small
- **Runtime:** WebContainer API (browser-based Node.js environment)
- **Editor:** CodeMirror 6 with multi-language support
- **Terminal:** xterm.js with fit and web-links addons
- **Auth/DB:** Supabase (PostgreSQL with RLS policies)
- **UI Components:** Radix UI primitives with custom theming

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
- `provider-factory.ts` - Factory pattern for creating provider instances based on model selection
- `model-config.ts` - Configuration for all 19+ AI models with capabilities, context limits, and pricing
- `stream-text.ts` - Streaming response handler with multi-provider support
- `constants.ts` - Model limits (MAX_TOKENS: 8192, MAX_RESPONSE_SEGMENTS: 2)
- `providers/` - Individual provider implementations:
  - `anthropic.ts` - Claude models configuration
  - `openai.ts` - GPT and o-series models
  - `google.ts` - Gemini models
  - `deepseek.ts` - DeepSeek models
  - `xai.ts` - Grok models
  - `mistral.ts` - Mistral and Codestral models

**Multi-Model Architecture:**
- Each chat can use a different model
- Model selection persists per chat session
- Provider factory dynamically loads the appropriate SDK based on model choice
- Streaming works consistently across all providers

The AI has complete control over the WebContainer environment including filesystem, terminal, and package manager.

#### State Management
Nanostores in `app/lib/stores/`:
- `workbench.ts` - Primary workbench state and WebContainer orchestration
- `files.ts` - File system operations and tree management
- `editor.ts` - Code editor state and content
- `terminal.ts` - Terminal state and command execution
- `chat.ts` - AI conversation state
- `previews.ts` - Preview iframe management
- `theme.ts` - Theme preferences and lightning theme support
- `settings.ts` - User settings and preferences
- `model.ts` - AI model selection per chat with provider/model mapping
- `connection.ts` - Supabase connection status and sync state

#### Persistence
- **Client-side:** IndexedDB (`app/lib/persistence/db.ts`) - Local fallback and offline support
- **Server-side:** Supabase (PostgreSQL) - Full implementation complete
  - Database schema: `scripts/schema.sql` (apply via `pnpm run setup`)
  - Migrations: `scripts/migrations/` for schema updates
  - Tables: users, projects, chats, project_collaborators
  - Client setup: `app/lib/supabase/client.ts` - Browser client with session handling
  - Server setup: `app/lib/supabase/server.ts` - SSR-safe Supabase client
  - Types: `app/lib/supabase/types.ts` - Auto-generated TypeScript types
  - **Important Schema Detail**: `chats` table uses composite UNIQUE constraint on `(url_id, user_id)` allowing different users to have chats with same url_id (see `SUPABASE_CONSTRAINT_FIX.md`)

**Dual Storage Strategy:**
- All chats save to IndexedDB first (fast, offline-capable)
- If user is authenticated, chats also sync to Supabase (cross-device, persistent)
- Migration tools available in settings to move IndexedDB data to Supabase

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
│   ├── api.chat.ts       # AI chat streaming endpoint (multi-model support)
│   ├── api.enhancer.ts   # Prompt enhancement endpoint
│   ├── auth.callback.tsx # Supabase auth callback (OAuth flow)
│   ├── auth.signin.tsx   # Sign in page
│   ├── auth.signup.tsx   # Sign up page
│   ├── settings.tsx      # Settings page with model preferences
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

#### Supabase Integration (Fully Implemented)
- ✅ Authentication with email/password (sign up, sign in, sign out, password reset)
- ✅ User profile management with auto-creation on signup
- ✅ Chat history sync across devices with dual storage (IndexedDB + Supabase)
- ✅ Row Level Security (RLS) policies for data isolation
- ✅ Migration tools for moving IndexedDB chats to Supabase
- Server-side client uses environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Client-side client uses Vite env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- Auth context: `app/lib/contexts/AuthContext.tsx` - React context for user session
- Auth helpers: `@supabase/ssr` for server-side rendering
- **Critical**: Always use `.upsert(..., { onConflict: 'url_id,user_id' })` when updating chats table

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
- **Adding new AI models:**
  1. Add model config to `app/lib/.server/llm/model-config.ts`
  2. Add provider implementation in `app/lib/.server/llm/providers/`
  3. Update provider factory in `provider-factory.ts`
- **New file operations:** Add to `app/lib/stores/files.ts`
- **WebContainer actions:** Extend `app/lib/runtime/action-runner.ts`
- **UI components:** Use Radix UI primitives from `app/components/ui/`
- **State management:** Create new store in `app/lib/stores/` following nanostore patterns
- **New routes:** Add to `app/routes/` (Remix file-based routing)
- **Database changes:**
  1. Update `scripts/schema.sql` for new installations
  2. Create migration in `scripts/migrations/` for existing databases
  3. Update types in `app/lib/supabase/types.ts`

#### Testing Strategy
- Unit tests with Vitest in `*.spec.ts` files
- Example: `app/utils/markdown/message-parser.spec.ts`
- Run individual tests: `pnpm test -- <test-file-path>`
- Test WebContainer integration manually in dev mode

### Current Development Status

Based on recent commits, the project is:
- ✅ Core AI-powered IDE functionality complete
- ✅ Multi-model AI support (19+ models from 6 providers)
- ✅ Supabase authentication fully implemented
- ✅ Database persistence with dual storage (IndexedDB + Supabase)
- ✅ Settings page with model preferences
- ✅ Migration tools for legacy data
- ✅ Lightning theme and enhanced UI
- 📋 Ongoing improvements tracked in `docs/SPRINT_CURRENT.md`

**Recent Major Features:**
- Multi-model provider system with factory pattern
- Supabase constraint fix for multi-user chat support (see `SUPABASE_CONSTRAINT_FIX.md`)
- Enhanced authentication flow with password reset
- Connection status indicator
- Model selector with capability badges

The codebase is an enhanced fork of StackBlitz's bolt.new with significant custom enhancements around multi-model AI support, authentication, and persistence.

### Important Constraints
- WebContainer API requires commercial license for commercial use
- Can only run JavaScript/WebAssembly in browser (no native code compilation)
- Database alternatives must not use native binaries (prefer libsql, sqlite, wasm-based solutions)
- All AI prompts and system constraints are centralized in `prompts.ts`

### Resources
- WebContainer docs: https://webcontainers.io/
- Original bolt.new: https://bolt.new
- Contributing guide: See `docs/project/CONTRIBUTING.md`
- Setup guide: See `docs/guides/SETUP_GUIDE.md`
- Current architecture: See `docs/CURRENT_ARCHITECTURE.md`
- Design system: See `docs/DESIGN_SYSTEM.md`
- Multi-model implementation: See `MULTI_MODEL_IMPLEMENTATION_SUMMARY.md`
- Supabase constraint fix: See `SUPABASE_CONSTRAINT_FIX.md`
- AI models reference: See `docs/ai-models.md`
- Documentation hub: See `docs/`
