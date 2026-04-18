# Self-Hosted BYO-Model Plan

This document is an execution plan plus historical cleanup record. Some sections reference files or docs that were removed during Phase 1 and Phase 2 so the completed cleanup work stays visible.

## Decision

Continue development only as:

- a self-hosted
- privacy-first
- bring-your-own-model
- browser-based prototype workspace

Do not continue as:

- a general AI app builder
- a Replit/Lovable/v0/Firebase Studio clone
- a broad collaboration/deployment platform

## Product Thesis

This codebase is strongest when it acts as:

> A browser IDE for technical users who want to prototype quickly with their own LLM provider keys, keep control of their setup, and iterate in chat with live preview, file editing, and terminal access.

That is the lane the current architecture actually supports.

## Target User

Primary:

- technical founders
- indie hackers
- internal tools engineers
- small teams who want control over API keys and hosting
- open-source users who prefer self-hosting over closed SaaS

Not primary:

- non-technical users expecting zero setup
- enterprise teams expecting mature RBAC/compliance/collaboration
- users looking for polished production deployment out of the box

## Product Promise

The new promise should be:

> Prompt, inspect, edit, and run prototypes locally in a browser IDE, using the model providers you choose.

## Product Principles

1. Local/self-hosted first
2. BYO provider keys first
3. Prototype reliability over platform breadth
4. Technical users over mass-market users
5. Fast iteration over “enterprise completeness”
6. Fewer features, clearer workflow

## What The Product Should Do Well

- let a user choose a model/provider
- chat with the model about a prototype
- turn model output into file and shell actions
- show files, terminal, and preview in one place
- preserve chats locally and optionally sync them
- support frontend-heavy and internal-tool workflows

## What The Product Should Stop Pretending To Be

- a full collaboration suite
- a mature project management platform
- a one-click production deployment system
- a “build any app for anyone” product
- a broad public project gallery ecosystem

## Keep, Remove, Refactor

### Keep

These are core to the new direction and should remain the foundation:

- `app/routes/_index.tsx`
- `app/routes/chat.$id.tsx`
- `app/routes/api.chat.ts`
- `app/routes/api.enhancer.ts`
- `app/lib/.server/llm/*`
- `app/lib/runtime/*`
- `app/lib/stores/workbench.ts`
- `app/lib/stores/files.ts`
- `app/lib/stores/editor.ts`
- `app/lib/stores/terminal.ts`
- `app/lib/stores/previews.ts`
- `app/lib/stores/model.ts`
- `app/lib/persistence/*`
- `app/lib/webcontainer/*`
- `app/components/chat/*`
- `app/components/workbench/*`
- `app/components/editor/*`
- `app/components/sidebar/*` with product copy simplified
- `app/components/header/*`
- `app/components/auth/*` with product copy simplified
- `app/routes/auth.callback.tsx`
- Docker support and local setup docs
- Supabase auth and chat sync, if kept narrow

Why:

- this is the actual differentiator set
- it supports the self-hosted BYO-model prototype workflow
- it is the most mature part of the repo

### Keep But Simplify

- `app/routes/settings.tsx`
- `app/components/settings/*`
- `app/lib/stores/settings.ts`
- `app/components/migration/MigrationBanner.tsx`
- `app/components/settings/MigrationSettings.tsx`
- `app/lib/migration/migrate-to-supabase.ts`
- `app/routes/api.supabase-test.ts`

Why:

- settings are useful for technical users
- migration remains useful during transition
- but these should stop implying a giant platform roadmap

Simplify to:

- editor preferences
- AI/model preferences
- connection status
- migration/import tools
- advanced/self-hosting/provider help

### Deprioritize Immediately

These do not support the new niche strongly enough to justify active investment now:

- project management surface
- collaboration claims
- public/private project visibility features
- project collaborator logic
- Cloudflare Pages as the core product story
- release/deploy automation narratives
- “deploy in one click” messaging

