# Quick Wins Implementation Plan

**Sprint Duration:** 2-3 weeks per feature  
**Team Size Assumption:** 1-2 developers  
**Goal:** Ship high-impact features with minimal complexity

---

## Feature 1: Multi-Model AI Support 🎯

**Priority:** #1 - Highest Impact  
**Effort:** Low-Medium (3-5 days)  
**Dependencies:** None

### Overview
Allow users to choose between different AI models (OpenAI GPT-4, GPT-4o, Claude 3.5, etc.) instead of being locked to Claude Sonnet 3.5.

### Technical Approach

#### Phase 1: Foundation (Day 1-2)
1. **Update AI SDK configuration**
   - File: `app/lib/.server/llm/model.ts`
   - Add OpenAI provider alongside Anthropic
   - Create provider factory pattern

2. **Environment variables**
   - Update `.env.local` to support multiple API keys
   ```
   ANTHROPIC_API_KEY=xxx
   OPENAI_API_KEY=xxx
   GOOGLE_API_KEY=xxx (optional)
   ```

3. **Model configuration**
   - File: `app/lib/.server/llm/constants.ts`
   - Define available models with metadata (cost, context window, capabilities)

#### Phase 2: Backend (Day 2-3)
1. **Create provider abstraction**
   ```typescript
   // app/lib/.server/llm/providers/index.ts
   export type AIProvider = 'anthropic' | 'openai' | 'google';
   export type AIModel = {
     id: string;
     provider: AIProvider;
     name: string;
     maxTokens: number;
     costPer1kTokens: { input: number; output: number };
   };
   ```

2. **Update stream handler**
   - File: `app/lib/.server/llm/stream-text.ts`
   - Support model selection parameter
   - Handle provider-specific configurations

3. **API endpoint updates**
   - File: `app/routes/api.chat.ts`
   - Accept `model` parameter from request
   - Validate model availability

#### Phase 3: Frontend (Day 3-4)
1. **Model selector UI component**
   ```tsx
   // app/components/chat/ModelSelector.tsx
   // Dropdown with model logos, names, and descriptions
   ```

2. **Store model preference**
   - File: `app/lib/stores/settings.ts`
   - Add `selectedModel` to settings store
   - Persist to localStorage

3. **Update chat interface**
   - File: `app/components/chat/BaseChat.tsx`
   - Add model selector to header/settings
   - Display current model in use

#### Phase 4: Testing & Polish (Day 4-5)
1. Test all providers work correctly
2. Add cost estimation display
3. Handle API key missing scenarios
4. Add model switching mid-conversation

### Files to Create
```
app/lib/.server/llm/providers/
  ├── index.ts
  ├── anthropic.ts
  ├── openai.ts
  └── google.ts (optional)

app/components/chat/
  └── ModelSelector.tsx

app/components/settings/
  └── AISettings.tsx
```

### Files to Modify
```
app/lib/.server/llm/model.ts
app/lib/.server/llm/stream-text.ts
app/lib/.server/llm/constants.ts
app/lib/stores/settings.ts
app/routes/api.chat.ts
app/components/chat/BaseChat.tsx
```

### Testing Checklist
- [ ] Can switch between models
- [ ] API keys validated properly
- [ ] Error handling for missing keys
- [ ] Streaming works for all providers
- [ ] Model preference persists
- [ ] Cost estimation accurate

---

## Feature 2: Enhanced Terminal with Tabs 🖥️

**Priority:** #2  
**Effort:** Low (2-3 days)  
**Dependencies:** None

### Overview
Add multiple terminal tabs/splits to allow running multiple processes simultaneously.

### Technical Approach

#### Phase 1: Terminal Session Management (Day 1)
1. **Update terminal store**
   - File: `app/lib/stores/terminal.ts`
   - Change from single terminal to multiple sessions
   ```typescript
   type TerminalSession = {
     id: string;
     title: string;
     xterm: Terminal;
     process: WebContainer process;
   };
   ```

2. **Session lifecycle management**
   - Create new session
   - Close session
   - Switch active session

#### Phase 2: UI Components (Day 2)
1. **Terminal tabs component**
   ```tsx
   // app/components/workbench/TerminalTabs.tsx
   // Horizontal tab bar above terminal
   ```

2. **New terminal button**
   - Add "+" button to create new tab
   - Context menu for terminal operations

3. **Update Workbench layout**
   - File: `app/components/workbench/Workbench.client.tsx`
   - Integrate terminal tabs

