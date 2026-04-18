# BoltDIY V2.0 Codebase Readme

## What This Project Is

BoltDIY V2.0 is a chat-driven coding workspace built on top of Remix and StackBlitz WebContainer.

In practical terms, the current codebase is:

- a browser IDE with chat, editor, terminal, file tree, and preview
- a multi-provider LLM layer for Anthropic, OpenAI, Google, DeepSeek, xAI, and Mistral
- a runtime that converts structured model output into file writes and shell commands
- a local-first persistence layer with optional Supabase auth and chat sync

The current product direction is narrower than a general AI app-builder. The strongest path in the repo is: technical user, own provider keys, prototype inside one browser workspace, iterate quickly.

## Product Summary

The main user canvas combines:

- chat for prompting the model
- a workbench with editor, terminal, and preview
- model selection per conversation
- conversation history
- optional auth and cross-device sync

The assistant does not execute on the host machine. It emits structured actions that run inside WebContainer, which provides an in-browser Node.js sandbox.

## Core Runtime Loop

1. The user opens `/` and starts or resumes a chat.
2. The frontend sends messages to `app/routes/api.chat.ts`.
3. The server resolves the selected provider/model through `app/lib/.server/llm/provider-factory.ts`.
4. The response streams back through the Vercel AI SDK wrappers.
5. The app parses `<boltArtifact>` and `<boltAction>` tags from the streamed assistant output.
6. The runtime queues file and shell actions.
7. WebContainer executes those actions.
8. File watchers and preview state update the workbench.
9. Chat state is stored in IndexedDB and optionally synced to Supabase.

That loop is the center of the product.

## AI Layer

Server-side LLM code lives in `app/lib/.server/llm/`.

Important files:

- `prompts.ts`: model instructions and WebContainer constraints
- `stream-text.ts`: streaming wrapper around provider calls
- `provider-factory.ts`: provider/model resolution
- `model-config.ts`: server-side model registry
- `providers/*.ts`: provider definitions
- `constants.ts`: token and response segment limits

The prompt layer matters because it teaches the model that:

- it is operating inside WebContainer
- native binaries are unavailable
- Git is unavailable inside the sandbox
- Python is standard-library-only
- file and shell actions must be emitted in the Bolt artifact protocol

This is a controlled coding runtime, not a generic chatbot.

## Artifact And Action Protocol

The app relies on a custom streaming protocol:

- `<boltArtifact ...>`
- `<boltAction type="shell">`
- `<boltAction type="file" filePath="...">`

Parsing happens in the runtime/message-parser layer and feeds the action runner. The parser is incremental because responses arrive as streamed chunks, not as one final message.

The action runner then:

- writes files into WebContainer
- spawns shell commands in the sandbox
- updates the workbench state so the UI reflects the new filesystem and preview output

## Workbench

The workbench is the browser IDE side of the app. It is mostly orchestrated through Nanostores.

Main stores:

- `app/lib/stores/workbench.ts`
- `app/lib/stores/files.ts`
- `app/lib/stores/editor.ts`
- `app/lib/stores/terminal.ts`
- `app/lib/stores/previews.ts`
- `app/lib/stores/model.ts`
- `app/lib/stores/chat.ts`
- `app/lib/stores/settings.ts`
- `app/lib/stores/connection.ts`

Key responsibilities:

- `files.ts`: file map, filesystem sync, modified-file tracking
- `editor.ts`: selected file, unsaved state, save/reset behavior
- `terminal.ts`: terminal tabs and process attachment
- `previews.ts`: preview ports and iframe targets
- `workbench.ts`: high-level orchestration across the IDE surface

Human edits are fed back into the next prompt so the model can see what changed since its previous action batch.

## Persistence And Auth

The app has two persistence paths.

### IndexedDB

Local-first chat history lives under `app/lib/persistence/`.

This is the default resilience layer for:

- quick save/load
- browser-local history
- restoring conversations even without auth

### Supabase

Supabase support lives under:

- `app/lib/supabase/`
- `app/lib/contexts/AuthContext.tsx`
- `app/lib/migration/migrate-to-supabase.ts`
- `scripts/schema.sql`

Current auth-related capabilities in code:

