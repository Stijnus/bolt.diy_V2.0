---
layout: default
title: Frequently Asked Questions
description: Common questions about running and using BoltDIY V2.0
---

# Frequently Asked Questions

## What is BoltDIY V2.0?

BoltDIY is a browser-based coding workspace built around chat, WebContainer, and multiple model providers. It is aimed at technical users who want to prototype quickly with their own provider keys.

## Is this a hosted no-code builder?

No. The current direction is narrower:

- self-hosted-friendly
- BYO-model
- technical-user workflow
- browser IDE plus chat

## Do I need Supabase?

No for local use. Yes if you want:

- sign in and sign up
- synced chat history
- migration of browser-local chats into a shared cloud store

## Which model providers are supported?

The codebase supports:

- Anthropic
- OpenAI
- Google
- DeepSeek
- xAI
- Mistral

See the [AI Models Guide](./ai-models.md) for the current model list.

## Can I switch models mid-chat?

Yes. Model choice is part of the chat workflow, so you can compare providers while iterating on the same prototype.

## Can I self-host it?

Yes. That is one of the core reasons to keep this codebase. You can run it locally, in Docker, or deploy it on your own infrastructure.

## What can I realistically build with it?

The strongest fit is:

- frontend prototypes
- internal tools
- small full-stack experiments that work inside WebContainer constraints
- model-comparison workflows for coding tasks

## What are the main runtime limits?

WebContainer is powerful, but it still has constraints:

- no native binaries
- no Git inside the browser sandbox
- browser-limited CPU and memory
- tools must work in a browser-safe Node environment

## How do I deploy code generated inside BoltDIY?

BoltDIY is not currently positioned as a built-in deployment platform. The practical path is:

1. generate or edit the project in the workspace
2. export or copy the code to your normal development flow
3. deploy it using your own preferred platform

## Can multiple people collaborate in the app?

Not as a current product focus. Shared project-management features have been removed from the active app surface. Collaboration is better handled outside the workspace through your normal Git and review workflow.

## Where is my data stored?

- chat history is stored locally in IndexedDB first
- if Supabase is configured and you are signed in, chats can also sync to Supabase
- model requests go to whichever provider API you configured

## Can I recover old chats?

Usually yes:

1. check the same browser profile for IndexedDB data
2. sign into the same Supabase account if sync was enabled
3. use the migration tools in settings if local data exists

## How do I update a self-hosted install?

```bash
git pull origin main
pnpm install
pnpm run typecheck
pnpm build
```

## Where should I start if I want to contribute?

Use these docs first:

- [Setup Guide](./SETUP_GUIDE.md)
- [Troubleshooting](./troubleshooting.md)
- [Codebase Readme](../../CODEBASE_README.md)

Then inspect the active runtime layers:

- `app/lib/.server/llm/`
- `app/lib/runtime/`
- `app/lib/stores/`
- `app/lib/webcontainer/`
