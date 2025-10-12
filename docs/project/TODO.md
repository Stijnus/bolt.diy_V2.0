# Multi-Model AI Support Implementation TODO

**Feature:** Add support for multiple AI providers and coding models
**Started:** 2025-10-05
**Status:** In Progress

---

## Phase 1: Core Provider Abstraction ✅ COMPLETED

### Dependencies ✅
- [x] Install @ai-sdk/openai
- [x] Install @ai-sdk/google
- [x] Install @ai-sdk/deepseek
- [x] Install @ai-sdk/mistral
- [x] Install @ai-sdk/xai

### Provider Configurations ✅
- [x] Create `app/lib/.server/llm/providers/types.ts` - Shared provider types
- [x] Create `app/lib/.server/llm/providers/anthropic.ts` - Claude Sonnet 4.5
- [x] Create `app/lib/.server/llm/providers/deepseek.ts` - DeepSeek V3.2
- [x] Create `app/lib/.server/llm/providers/google.ts` - Gemini 2.5 Pro
- [x] Create `app/lib/.server/llm/providers/openai.ts` - GPT-5, GPT-4.1, o3
- [x] Create `app/lib/.server/llm/providers/xai.ts` - Grok models
- [x] Create `app/lib/.server/llm/providers/mistral.ts` - Codestral
- [x] Create `app/lib/.server/llm/providers/index.ts` - Provider exports

### Core Infrastructure ✅
- [x] Create `app/lib/.server/llm/model-config.ts` - Model registry with metadata
- [x] Create `app/lib/.server/llm/provider-factory.ts` - Factory pattern for provider selection
- [x] Update `app/lib/.server/llm/model.ts` - Convert to multi-provider factory
- [x] Update `app/lib/.server/llm/stream-text.ts` - Accept dynamic model parameter
- [x] Update `app/lib/.server/llm/api-key.ts` - Support multiple API keys
- [x] Update `app/lib/.server/llm/constants.ts` - Add provider-specific constants

---

## Phase 2: UI Components ✅ COMPLETED

### Frontend Types ✅
- [x] Create `app/types/model.ts` - Frontend model types and interfaces
- [x] Create `app/lib/models.client.ts` - Client-side model registry

### State Management ✅
- [x] Create `app/lib/stores/model.ts` - Model selection state management
- [x] Update `app/lib/persistence/db.ts` - Store model preference per chat

### UI Components ✅
- [x] Create `app/components/chat/ModelSelector.tsx` - Model selection dropdown
- [x] Create `app/components/chat/ModelBadge.tsx` - Display current model
- [x] Update `app/components/chat/BaseChat.tsx` - Integrate model selector
- [x] Update `app/components/header/Header.tsx` - Show selected model in header

---

## Phase 3: API Integration ✅

### Environment Configuration ✅
- [x] Create .env.example file with all required variables
- [ ] Add OPENAI_API_KEY to .env.local (user setup)
- [ ] Add GOOGLE_API_KEY to .env.local (user setup)
- [ ] Add DEEPSEEK_API_KEY to .env.local (user setup)
- [ ] Add XAI_API_KEY to .env.local (user setup)
- [ ] Add MISTRAL_API_KEY to .env.local (user setup)
- [ ] Update wrangler.toml with new environment variables (not needed - uses .env)
- [x] Update TypeScript env types

### API Routes ✅
- [x] Update `app/routes/api.chat.ts` - Accept model parameter from request
- [x] Update `app/routes/api.enhancer.ts` - Support multi-model enhancement
- [x] Add error handling for missing API keys
- [x] Add fallback to default model on provider failure

### Testing 🔜 NEXT
- [ ] Test Anthropic Claude Sonnet 4.5 integration
- [ ] Test DeepSeek V3.2 integration
- [ ] Test Google Gemini 2.5 Pro integration
- [ ] Test OpenAI GPT-5 integration
- [ ] Test xAI Grok integration
- [ ] Test Mistral Codestral integration
- [ ] Test model switching during chat session
- [ ] Test persistence of model selection