#### Phase 3: Features (Day 2-3)
1. **Tab management**
   - Rename tabs
   - Close tabs (with confirmation)
   - Reorder tabs (drag & drop)

2. **Keyboard shortcuts**
   - `Cmd+T`: New terminal
   - `Cmd+W`: Close terminal
   - `Cmd+1-9`: Switch to terminal N

3. **Terminal splitting (optional)**
   - Horizontal/vertical splits
   - Resizable panes

#### Phase 4: Polish (Day 3)
1. Terminal state persistence
2. Restore tabs on page reload
3. Active process indicators
4. Terminal titles auto-update based on running command

### Files to Create
```
app/components/workbench/
  ├── TerminalTabs.tsx
  └── TerminalTabBar.tsx
```

### Files to Modify
```
app/lib/stores/terminal.ts
app/components/workbench/Workbench.client.tsx
app/lib/hooks/useShortcuts.ts
```

### Testing Checklist
- [ ] Can create multiple terminals
- [ ] Tabs switch correctly
- [ ] Terminals persist on reload
- [ ] Keyboard shortcuts work
- [ ] Can close terminals safely
- [ ] Running processes indicated

---

## Feature 3: Project Templates & Starters 🚀

**Priority:** #3  
**Effort:** Medium (4-6 days)  
**Dependencies:** None

### Overview
Provide pre-built templates for popular frameworks so users can start projects instantly.

### Technical Approach

#### Phase 1: Template System (Day 1-2)
1. **Template definition schema**
   ```typescript
   // app/lib/templates/types.ts
   interface ProjectTemplate {
     id: string;
     name: string;
     description: string;
     framework: string;
     tags: string[];
     icon: string;
     files: Record<string, string>; // path -> content
     dependencies: Record<string, string>;
     scripts: Record<string, string>;
     commands: string[]; // post-creation commands
   }
   ```

2. **Create template definitions**
   ```
   app/lib/templates/
     ├── index.ts
     ├── types.ts
     └── definitions/
         ├── react-vite.ts
         ├── nextjs.ts
         ├── astro.ts
         ├── vue.ts
         ├── svelte.ts
         └── express.ts
   ```

#### Phase 2: Template UI (Day 3-4)
1. **Template gallery component**
   ```tsx
   // app/components/templates/TemplateGallery.tsx
   // Grid of template cards with preview images
   ```

2. **Template selection flow**
   - Show templates on initial load (before first chat)
   - "Start with template" button in empty state
   - Search and filter templates

3. **Template preview**
   - Show file structure
   - Display README
   - Preview dependencies

#### Phase 3: Template Instantiation (Day 4-5)
1. **WebContainer integration**
   - File: `app/lib/webcontainer/template-loader.ts`
   - Load template into WebContainer
   - Install dependencies
   - Run initial build

2. **AI context injection**
   - When template selected, inject into system prompt
   - "User started with [Template Name] template"
   - AI understands project structure

#### Phase 4: Content Creation (Day 5-6)
1. **Create 8-10 high-quality templates**
   - React + Vite + Tailwind
   - Next.js 14 App Router
   - Astro + MDX
   - Vue 3 + Vite
   - Svelte + SvelteKit
   - Express + TypeScript
   - Node.js REST API
   - Static HTML/CSS/JS

2. **Template documentation**
   - README for each template
   - Usage instructions
   - Customization guide

### Files to Create
```
app/lib/templates/
  ├── index.ts
  ├── types.ts
  ├── template-loader.ts
  └── definitions/
      ├── react-vite.ts
      ├── nextjs.ts
      ├── astro.ts
      ├── vue.ts
      ├── svelte.ts
      ├── express.ts
      ├── nodejs-api.ts
      └── static-site.ts

app/components/templates/
  ├── TemplateGallery.tsx
  ├── TemplateCard.tsx
  └── TemplatePreview.tsx

app/routes/
  └── templates._index.tsx (optional dedicated page)
```

### Files to Modify
```
app/routes/_index.tsx (add template selection)
app/components/chat/Chat.client.tsx (template integration)
app/lib/.server/llm/prompts.ts (add template context)
```

### Testing Checklist
- [ ] Templates load correctly in WebContainer
- [ ] Dependencies install successfully
- [ ] Dev servers start properly
- [ ] AI understands template context
- [ ] Search and filtering work
- [ ] Template preview accurate

---

## Feature 4: Prompt Library 💡