- sign up
- sign in
- sign out
- password reset
- OAuth callback handling
- sync of chat history for authenticated users

Important detail:

- chat upserts rely on `UNIQUE(url_id, user_id)` and use `.upsert(..., { onConflict: 'url_id,user_id' })`

### Schema Note

The active schema is now intentionally narrow:

- `users`
- `chats`

Older databases may still contain legacy project tables until the migration in `scripts/migrations/002_remove_legacy_project_tables.sql` is applied.

## Current Routes

Important routes in `app/routes/`:

- `_index.tsx`: main workspace landing page
- `chat.$id.tsx`: resume a specific chat session
- `settings.tsx`: settings surface
- `api.chat.ts`: chat streaming endpoint
- `api.enhancer.ts`: prompt enhancement endpoint
- `api.avatar.tsx`: avatar proxy
- `api.supabase-test.ts`: Supabase connectivity check
- `auth.callback.tsx`: auth recovery and callback handling
- `auth.signin.tsx`
- `auth.signup.tsx`

The route model is simple: one workspace, one chat flow, and a small API surface around it.

## UI Structure

Main UI domains:

- `app/components/chat/`: prompt entry, messages, artifacts, model selection
- `app/components/workbench/`: editor, preview, terminal, file tree
- `app/components/auth/`: login and account flows
- `app/components/header/`: top bar and status indicators
- `app/components/sidebar/`: conversation history and user panel
- `app/components/settings/`: settings UI
- `app/components/ui/`: reusable primitives

There is no longer an active `app/components/projects/` product surface.

## Directory Walkthrough

### Root

- `README.md`: product-level readme
- `AGENTS.md`: repo instructions for coding agents
- `package.json`: scripts and dependencies
- `wrangler.toml`: Cloudflare Pages configuration
- `Dockerfile` and `docker-compose*.yml`: containerized local and self-host flows

### `app/`

Main Remix application.

### `app/lib/`

Core logic:

- `.server/llm/`: provider and prompt layer
- `contexts/`: auth context
- `hooks/`: prompt helpers, scrolling, keyboard shortcuts
- `migration/`: IndexedDB to Supabase migration helpers
- `persistence/`: IndexedDB storage and chat history
- `runtime/`: parser and action runner
- `stores/`: Nanostore state
- `supabase/`: browser/server clients and generated types
- `webcontainer/`: WebContainer integration

### `scripts/`

Operational support:

- `setup.sh`: guided schema setup
- `schema.sql`: baseline database schema
- `migrations/`: targeted database fixes

### `functions/`

Cloudflare Pages entrypoint mounting the Remix build.

## Build And Hosting Model

Common commands:

- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm test`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run setup`

The app is structured for Cloudflare Pages and Workers, but the actual code execution experience happens inside WebContainer in the browser, not on the deployment server.

That design imposes persistent runtime constraints:

- no native binaries
- no Git inside the sandbox
- browser-safe Node and WebAssembly only
- prefer tooling that works without host-level system access

## Notable Engineering Decisions

### Local-first persistence

Chats save to IndexedDB first and sync outward when possible. That keeps the core workspace usable even when auth or network configuration is incomplete.

### Structured actions instead of generic tool calling

The assistant emits a repo-specific protocol that the frontend parses and executes. That keeps the runtime coupled tightly to the workbench UI.

### Mirrored model registries

The server and client both carry model metadata. This improves UX but creates drift risk if only one side is updated.

### Graceful degradation

If Supabase is not configured, the app still tries to operate as a local prototype workspace instead of failing completely.

## Current Caveats

- Schema cleanup is incomplete because historical project tables still exist.
- Some technical notes in the repo describe previous implementation phases rather than current product direction.
- The strongest path is still chat plus workbench, not broader platform features.

## Bottom Line

This codebase is best understood as a self-hosted-friendly, BYO-model prototype workspace for technical users.

The parts worth building on are:

- the chat-to-action runtime
- the WebContainer workbench
- the multi-provider model layer
- the local-first persistence and optional auth sync

The parts to treat as legacy are:

- broader project-management ambitions
- stale planning documentation
- schema leftovers that no longer map cleanly to the active UI

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
