---
layout: default
title: Complete Setup Guide
description: Step-by-step guide to run BoltDIY locally and optionally connect Supabase
---

# BoltDIY V2.0 Setup Guide

This guide covers the current intended setup: local development first, own model keys, optional Supabase for auth and synced chat history.

## Prerequisites

- Node.js `>= 20`
- `pnpm` `10.18.0` or later
- at least one model provider API key
- optional: a Supabase project if you want auth and cloud sync

## Quick Start

### 1. Clone And Install

```bash
git clone https://github.com/Stijnus/bolt.diy_V2.0.git
cd bolt.diy_V2.0
pnpm install
cp .env.example .env.local
```

### 2. Add Provider Keys

Minimum local setup:

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

### 3. Start The App

```bash
pnpm dev
```

Open `http://localhost:5173`.

At this point you can use the workspace locally without Supabase-backed auth.

## Optional Supabase Setup

Add Supabase only if you want:

- sign in and sign up
- saved chats across devices
- migration from browser-local history to Supabase

### 1. Create A Supabase Project

1. Go to [supabase.com](https://supabase.com).
2. Create a new project.
3. Copy the project URL, anon key, and service role key.

### 2. Add Supabase Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install The Schema

Run the guided setup helper:

```bash
pnpm run setup
```

This uses `scripts/setup.sh` to help you apply `scripts/schema.sql`.

If your database was created before the product-surface cleanup, also apply:

- `scripts/migrations/001_fix_chats_unique_constraint.sql`
- `scripts/migrations/002_remove_legacy_project_tables.sql`

### 4. Configure Auth URLs

In the Supabase dashboard:

1. Go to `Authentication -> URL Configuration`.
2. Set the site URL to `http://localhost:5173`.
3. Add `http://localhost:5173/**` as a redirect URL.

### 5. Restart The App

```bash
pnpm dev
```

## Recommended Validation

After setup:

```bash
pnpm run typecheck
pnpm test
```

Then verify in the browser:

1. a chat opens correctly
2. the model selector shows the providers you configured
3. the workbench loads
4. preview and terminal open
5. if Supabase is configured, sign in works

## First Things To Try

### Compare Models

Switch the active model in chat and use the same prompt against different providers.

### Build A Small Prototype

Ask the assistant to scaffold a simple React or Vite app, then inspect the generated files in the workbench.

### Import Old Local Chats

If you previously used a browser-local Bolt-style setup:

1. open `Settings`
2. go to migration tools
3. import local data into Supabase after signing in

## Common Problems

### Missing Models

Usually caused by:

- missing API keys
- invalid key format
- exhausted provider credits

### Supabase Errors

Usually caused by:

- incorrect env vars
- schema not applied
- missing redirect URL configuration

### WebContainer Problems

Usually caused by:

- browser compatibility issues
- blocked storage APIs
- stale local browser data

Use the [Troubleshooting Guide](./troubleshooting.md) for the deeper checklist.

## Related Docs

- [Docker Guide](./DOCKER.md)
- [AI Models Guide](./ai-models.md)
- [FAQ](./faq.md)
- [Troubleshooting](./troubleshooting.md)
- [Codebase Readme](../../CODEBASE_README.md)
