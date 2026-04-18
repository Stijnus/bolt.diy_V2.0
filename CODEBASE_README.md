# BoltDIY V2.0 Codebase Readme

## What This Project Is

BoltDIY V2.0 is an AI-powered development environment that runs mostly in the browser and is built as an enhanced fork of StackBlitz `bolt.new`.

In practical terms, it is:

- A chat-first coding interface where the user asks an AI model to build or change an app
- A browser IDE with file tree, code editor, terminal, and live preview
- A multi-model LLM gateway that can route requests to Anthropic, OpenAI, Google, DeepSeek, xAI, or Mistral
- A persistence layer that stores chat history locally in IndexedDB and, when authenticated, syncs it to Supabase
- A project/workspace shell around those chats, with user auth and basic project management

The main product idea is: "describe what you want, let the model produce structured actions, execute those actions inside a WebContainer, and let the user watch/edit the result live."

## Short Product Summary

The app gives a user one canvas with:

- Chat on the left/center
- A collapsible workbench on the right
- Code editor
- Multi-tab terminal
- Live preview iframe
- Model picker
- Conversation history
- Supabase-backed auth and chat sync

The AI does not directly mutate the host machine. Instead, it emits special tagged output that the frontend parses into:

- file writes
- shell commands

Those actions run inside StackBlitz WebContainer, which acts like an in-browser Node.js sandbox.

## The Core User Flow

1. The user opens `/` and lands on the chat interface.
2. They pick a model and enter a prompt.
3. The frontend sends chat messages to `app/routes/api.chat.ts`.
4. The server selects the requested model/provider through the LLM provider factory.
5. The model streams a response back.
6. A custom parser strips special `<boltArtifact>` and `<boltAction>` tags from the visible assistant text and converts them into executable actions.
7. The frontend creates an "artifact" card in the message stream and queues the parsed actions.
8. The action runner executes shell/file actions inside WebContainer.
9. File watchers refresh the in-browser file map.
10. The editor, file tree, and preview update in real time.
11. The conversation is stored in IndexedDB and optionally upserted to Supabase.

That loop is the heart of the application.

## How The AI Layer Works

The server-side LLM code lives in `app/lib/.server/llm/`.

Important files:

- `prompts.ts`: system prompt and runtime constraints for the model
- `stream-text.ts`: main streaming wrapper around the Vercel AI SDK
- `provider-factory.ts`: maps provider/model choice to the correct SDK model
- `model-config.ts`: provider registry and model metadata
- `providers/*.ts`: concrete provider definitions
- `constants.ts`: token limits and segment limits

### Supported Providers

The repo currently supports:

- Anthropic
- OpenAI
- Google
- DeepSeek
- xAI
- Mistral

### Why The Prompting Layer Matters

The system prompt is opinionated. It teaches the model:

- it is operating inside WebContainer
- native binaries are not available
- Python is standard-library-only
- Git is not available inside the container
- it should respond with special `boltAction` structures for shell and file operations

This is not a normal free-form chatbot. It is a controlled code-generation runtime.

## The Artifact/Action Protocol

One of the most important pieces in the repo is the custom response format:

- `<boltArtifact ...>`
- `<boltAction type="shell">`
- `<boltAction type="file" filePath="...">`

These tags are parsed by `app/lib/runtime/message-parser.ts`.

What happens next:

- artifact open -> create a UI container in the chat stream
- action open/close -> register a pending action
- action run -> hand off to `ActionRunner`
- `ActionRunner` either writes a file or spawns a shell process in WebContainer

The parser is incremental and designed for streamed model output, not just whole responses. That is why it tracks message state by `messageId` and supports partial chunks.

## Browser IDE / Workbench

The workbench is the in-browser IDE panel. It is backed by a `WorkbenchStore` that composes smaller stores:

- `FilesStore`
- `EditorStore`
- `TerminalStore`
- `PreviewsStore`

### Files

`app/lib/stores/files.ts` is responsible for:

- exporting the current WebContainer filesystem as JSON
- converting it into a repo-style file map
- detecting text vs binary files
- watching filesystem changes
- writing saved file changes back to WebContainer
- tracking file modifications made by the human user

Human edits matter because they are converted into an HTML-wrapped diff payload and prepended to the next user prompt, so the model sees what changed locally.

### Editor

The editor stack uses CodeMirror 6. Main code is under:

- `app/components/editor/codemirror/`
- `app/lib/stores/editor.ts`

It supports:

