# BoltDIY V2.0

A self-hosted-friendly, BYO-model prototype workspace for technical users.

BoltDIY combines:

- chat-driven coding
- a browser IDE
- terminal access
- live preview
- multi-provider model selection
- optional Supabase-backed auth and chat sync

The product direction is intentionally narrower than a general “AI app builder”. The goal is to help technical users prototype quickly in one browser workspace using the model providers they choose.

## What It Is

BoltDIY is best understood as:

- a browser workspace for prompting and iterating on prototypes
- an open, forkable alternative to closed hosted builders
- a place to compare and use multiple AI coding models with your own API keys

It is not currently positioned as:

- a no-code mass-market builder
- a broad collaboration platform
- a polished one-click deployment product

## Core Workflow

1. Open the workspace
2. Choose a model
3. Prompt the assistant
4. Let the model generate file and shell actions
5. Inspect the results in chat, editor, terminal, and preview
6. Iterate until the prototype is where you want it

## Current Strengths

- Multi-model support across major providers
- WebContainer-powered browser workspace
- File tree, editor, terminal, and live preview
- Local-first chat persistence with optional Supabase sync
- Auth for saved conversation history

## Good Fit

- technical founders
- indie hackers
- internal tools builders
- people who want to self-host or fork the product
- users who prefer bring-your-own-provider-key workflows

## Not The Current Focus

- team collaboration features
- public project galleries
- enterprise management features
- broad deployment automation

## Quick Start

### Prerequisites

- Node.js `>= 20`
- `pnpm` `10.18.0`
- at least one provider API key
- optional: Supabase project if you want auth and cloud sync

### Install

```bash
git clone https://github.com/Stijnus/bolt.diy_V2.0.git
cd bolt.diy_V2.0
pnpm install
cp .env.example .env.local
```

### Minimum `.env.local`

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

Optional providers:

```bash
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=xxxxx
DEEPSEEK_API_KEY=xxxxx
XAI_API_KEY=xxxxx
MISTRAL_API_KEY=xxxxx
```

Optional Supabase for auth and sync:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If you already set up Supabase with an older schema, also apply:

- `scripts/migrations/001_fix_chats_unique_constraint.sql`
- `scripts/migrations/002_remove_legacy_project_tables.sql`

### Run

```bash
pnpm dev
```

Open `http://localhost:5173`.

## Main Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm run typecheck
pnpm run lint
```

## Architecture

Important areas:

- `app/lib/.server/llm/`: provider registry, model config, prompts, streaming
- `app/lib/runtime/`: parser and action runner
- `app/lib/stores/`: workbench, files, editor, terminal, preview, model state
- `app/lib/persistence/`: IndexedDB chat history and sync helpers
- `app/components/chat/`: chat UI
- `app/components/workbench/`: editor, terminal, preview UI

For a current codebase walkthrough, see [CODEBASE_README.md](./CODEBASE_README.md).

## Docs

- [Setup Guide](./docs/guides/SETUP_GUIDE.md)
- [Docker Guide](./docs/guides/DOCKER.md)
- [AI Models Guide](./docs/guides/ai-models.md)
- [Codebase Readme](./CODEBASE_README.md)
- [Self-Hosted BYO-Model Plan](./SELF_HOSTED_BYO_MODEL_PLAN.md)

## Status

The repository is being narrowed toward:

- self-hosted usage
- bring-your-own-model workflows
- prototype and internal-tool iteration

Some older docs and product copy may still reflect the broader previous direction. The codebase and the files above are the current source of truth.
