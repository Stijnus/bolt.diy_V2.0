---
layout: default
title: BoltDIY V2.0 Documentation
description: Documentation for the self-hosted-friendly BYO-model prototype workspace
---

# BoltDIY V2.0

Documentation for the current product direction: a self-hosted-friendly, BYO-model prototype workspace for technical users.

## Start Here

- [Setup Guide]({{ '/docs/guides/SETUP_GUIDE' | relative_url }})
- [Docker Guide]({{ '/docs/guides/DOCKER' | relative_url }})
- [AI Models Guide]({{ '/docs/guides/ai-models' | relative_url }})
- [FAQ]({{ '/docs/guides/faq' | relative_url }})
- [Troubleshooting]({{ '/docs/guides/troubleshooting' | relative_url }})

---

## What BoltDIY Does

- chat-driven coding inside a browser IDE
- editor, terminal, file tree, and preview in one workspace
- multi-provider model support
- optional Supabase auth and synced chat history
- self-hosted and fork-friendly deployment model

## Good Fit

- technical founders
- indie hackers
- internal-tools builders
- people who want to bring their own model keys
- teams that want to self-host or fork the stack

## Not The Current Focus

- public galleries
- collaboration platform features
- built-in deployment automation
- broad no-code positioning

## Quick Start

```bash
git clone https://github.com/Stijnus/bolt.diy_V2.0.git
cd bolt.diy_V2.0
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:5173`.

## Need More Detail

- [Setup Guide]({{ '/docs/guides/SETUP_GUIDE' | relative_url }})
- [Codebase Readme]({{ '/CODEBASE_README' | relative_url }})
- [Self-Hosted BYO-Model Plan](https://github.com/Stijnus/bolt.diy_V2.0/blob/main/SELF_HOSTED_BYO_MODEL_PLAN.md)