### Remove From Active Product Surface First

These should be hidden or removed from the user-facing product before deeper code deletion:

- `app/routes/projects.tsx`
- `app/components/projects/*`
- `app/lib/services/projects.ts`
- links to `/projects` in:
  - `app/components/sidebar/Menu.client.tsx`
  - `app/components/auth/UserMenu.tsx`
- collaboration/project-sync language in:
  - `app/components/auth/LoginModal.tsx`
  - `app/components/sidebar/UserPanel.tsx`
  - `README.md`
  - docs landing pages

Why:

- these features increase surface area
- they suggest a broader product than the code truly supports
- the projects layer is not the strongest path in the current repo

### Remove Or Archive From Docs

These documents create the wrong expectation or are stale:

- `docs/project/*`
- `docs/technical/CURRENT_ARCHITECTURE.md`
- `docs/technical/GITHUB_PAGES_SETUP.md`
- `docs/DOCUMENTATION_RESTRUCTURE.md`
- broad platform/deployment/collaboration language in:
  - `README.md`
  - `docs/index.md`
  - `docs/README.md`

Action:

- archive or delete roadmap-heavy docs that no longer match strategy
- replace with a smaller doc set:
  - what the product is
  - local/self-hosted setup
  - provider configuration
  - known limitations
  - technical architecture

### Remove Later, Not First

These should be removed only after the UI/product surface is cleaned and you are sure the new scope will stick:

- `projects` and `project_collaborators` tables from `scripts/schema.sql`
- project-related generated types in `app/lib/supabase/*.types.ts`
- collaborator-related service code entirely

Why:

- database schema removal is more disruptive
- first hide and stop investing in the feature
- then remove data model complexity after the new direction is stable

## Recommended Cleanup Strategy

Use a two-stage cleanup.

### Stage 1: Product Surface Cleanup

Goal:

- remove misleading product surface without risky architectural changes

Tasks:

1. Remove the Projects page from navigation and menus
2. Remove project/collaboration messaging from auth/sidebar/marketing copy
3. Rewrite homepage hero and README around self-hosted BYO-model prototyping
4. Trim settings page copy so it stops promising unbuilt features
5. Archive stale roadmap docs
6. Add one clear architecture document for the new positioning

Success result:

- the product looks like what it really is

### Stage 2: Codebase Simplification

Goal:

- reduce maintenance burden and dead scope

Tasks:

1. Remove `app/components/projects/*`
2. Remove `app/routes/projects.tsx`
3. Remove `app/lib/services/projects.ts`
4. Remove project links and references from the app shell
5. Decide whether to keep project tables for compatibility or delete them
6. If deleting:
   - update `scripts/schema.sql`
   - update generated Supabase types
   - remove collaborator logic entirely

Success result:

- smaller codebase
- fewer product claims
- cleaner foundation for the real niche

## What To Keep As Strategic Differentiators

If you keep building, these are the best candidates for differentiation:

### 1. Multi-model provider support

Lean harder into:

- Anthropic
- OpenAI
- Google
- DeepSeek
- xAI
- Mistral

Reason:

- this is already implemented
- it aligns with the BYO-model positioning
- many hosted products do not make model choice their main value

### 2. Browser IDE loop

Keep strengthening:

- chat
- file tree
- editor
- terminal
- live preview

Reason:

- this is the main experiential value
- it is the clearest reason to use the product instead of a plain CLI agent

### 3. Local-first persistence

Keep:

- IndexedDB chat history
- optional Supabase sync

Reason:

- strong fit for prototype workflows
- useful for self-hosted and privacy-conscious users

### 4. Technical-user setup

Keep and improve:

- Docker
- local setup
- env-driven provider configuration

Reason:

- this matches the actual audience
- it is more realistic than promising no-code simplicity

## What To Stop Building For Now

- collaboration
- shared projects
- public project discovery/gallery
- enterprise workflows
- automated releases/deployments as a product feature
- broad roadmap epics like templates, public publishing, project analytics, social previews