- selected file state
- scroll restoration per file
- unsaved file tracking
- save/reset actions

### Terminal

The terminal uses xterm.js and WebContainer shell processes.

Key files:

- `app/components/workbench/terminal/Terminal.tsx`
- `app/lib/stores/terminal.ts`
- `app/utils/shell.ts`

The app can open multiple terminal tabs in the UI, but they all attach to WebContainer shell processes rather than to the host machine.

### Preview

`app/lib/stores/previews.ts` listens for WebContainer port events. When the app inside the container opens a port, the UI exposes it as a preview target and renders it in an iframe.

## State Management

The app uses Nanostores instead of Redux/Zustand.

Main stores:

- `chat.ts`: chat UI state like started/aborted/showChat
- `workbench.ts`: orchestrates the IDE panel and artifact runners
- `files.ts`: file map and modification tracking
- `editor.ts`: open document state
- `terminal.ts`: terminal visibility and process attachment
- `previews.ts`: active preview ports
- `model.ts`: selected model globally and per chat
- `connection.ts`: IndexedDB/Supabase sync status
- `settings.ts`: local app/editor/AI settings
- `theme.ts`: light/dark theme state

The codebase leans on simple observable stores rather than a heavy centralized state framework.

## Persistence And Data Model

There are two persistence modes.

### 1. IndexedDB

Local-first chat history lives in:

- `app/lib/persistence/db.ts`
- `app/lib/persistence/useChatHistory.ts`

IndexedDB is used for:

- fast local save/load
- offline-ish fallback
- restoring conversations by id/urlId

### 2. Supabase

Authenticated users also sync data to Supabase.

Relevant code:

- `app/lib/supabase/client.ts`
- `app/lib/supabase/server.ts`
- `app/lib/contexts/AuthContext.tsx`
- `app/lib/services/projects.ts`
- `app/lib/migration/migrate-to-supabase.ts`
- `scripts/schema.sql`

Database tables defined in the schema:

- `users`
- `projects`
- `chats`
- `project_collaborators`

Important schema detail:

- `chats` uses `UNIQUE(url_id, user_id)`

That composite uniqueness is reflected in the app logic, which uses:

- `.upsert(..., { onConflict: 'url_id,user_id' })`

This is one of the key implementation details in the repo.

## Authentication

Authentication is implemented with Supabase Auth.

Current capabilities visible in code:

- sign up
- sign in with email/password
- sign out
- password reset
- OAuth sign-in for GitHub and Google
- callback flow via `app/routes/auth.callback.tsx`
- session hydration in `AuthContext`

The app is written to degrade if Supabase env vars are missing. In that case, auth-dependent features are effectively disabled rather than crashing the whole UI.

## Routes

Important routes in `app/routes/`:

- `_index.tsx`: home chat page
- `chat.$id.tsx`: loads a specific chat session using the same main UI
- `api.chat.ts`: chat streaming endpoint
- `api.enhancer.ts`: prompt enhancement endpoint
- `api.avatar.tsx`: avatar proxy with allowlisted domains
- `api.supabase-test.ts`: connection test endpoint
- `settings.tsx`: settings page, gated by auth
- `projects.tsx`: project list/create/manage page, gated by auth
- `auth.callback.tsx`: OAuth/email recovery callback handler

The route model is simple: one main app shell, one chat experience, and a small set of API endpoints.

## UI Structure

Main UI areas:

- `app/components/chat/`: messages, markdown, model selector, prompt entry, artifact card
- `app/components/workbench/`: file tree, editor, preview, terminal
- `app/components/auth/`: login/signup/reset flows
- `app/components/header/`: top bar, connection status, model badge
- `app/components/sidebar/`: conversation history and account panel
- `app/components/settings/`: settings page
- `app/components/projects/`: project management UI
- `app/components/ui/`: Radix-based reusable primitives

The visual design uses:

- Tailwind CSS
- custom theme tokens under `bolt-elements-*`
- framer-motion for animation
- Radix primitives for composable UI

## Directory Walkthrough

### Root

- `README.md`: product/setup-oriented readme
- `AGENTS.md`: repo-specific instructions for coding agents
- `CLAUDE.md`, `WARP.md`: additional assistant/operator guidance
- `package.json`: scripts, deps, platform definition
- `vite.config.ts`: Remix + Vite config, Chrome 129 workaround, node polyfills
- `wrangler.toml`: Cloudflare Pages config
- `Dockerfile`, `docker-compose*.yml`: containerized local/prod workflows