**Priority:** #4  
**Effort:** Low-Medium (3-4 days)  
**Dependencies:** None

### Overview
Pre-built prompt templates for common tasks to improve user productivity.

### Technical Approach

#### Phase 1: Prompt System (Day 1)
1. **Prompt template schema**
   ```typescript
   // app/lib/prompts/types.ts
   interface PromptTemplate {
     id: string;
     title: string;
     description: string;
     category: string;
     prompt: string;
     variables?: Array<{
       name: string;
       label: string;
       type: 'text' | 'select';
       options?: string[];
     }>;
     icon: string;
   }
   ```

2. **Create prompt definitions**
   - Categories: Debug, Optimize, Refactor, Test, Document, Feature
   - 20-30 common prompts

#### Phase 2: UI Components (Day 2)
1. **Prompt picker component**
   ```tsx
   // app/components/chat/PromptLibrary.tsx
   // Modal/sidebar with searchable prompts
   ```

2. **Quick access button**
   - Add button next to chat input
   - Keyboard shortcut: `Cmd+/`

3. **Variable input form**
   - Dynamic form for prompt variables
   - Preview final prompt

#### Phase 3: Prompt Definitions (Day 2-3)
Create prompts for:
```
Debug:
- "Find and fix the bug causing [error]"
- "Debug why [feature] isn't working"
- "Add error handling to [function]"

Optimize:
- "Optimize performance of [component]"
- "Reduce bundle size"
- "Improve loading time"

Refactor:
- "Refactor [file] to use [pattern]"
- "Extract [code] into reusable component"
- "Convert to TypeScript"

Test:
- "Generate unit tests for [function]"
- "Add E2E tests for [flow]"
- "Write test coverage for [component]"

Document:
- "Add JSDoc comments to [file]"
- "Generate README"
- "Create API documentation"

Feature:
- "Add [feature] to the project"
- "Implement [UI component]"
- "Create [API endpoint]"
```

#### Phase 4: Personalization (Day 3-4)
1. **Custom prompts**
   - Allow users to save their own prompts
   - Edit existing prompts
   - Share prompts (future)

2. **Prompt history**
   - Track most used prompts
   - Suggest relevant prompts based on context

### Files to Create
```
app/lib/prompts/
  ├── index.ts
  ├── types.ts
  └── definitions/
      ├── debug.ts
      ├── optimize.ts
      ├── refactor.ts
      ├── test.ts
      ├── document.ts
      └── feature.ts

app/components/chat/
  ├── PromptLibrary.tsx
  ├── PromptCard.tsx
  └── PromptVariableForm.tsx
```

### Files to Modify
```
app/components/chat/BaseChat.tsx
app/lib/stores/settings.ts (save custom prompts)
app/lib/hooks/useShortcuts.ts
```

### Testing Checklist
- [ ] Prompt library opens correctly
- [ ] Variables populate properly
- [ ] Custom prompts save/load
- [ ] Search filtering works
- [ ] Keyboard shortcut functional

---

## Feature 5: Project Export 📦

**Priority:** #5  
**Effort:** Low (2-3 days)  
**Dependencies:** None

### Overview
Allow users to export their entire project as a ZIP file for local development.

### Technical Approach

#### Phase 1: Export Logic (Day 1)
1. **File collection**
   ```typescript
   // app/lib/export/project-exporter.ts
   - Recursively read all files from WebContainer
   - Exclude node_modules, .bolt, build artifacts
   - Preserve directory structure
   ```

2. **ZIP generation**
   - Use JSZip library
   - Compress files
   - Include metadata (README with instructions)

#### Phase 2: UI Integration (Day 1-2)
1. **Export button**
   - File: `app/components/header/HeaderActionButtons.client.tsx`
   - Add "Export Project" button
   - Show progress indicator

2. **Export options modal**
   ```tsx
   // app/components/export/ExportDialog.tsx
   Options:
   - [ ] Include node_modules
   - [ ] Include git history (future)
   - [ ] Add setup instructions
   Format: ZIP / tar.gz
   ```

3. **Download handler**
   - Trigger browser download
   - Show success notification

#### Phase 3: Export Enhancements (Day 2-3)
1. **README generation**
   - Auto-generate README.md with:
     - Project description
     - Installation steps
     - Available scripts
     - Environment variables needed

2. **Git initialization**
   - Create .gitignore
   - Initialize basic git structure (future: with history)