If a feature does not directly improve:

- prompting
- editing
- running
- previewing
- saving
- model choice

then it should probably wait.

## 30-Day Execution Plan

### Week 1: Scope Reset

- rewrite `README.md` to match the new product
- remove project/collaboration language from app copy
- archive stale docs
- add a concise architecture/setup doc for the new direction

### Week 2: Product Surface Cleanup

- remove Projects UI from navigation
- hide/remove `/projects`
- simplify settings and migration copy
- simplify login/signup messaging

### Week 3: Core Reliability

- fix docs drift between code and documentation
- audit model metadata duplication between server and client
- reduce “coming soon” settings or wire them properly
- review security/dependency state

### Week 4: Differentiator Sharpening

- improve model chooser UX
- add a clean “compare models on the same workflow” story
- document supported prototype workflows:
  - dashboard
  - CRUD app
  - internal tool
  - Supabase-backed prototype

## 60-Day Plan

- remove unused project management code if still out of scope
- decide whether Supabase remains optional sync or a required auth layer
- improve Docker/self-host experience
- stabilize one “golden path” demo flow

Golden path:

- user starts locally
- adds provider keys
- prompts for an internal tool
- model generates files and commands
- preview launches
- chat saves locally

## 90-Day Success Criteria

Continue only if all of these become true:

- product message is clear in under 10 seconds
- local/self-hosted setup is reliable
- one prototype workflow feels good end-to-end
- model choice is a real advantage, not just a settings checkbox
- the codebase is visibly smaller and easier to reason about

If not, stop investing.

## Concrete File-Level Recommendations

### Remove or hide first

- `app/routes/projects.tsx`
- `app/components/projects/CreateProjectDialog.tsx`
- `app/components/projects/EditProjectDialog.tsx`
- `app/components/projects/ProjectsList.tsx`
- `app/lib/services/projects.ts`

### Rewrite copy in place

- `README.md`
- `app/routes/_index.tsx`
- `app/components/chat/BaseChat.tsx`
- `app/components/auth/LoginModal.tsx`
- `app/components/sidebar/UserPanel.tsx`
- `app/components/sidebar/Menu.client.tsx`
- `app/components/auth/UserMenu.tsx`
- `docs/index.md`
- `docs/README.md`

### Archive or delete docs

- `docs/project/CONTRIBUTING.md` only keep if still useful
- `docs/project/FEATURE_ROADMAP.md`
- `docs/project/PROJECT_MANAGEMENT.md`
- `docs/project/QUICK_WINS_PLAN.md`
- `docs/project/SPRINT_CURRENT.md`
- `docs/project/TODO.md`
- `docs/technical/CURRENT_ARCHITECTURE.md`
- `docs/technical/GITHUB_PAGES_SETUP.md`

### Keep and strengthen

- `app/lib/.server/llm/*`
- `app/lib/runtime/*`
- `app/lib/stores/workbench.ts`
- `app/lib/stores/files.ts`
- `app/lib/stores/model.ts`
- `app/lib/persistence/*`
- `app/components/chat/*`
- `app/components/workbench/*`
- `app/lib/webcontainer/*`

## Suggested New Minimal Doc Set

- `README.md`
  - what it is
  - who it is for
  - how to run locally
  - provider setup
  - limitations

- `CODEBASE_README.md`
  - architecture and codebase overview

- `SELF_HOSTED_BYO_MODEL_PLAN.md`
  - strategy and cleanup memo

- `docs/guides/SETUP_GUIDE.md`
  - exact local/self-host steps

- `docs/guides/DOCKER.md`
  - Docker self-hosting only

## Final Recommendation

Proceed only if you are willing to:

- cut the projects/collaboration/platform story
- simplify the codebase around the core prototype loop
- make self-hosted and BYO-model the center of the product

If you are not willing to narrow that aggressively, abandon the project rather than continue diffusing effort.