---

## Phase 4: Cost Tracking (Optional)

### Core Tracking
- [ ] Create `app/lib/.server/llm/cost-calculator.ts` - Token cost calculation
- [ ] Create `app/lib/stores/usage.ts` - Usage tracking store
- [ ] Add token counting to stream responses
- [ ] Store usage data in IndexedDB

### UI Components
- [ ] Create `app/components/chat/UsageStats.tsx` - Display usage metrics
- [ ] Create `app/components/settings/UsageDashboard.tsx` - Detailed usage view
- [ ] Add cost indicators to model selector
- [ ] Add session cost display to chat interface

---

## Phase 5: Supabase Integration

### Database Schema
- [ ] Create migration for model_preferences table
- [ ] Create migration for usage_tracking table
- [ ] Add model field to chats table
- [ ] Add RLS policies for new tables

### Backend Integration
- [ ] Sync model preferences to Supabase
- [ ] Sync usage data to Supabase
- [ ] Load user preferences on login
- [ ] Add API endpoints for usage analytics

---

## Phase 6: Polish & Documentation

### Settings UI
- [ ] Add model preferences to settings page
- [ ] Add default model selector
- [ ] Add API key management UI
- [ ] Add usage limits configuration

### Documentation
- [ ] Update README with multi-model instructions
- [ ] Document environment variables
- [ ] Create provider setup guides
- [ ] Add troubleshooting guide

### Testing & Quality
- [ ] Run full typecheck
- [ ] Run linting
- [ ] Test all model providers end-to-end
- [ ] Test error scenarios (missing keys, rate limits)
- [ ] Performance testing with different models

---

## Implementation Notes

### Model IDs by Provider

**Anthropic:**
- `claude-sonnet-4-5-20250929` - Latest, best overall coding

**DeepSeek:**
- `deepseek-chat` - V3.2-Exp, latest with 50%+ cost reduction
- `deepseek-reasoner` - V3.2-Exp, thinking mode

**Google:**
- `gemini-2.5-ultra` - Enterprise flagship with 2M context
- `gemini-2.5-pro` - Web development specialist
- `gemini-2.5-flash` - Latency-optimized with multimodal support
- `gemma-3-27b` - High-performance with advanced reasoning
- `gemma-3-12b` - Efficient model for fast response
- `gemma-3-4b` - Lightweight model for simple tasks

**OpenAI:**
- `gpt-5` - Latest, best overall
- `gpt-4.1` - Coding specialist
- `o3` - Reasoning model

**xAI:**
- `grok-code-fast-1` - Fast agentic coding
- `grok-3` - General purpose

**Mistral:**
- `codestral-latest` - 80+ languages

### Default Model Strategy
- Keep `claude-sonnet-4-5-20250929` as default (backward compatible)
- Allow users to set per-project defaults
- Remember last used model per chat

### Cost Tracking Rates (per 1M tokens)
- Claude Sonnet 4.5: $3 input / $15 output
- DeepSeek V3.2-Exp: $0.028 input / $0.042 output (50%+ cheaper than V3.1)
- Gemini 2.5 Ultra: $3 input / $12 output
- Gemini 2.5 Pro: $2.2 input / $8.8 output
- Gemini 2.5 Flash: $0.12 input / $0.45 output
- Gemma 3 27B: $0.8 input / $0.8 output
- Gemma 3 12B: $0.25 input / $0.25 output
- Gemma 3 4B: $0.08 input / $0.08 output
- GPT-5: $3-15 (varies by model)
- Grok Code Fast: $0.20 input / $1.50 output
- Codestral: Low cost

---

## Completion Checklist

- [ ] All providers integrated and tested
- [ ] UI components complete and functional
- [x] Model selection persists across sessions
- [ ] Cost tracking implemented
- [ ] Documentation updated
- [ ] TypeScript types complete
- [ ] All tests passing
- [ ] Performance validated
- [ ] Ready for production deployment

---

**Last Updated:** 2025-10-06