### `app/`

Main Remix application.

### `app/components/`

User-facing UI split by domain:

- auth
- chat
- editor
- header
- migration
- projects
- settings
- sidebar
- ui
- workbench

### `app/lib/`

Core non-visual logic:

- `.server/llm/`: server-only model/provider logic
- `contexts/`: React auth context
- `hooks/`: message parsing, prompt enhancement, shortcuts, scrolling
- `migration/`: IndexedDB -> Supabase migration logic
- `persistence/`: IndexedDB storage and chat-history hooks
- `runtime/`: parser and action runner
- `services/`: project service methods
- `stores/`: Nanostore state modules
- `supabase/`: browser/server client setup and types
- `webcontainer/`: WebContainer boot/auth wrappers

### `app/routes/`

Remix pages and API routes.

### `docs/`

Project docs, guides, planning docs, and technical notes.

Important caution:

- not every document here matches the current codebase
- `docs/technical/CURRENT_ARCHITECTURE.md` is clearly stale and still describes a pre-Supabase/pre-auth version

### `scripts/`

Operational scripts:

- schema/setup
- migrations
- cleanup

### `functions/`

Cloudflare Pages function entrypoint that mounts the Remix server build.

### `public/`, `icons/`, `assets/`

Static assets and branding.

## Build, Runtime, And Deployment Model

### Local Development

Core commands from `package.json`:

- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm start`
- `pnpm test`
- `pnpm run typecheck`
- `pnpm run lint`

### Server/Hosting

The app is designed for Cloudflare Pages / Workers:

- Remix Cloudflare adapter
- Pages function entry in `functions/[[path]].ts`
- Wrangler config in `wrangler.toml`

### Browser Runtime Constraint

The "real project execution" experience happens in WebContainer, not on the deployment server. That is why the app keeps repeating these constraints:

- no native binaries
- browser-safe Node/WebAssembly only
- no Git inside the container
- prefer npm/Vite/browser-compatible tools

## Notable Engineering Decisions

### 1. Local-first chat persistence

The app saves to IndexedDB first, then syncs to Supabase when possible. That is a pragmatic design for resilience and speed.

### 2. Structured model output instead of tool calling

The AI is not using a generic server tool-calling interface. It emits a custom tagged protocol that the frontend parses and executes.

### 3. UI model registry mirrors server model registry

There is a server-side provider registry and a client-side model list in `app/lib/models.client.ts`. This improves UX but also means model metadata can drift if only one side gets updated.

### 4. Workbench state is heavily client-side

Most of the actual IDE logic lives in browser state and browser runtime abstractions, not in backend services.

### 5. Degradation when services are missing

If Supabase config is missing, the app tries to keep working in a reduced mode instead of hard-failing.

## Important Caveats And Mismatches

These are useful for anyone onboarding to the repo.

### Documentation drift exists

Some docs describe older architecture. The code is the source of truth.

### Project management is ahead of implementation in places

The repo contains roadmap/sprint docs for features that are planned, partially built, or not yet wired through end-to-end.

### "Projects" exist, but chat is still the center of gravity

There is a project schema and project UI, but the most mature, central path in the app is still:

- prompt
- streamed AI response
- WebContainer action execution
- saved conversation

### WebContainer constraints shape many design choices

A lot of the repo only makes sense when you remember that generated apps must run in an in-browser container, not a normal VM.

## If You Need To Understand The Repo Fast

Read these files first:

1. `app/routes/api.chat.ts`
2. `app/lib/.server/llm/prompts.ts`
3. `app/lib/runtime/message-parser.ts`
4. `app/lib/runtime/action-runner.ts`
5. `app/lib/stores/workbench.ts`
6. `app/lib/stores/files.ts`
7. `app/components/chat/Chat.client.tsx`
8. `app/components/workbench/Workbench.client.tsx`
9. `app/lib/persistence/useChatHistory.ts`
10. `scripts/schema.sql`

Those ten files explain most of the product.

## Bottom Line

This codebase is an AI coding workspace built around a custom "LLM emits executable structured actions" loop.

Its defining characteristics are:

- chat-first development
- browser-based execution through WebContainer
- live code/editor/preview tooling
- multi-provider model routing
- local-first persistence with Supabase sync
- authenticated user/project shell around the core chat product

If you strip the repo down to its essence, this is a browser IDE plus an LLM orchestration layer, wrapped in a Remix app and backed by Supabase for identity and persistence.
