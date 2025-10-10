# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: BoltDIY V2.0 — an AI-powered in-browser IDE (Remix + Cloudflare Pages/Workers, Vercel AI SDK, WebContainers, Supabase, CodeMirror, Radix UI).

- Prerequisites: Node >= 20, pnpm 10.18.0. Environment variables in .env.local (see README.md and .env.example). 
- Path alias: import from "~/..." maps to app/ (see tsconfig.json).

Commands

- Install and run locally
  - pnpm install
  - pnpm dev
  - pnpm preview
  - pnpm start

- Build and deploy
  - pnpm build
  - pnpm deploy

- Tests (Vitest)
  - pnpm test
  - pnpm test:watch
  - Run a single file: pnpm test -- app/path/to/foo.spec.ts
  - Run a single test by name: pnpm test -- -t "test name"

- Linting and types
  - pnpm lint
  - pnpm lint:fix
  - pnpm typecheck
  - pnpm typegen

- Docker (optional)
  - pnpm docker:build
  - pnpm docker:build:dev
  - pnpm docker:prod
  - pnpm docker:dev
  - pnpm docker:up | pnpm docker:down | pnpm docker:logs | pnpm docker:clean

- Project scripts
  - Guided DB setup (Supabase): pnpm setup
  - Housekeeping: pnpm clean | pnpm clean:cache | pnpm clean:build

Architecture overview

- Runtime and framework
  - Remix + Vite + TypeScript targeting Cloudflare Pages/Workers. Production run uses Wrangler Pages; development uses remix vite:dev.
  - Client UI built with React, Radix UI, Tailwind CSS. CodeMirror 6 for editing; xterm.js for terminal.

- WebContainer integration (in-browser IDE)
  - Provides a browser-based Node-like environment (no native binaries). Backed by @webcontainer/api.
  - Central orchestration in app/lib/webcontainer and app/lib/runtime (e.g., action-runner). Terminal and preview integrate with this runtime.

- Multi-model AI layer
  - Located under app/lib/.server/llm. Uses the Vercel AI SDK with provider abstractions (Anthropic, OpenAI, Google, DeepSeek, xAI, Mistral).
  - Key files: provider-factory.ts (dynamic provider selection), model-config.ts (capabilities/limits), providers/* (per-provider wiring), stream-text.ts (SSE streaming).
  - Each chat can select a different model; streaming protocols are normalized across providers.

- Server routes and streaming
  - app/routes/api.chat.ts streams AI responses (SSE) used by the chat UI.
  - Other routes include settings and auth flows; UI routes follow Remix’s file-based routing in app/routes.

- State management
  - Nanostores in app/lib/stores coordinate core IDE state: chat, editor, files, terminal, workbench, settings, model selection, etc.
  - Client-only components and hooks use the .client.ts(x) convention. Server-only code lives under app/lib/.server.

- Persistence strategy
  - Dual storage for chat and project data: IndexedDB (client/offline) and Supabase (server/persistent, with RLS).
  - Supabase client setup under app/lib/supabase; schema and migrations in scripts/ (see scripts/schema.sql and scripts/migrations/*). Chats use a composite uniqueness on (url_id, user_id); use upsert with that conflict target when applicable.

References

- README.md: quick start, provider list, deployment.
- docs/: architecture, multi-model implementation, design system, setup/troubleshooting.
- CLAUDE.md: expanded command list and deeper architectural notes that also apply here.
