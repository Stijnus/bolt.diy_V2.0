# ADR: Custom AI Endpoint Support

**Date:** 2025-10-13  
**Status:** Proposed

## Context
- Current provider factory in `app/lib/.server/llm/provider-factory.ts` only supports hard-coded vendors (`anthropic`, `openai`, `google`, `deepseek`, `xai`, `mistral`, `zai`, `groq`).  
- Users require connecting self-hosted inference (e.g., Ollama, LM Studio) or enterprise proxies.  
- Roadmap item 1.1 calls for "Custom model endpoint support" to unlock broader adoption.

## Decision
- Introduce a `custom` provider pipeline allowing users to define arbitrary REST-compatible model endpoints through UI configuration.  
- Store custom endpoint definitions (base URL, auth headers, supported models, optional pricing info) in IndexedDB via `settingsStore` and sync with server through encrypted KV when signed in.  
- Extend `provider-factory.ts` to build `LanguageModel` instances using a generic HTTP adapter that respects user-provided schema.  
- Update `app/lib/models.client.ts` and `ProviderModelSelector` to merge dynamic custom models into the list shown in chat, with clear labeling.

## Implementation Notes
- Validation: ensure HTTPS, enforce rate limits, sanitize headers.  
- Adapter: wrap fetch with retry/backoff, map to AI SDK interface (streaming and json) so existing `streamText` flow works.  
- UI: add section to `app/components/settings/tabs/AIAssistantTab.tsx` for managing endpoints (list, add, edit, remove).  
- Persistence: augment `app/lib/persistence/db.ts` with new object store `custom_providers` keyed by user/project; include migration logic.  
- Testing: mock a local endpoint to verify streaming and error handling.

## Consequences
- Unlocks local/offline usage scenarios, aiding competitive differentiation.  
- Slightly increases security surface—must guard against malicious endpoints (suggest warning + optional CSP).  
- Requires additional QA to ensure custom providers don’t break global defaults; fallback to built-in providers remains intact.