3. **Export to GitHub** (optional)
   - Connect GitHub account
   - Create repository
   - Push code directly

### Files to Create
```
app/lib/export/
  ├── project-exporter.ts
  ├── readme-generator.ts
  └── types.ts

app/components/export/
  ├── ExportDialog.tsx
  └── ExportButton.tsx
```

### Files to Modify
```
app/components/header/HeaderActionButtons.client.tsx
package.json (add JSZip dependency)
```

### Testing Checklist
- [ ] ZIP downloads correctly
- [ ] All files included
- [ ] Directory structure preserved
- [ ] README generated properly
- [ ] Exclude patterns work
- [ ] Large projects export successfully

---

## Implementation Order & Timeline

### Week 1-2: Foundation
- ✅ Feature 5: Project Export (2-3 days)
- ✅ Feature 4: Prompt Library (3-4 days)
- ✅ Feature 2: Enhanced Terminal (2-3 days)

### Week 3-4: Core Features
- ✅ Feature 1: Multi-Model AI (3-5 days)
- ✅ Feature 3: Project Templates (4-6 days)

### Total Timeline: 3-4 weeks for all 5 Quick Wins

---

## Development Workflow

### Before Starting Each Feature
1. Create feature branch: `feature/multi-model-ai`
2. Review implementation plan
3. Set up environment/dependencies
4. Create placeholder components

### During Development
1. Follow TDD where applicable
2. Commit frequently with clear messages
3. Test in development mode continuously
4. Update documentation as you go

### Before Merging
1. Run full test suite: `pnpm test`
2. Check types: `pnpm run typecheck`
3. Lint code: `pnpm run lint:fix`
4. Test production build: `pnpm run preview`
5. Create PR with screenshots/videos
6. Get code review

### After Merging
1. Update FEATURE_ROADMAP.md status
2. Deploy to staging
3. Monitor error tracking
4. Gather user feedback

---

## Success Metrics

### Feature 1: Multi-Model AI
- [ ] 3+ models available
- [ ] <100ms model switching time
- [ ] API key validation working
- [ ] Cost display accurate

### Feature 2: Enhanced Terminal
- [ ] Support 5+ concurrent terminals
- [ ] Zero terminal state loss on refresh
- [ ] All keyboard shortcuts work
- [ ] <50ms tab switching

### Feature 3: Project Templates
- [ ] 8+ templates available
- [ ] <5s template instantiation
- [ ] 100% dependency install success rate
- [ ] Templates work in production

### Feature 4: Prompt Library
- [ ] 20+ prompts available
- [ ] Custom prompts save/load
- [ ] <200ms prompt insertion
- [ ] Search returns results <100ms

### Feature 5: Project Export
- [ ] Export works for projects up to 100MB
- [ ] ZIP downloads successfully
- [ ] Exported projects run locally
- [ ] README generation accurate

---

## Resources Needed

### Dependencies to Add
```json
{
  "dependencies": {
    "@ai-sdk/openai": "^1.0.0",
    "@ai-sdk/google": "^1.0.0",
    "jszip": "^3.10.1"
  }
}
```

### Design Assets
- Model provider logos (OpenAI, Anthropic, Google)
- Template preview images
- Category icons
- Export/download icons

### API Keys Required
- OpenAI API key (for testing)
- Google AI API key (optional)
- GitHub OAuth app (for GitHub export)

---

## Risk Mitigation

### Technical Risks
1. **Multi-model streaming compatibility**
   - Mitigation: Use AI SDK's unified streaming API
   - Fallback: Provider-specific handlers

2. **WebContainer template loading performance**
   - Mitigation: Lazy load templates, cache common ones
   - Fallback: Show loading states

3. **Large project export memory issues**
   - Mitigation: Stream files to ZIP, don't load all in memory
   - Fallback: Paginated export for huge projects

### User Experience Risks
1. **Model switching mid-conversation confusion**
   - Mitigation: Clear indicators, confirmation dialog
   - Document: Explain context limitations

2. **Too many terminal tabs**
   - Mitigation: Limit to 10 tabs, show warning
   - Auto-close: Inactive terminals after 1 hour

---

## Next Steps After Quick Wins

Once these 5 features are complete, move to:
1. **Git Integration** (Major Initiative)
2. **Context-Aware AI with @-mentions** (High Impact)
3. **Import from GitHub** (High Demand)
4. **Split Editor** (Developer Experience)

Would you like me to create detailed implementation plans for these next?
