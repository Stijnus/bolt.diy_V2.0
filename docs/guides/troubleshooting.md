---
layout: default
title: Troubleshooting Guide
description: Common setup and runtime issues for BoltDIY V2.0
---

# Troubleshooting Guide

Use this guide when local setup, provider configuration, Supabase sync, or WebContainer runtime behavior fails.

## Quick Checks First

Run:

```bash
node --version
pnpm --version
pnpm run typecheck
```

Confirm:

- Node is `>= 20`
- `pnpm` is installed
- `.env.local` exists
- `pnpm install` already ran

## No Models Show Up

Common causes:

- missing provider keys in `.env.local`
- invalid keys
- exhausted provider quota

Check:

```bash
cat .env.local
```

At least one provider key must be present.

Restart after changes:

```bash
pnpm dev
```

## Supabase Auth Or Sync Does Not Work

Common causes:

- wrong project URL or keys
- schema not applied
- missing redirect URL config

Verify these variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Then re-run the guided setup:

```bash
pnpm run setup
```

Also verify in Supabase:

- site URL is `http://localhost:5173`
- redirect URL includes `http://localhost:5173/**`

## WebContainer Does Not Start

Common causes:

- blocked browser storage
- browser extensions
- stale IndexedDB or local storage
- unsupported browser behavior

Try:

1. open the app in a current Chrome, Edge, or Firefox build
2. disable extensions for localhost
3. clear local site data
4. reload the page

## Terminal Or Preview Does Not Appear

Usually one of these:

- WebContainer failed to boot
- the generated app never started a dev server
- the model produced invalid startup commands

Check:

- browser console
- terminal output in the workspace
- whether the generated app actually installed dependencies

## Type Errors Or Import Failures

Reset dependencies and caches:

```bash
rm -rf node_modules
rm -rf .cache .vite .remix dist build
pnpm install
pnpm run typecheck
```

## Port 5173 Is Already In Use

```bash
lsof -i :5173
kill -9 <PID>
```

Or run on another port:

```bash
pnpm dev --port 3000
```

## Chats Seem Missing

Check both persistence layers:

1. the same browser profile and IndexedDB data
2. the same Supabase account if sync was enabled
3. migration tools in settings for importing older local data

## App Loads But Feels Slow

Common causes:

- slow provider model choice
- large prompts
- browser memory pressure
- heavy generated dev server inside WebContainer

Try:

- switching to a faster model
- breaking requests into smaller prompts
- closing other heavy browser tabs

## Clean Reset

If the local environment is badly out of sync:

```bash
rm -rf node_modules
rm -rf .cache .vite .remix dist build
cp .env.local .env.local.backup
pnpm install
pnpm dev
```

Do not delete `.env.local` unless you actually want to rebuild it from scratch.

## When Reporting An Issue

Include:

- Node version
- pnpm version
- browser and version
- exact error text
- whether Supabase is configured
- which provider/model you were using

Remember: Most issues are configuration-related and can be solved by carefully following the [Setup Guide](../SETUP_GUIDE.md) again from the beginning.

---

*[← Back to Documentation Hub](./index.md)*
