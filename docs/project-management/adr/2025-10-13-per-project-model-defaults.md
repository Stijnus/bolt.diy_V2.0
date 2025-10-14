# ADR: Per-Project AI Model Defaults

**Date:** 2025-10-13  
**Status:** Proposed

## Context
- `app/components/chat/ProviderModelSelector.tsx` currently stores model choice per chat via `chatModels` in `app/lib/stores/model.ts`.  
- Global defaults live in `settingsStore` (`app/lib/stores/settings.ts`) and persist through IndexedDB, but there is no project-level override.  
- Team needs consistent model behavior per project (e.g., frontend vs. backend repos) and alignment with roadmap item 1.1.

## Decision
- Introduce a project-aware default model preference keyed by `projectId` (derived from workspace slug) stored in IndexedDB via `app/lib/persistence/db.ts`.  
- Extend `settingsStore` to expose `projectDefaults[projectId]` containing `defaultModel` and `planModel`.  
- Update `ProviderModelSelector` to initialize from project defaults when opening a new chat and fall back to chat-level overrides once selected.  
- Add editable controls in `app/components/settings/tabs/AIAssistantTab.tsx` to manage per-project defaults, visible when a project context is available.

## Implementation Notes
- Persist project metadata alongside chats (augment records written in `setMessages` and new helper for project settings).  
- Provide helper selectors: `getProjectDefaultModel(projectId)` and `setProjectDefaultModel(projectId, selection)` in `app/lib/stores/model.ts`.  
- Ensure hydration logic handles guests and signed-in users uniformly; fall back to global defaults if project data missing.  
- UI copy should clarify precedence: project default → chat override.

## Consequences
- Enables roadmap progress without breaking existing behaviour; legacy chats continue using stored `fullId`.  
- Requires migration logic to avoid bloating IndexedDB—purge orphaned project entries during cleanup.  
- Adds minimal complexity to settings UI but provides clear value for multi-project users.
