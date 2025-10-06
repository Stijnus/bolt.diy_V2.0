# Bolt.new Feature Roadmap 2025

**Last Updated:** January 2025  
**Current Version:** Beta  
**Document Purpose:** Strategic feature additions to compete with modern AI development platforms

---

## 🎯 Executive Summary

This roadmap outlines feature enhancements to position Bolt.new competitively with tools like Cursor, GitHub Copilot Workspace, Replit Agent, v0.dev, and Lovable.dev. Features are prioritized by impact, feasibility, and user demand.

---

## 🚀 Priority 1: Core Development Experience

### 1.1 Multi-Model AI Support
**Status:** 🔴 Not Implemented  
**Competitor Feature:** Cursor, Cline, Continue.dev  
**Impact:** High

**Features:**
- [ ] Multiple LLM provider support (OpenAI, Gemini, Mistral, local models)
- [ ] Model selection dropdown in chat interface
- [ ] Per-project model configuration
- [ ] Cost tracking per model/session
- [ ] Custom model endpoint support (Ollama, LM Studio)

**Technical Notes:**
- Extend `app/lib/.server/llm/model.ts` to support multiple providers
- Add provider abstraction layer using AI SDK's multi-provider support
- Update UI with model selector component

---

### 1.2 Advanced Code Intelligence
**Status:** 🔴 Not Implemented  
**Competitor Feature:** Cursor, GitHub Copilot  
**Impact:** High

**Features:**
- [ ] Multi-file code context awareness
- [ ] Semantic code search across project
- [ ] Symbol/reference navigation
- [ ] Code refactoring suggestions
- [ ] Automatic import management
- [ ] Code folding and minimap in editor

**Technical Notes:**
- Integrate language servers (LSP) in WebContainer
- Enhance CodeMirror with LSP client
- Add AST parsing for better code understanding

---

### 1.3 Git Integration
**Status:** 🔴 Not Implemented (Git unavailable in WebContainer)  
**Competitor Feature:** All major IDEs  
**Impact:** Very High

**Features:**
- [ ] Local git repository simulation in WebContainer
- [ ] Commit history and diff viewer
- [ ] Branch management UI
- [ ] GitHub/GitLab integration for push/pull
- [ ] Visual merge conflict resolution
- [ ] Git blame annotations
- [ ] Export project to GitHub repository

**Technical Notes:**
- Implement isomorphic-git or custom VCS layer
- Create git operations panel in workbench
- Add GitHub API integration for remote operations
- Store git metadata in IndexedDB

---

### 1.4 Enhanced Terminal
**Status:** 🟡 Basic Implementation  
**Competitor Feature:** VS Code, Cursor  
**Impact:** Medium

**Features:**
- [ ] Multiple terminal tabs/splits
- [ ] Terminal command history persistence
- [ ] Custom shell configurations
- [ ] Terminal search functionality
- [ ] Copy/paste improvements
- [ ] Terminal themes

**Technical Notes:**
- Extend xterm.js configuration in `app/lib/stores/terminal.ts`
- Add terminal session management
- Implement terminal multiplexing

---

## 🎨 Priority 2: UI/UX Enhancements

### 2.1 Advanced Editor Features
**Status:** 🟡 Basic Implementation  
**Impact:** High

**Features:**
- [ ] Split editor (horizontal/vertical)
- [ ] Side-by-side diff view
- [ ] Multi-cursor editing
- [ ] Snippets library
- [ ] Command palette (Cmd+K)
- [ ] Vim/Emacs keybinding modes
- [ ] Collaborative cursor indicators (for future multiplayer)

**Technical Notes:**
- Enhance `app/components/workbench/EditorPanel.tsx`
- Add CodeMirror extensions for advanced features
- Implement command palette similar to VS Code

---

### 2.2 Project Templates & Starters
**Status:** 🔴 Not Implemented  
**Competitor Feature:** Replit, StackBlitz, v0.dev  
**Impact:** High

**Features:**
- [ ] Curated starter templates (React, Next.js, Astro, Vue, etc.)
- [ ] Framework-specific scaffolding
- [ ] One-click template deployment
- [ ] Community template marketplace
- [ ] Template versioning
- [ ] Custom project templates

**Technical Notes:**
- Create template registry system
- Add template selection UI to initial chat
- Implement template instantiation in WebContainer

---

### 2.3 Enhanced Preview System
**Status:** 🟡 Basic Implementation  
**Impact:** Medium

**Features:**
- [ ] Mobile/tablet/desktop responsive preview
- [ ] Device frame simulator
- [ ] Multiple preview ports simultaneously
- [ ] Preview in new window/tab
- [ ] Preview recording/screenshots
- [ ] Network throttling simulation
- [ ] Console log viewer in preview

**Technical Notes:**
- Extend `app/components/workbench/Preview.tsx`
- Add responsive viewport controls
- Implement iframe device emulation

---

### 2.4 Theming & Customization
**Status:** 🟡 Basic Theme Toggle  
**Impact:** Low-Medium

**Features:**
- [ ] Multiple editor themes (Monokai, Dracula, GitHub, etc.)
- [ ] Custom color scheme creator
- [ ] UI density options (compact/comfortable/spacious)
- [ ] Font family/size customization
- [ ] Ligature support
- [ ] Accessibility mode (high contrast)

**Technical Notes:**
- Extend `app/lib/stores/theme.ts`
- Add theme marketplace/gallery
- Implement settings panel

---

## 🔧 Priority 3: Collaboration & Sharing

### 3.1 Real-Time Collaboration
**Status:** 🔴 Not Implemented  
**Competitor Feature:** Replit, CodeSandbox, Cursor (upcoming)  
**Impact:** Very High

**Features:**
- [ ] Live collaborative editing (multiplayer)
- [ ] Shared cursor positions
- [ ] User presence indicators
- [ ] Collaborative terminal
- [ ] Voice/video chat integration
- [ ] Comments and annotations on code
- [ ] Role-based permissions (view/edit/admin)

**Technical Notes:**
- Implement CRDT or OT for conflict-free editing
- Use Cloudflare Durable Objects or Partykit for real-time sync
- Add WebRTC for voice/video

---

### 3.2 Enhanced Project Sharing
**Status:** 🟡 Basic URL Sharing  
**Impact:** High

**Features:**
- [ ] Public/private project visibility
- [ ] Embed code widget for websites
- [ ] Project forking
- [ ] View-only mode with running preview
- [ ] Share specific file/line ranges
- [ ] Project README preview
- [ ] Social preview cards

**Technical Notes:**
- Extend persistence layer in `app/lib/persistence/`
- Add project visibility settings
- Implement embed iframe generator

---

### 3.3 Project Gallery & Discovery
**Status:** 🔴 Not Implemented  
**Competitor Feature:** CodePen, Replit Explore  
**Impact:** Medium

**Features:**
- [ ] Public project gallery
- [ ] Search and filter projects
- [ ] Featured projects showcase
- [ ] Tags and categories
- [ ] Like/bookmark system
- [ ] User profiles
- [ ] Project analytics (views, forks)

**Technical Notes:**
- Create gallery route and components
- Add database for project metadata
- Implement search with Cloudflare D1 or external service

---

## 🧠 Priority 4: AI Capabilities

### 4.1 Context-Aware AI
**Status:** 🟡 Basic Context  
**Impact:** High

**Features:**
- [ ] Codebase indexing and RAG
- [ ] @-mention files for context
- [ ] Project-wide refactoring mode
- [ ] Explain code functionality
- [ ] Generate tests from implementation
- [ ] Code review mode
- [ ] Documentation generation

**Technical Notes:**
- Implement embeddings for codebase semantic search
- Add vector database (Cloudflare Vectorize)
- Enhance prompt engineering in `prompts.ts`

---

### 4.2 Prompt Library & Templates
**Status:** 🔴 Not Implemented  
**Competitor Feature:** Cursor, Cline  
**Impact:** Medium

**Features:**
- [ ] Pre-built prompt templates
- [ ] Custom prompt saving
- [ ] Prompt variables and parameters
- [ ] Community prompt sharing
- [ ] Prompt versioning
- [ ] Quick actions (Fix bug, Add feature, Optimize)

**Technical Notes:**
- Create prompt template system
- Add prompt management UI
- Store templates in IndexedDB or cloud

---

### 4.3 AI Agent Modes
**Status:** 🔴 Not Implemented  
**Competitor Feature:** Cursor Composer, Replit Agent  
**Impact:** High

**Features:**
- [ ] Agent mode: Full autonomy for complex tasks
- [ ] Task breakdown visualization
- [ ] Step-by-step execution with approval gates
- [ ] Multi-step planning with review
- [ ] Background agent tasks
- [ ] Agent memory and learning

**Technical Notes:**
- Implement multi-step planning system
- Add task queue and execution engine
- Create agent control panel UI

---

### 4.4 Code Generation Improvements
**Status:** 🟡 Basic Generation  
**Impact:** High

**Features:**
- [ ] Inline code completion (Copilot-style)
- [ ] Docstring/comment generation
- [ ] Test generation from code
- [ ] Type inference and addition
- [ ] Code translation (language conversion)
- [ ] Performance optimization suggestions

**Technical Notes:**
- Add streaming completions in editor
- Implement FIM (Fill-In-the-Middle) prompting
- Use smaller, faster models for completions

---

## 📦 Priority 5: Extensions & Integrations

### 5.1 Third-Party Integrations
**Status:** 🔴 Not Implemented  
**Impact:** High

**Features:**
- [ ] Supabase integration
- [ ] Firebase integration
- [ ] Vercel/Netlify deployment
- [ ] Database connections (Postgres, MongoDB)
- [ ] API platform integrations (Postman, Insomnia)
- [ ] Authentication providers (Auth0, Clerk)
- [ ] Payment integrations (Stripe)

**Technical Notes:**
- Create integration marketplace
- Add OAuth flows for services
- Implement deployment adapters

---

### 5.2 Extension System
**Status:** 🔴 Not Implemented  
**Competitor Feature:** VS Code, Cursor  
**Impact:** Medium-High

**Features:**
- [ ] Plugin/extension API
- [ ] Extension marketplace
- [ ] Custom language support
- [ ] Custom linters and formatters
- [ ] Custom themes
- [ ] Community extensions

**Technical Notes:**
- Design secure extension runtime
- Create extension API documentation
- Build extension registry

---

### 5.3 Import Existing Projects
**Status:** 🔴 Not Implemented  
**Impact:** High

**Features:**
- [ ] Import from GitHub repository
- [ ] Import from local file system
- [ ] Import from ZIP file
- [ ] Import from other platforms (CodeSandbox, Replit)
- [ ] Auto-detect framework and dependencies

**Technical Notes:**
- Add file upload handler
- Implement GitHub repository cloning
- Create import wizard UI

---

## 🔒 Priority 6: Security & Privacy

### 6.1 Security Features
**Status:** 🟡 Basic Security  
**Impact:** High

**Features:**
- [ ] Private projects (encryption at rest)
- [ ] Environment variable management
- [ ] Secrets management (API keys)
- [ ] .env file support with masking
- [ ] Project access controls
- [ ] Two-factor authentication
- [ ] Session management

**Technical Notes:**
- Implement E2E encryption for private projects
- Add secrets vault using Cloudflare Workers KV
- Enhance auth system with 2FA

---

### 6.2 Data Management
**Status:** 🟡 Basic Persistence  
**Impact:** Medium

**Features:**
- [ ] Export entire project as ZIP
- [ ] Automated backups
- [ ] Version history (time travel)
- [ ] Project recovery
- [ ] Data portability
- [ ] GDPR compliance tools

**Technical Notes:**
- Add export functionality
- Implement snapshot system
- Create backup scheduler

---

## 📊 Priority 7: Analytics & Monitoring

### 7.1 Usage Analytics
**Status:** 🔴 Not Implemented  
**Impact:** Medium

**Features:**
- [ ] Token usage tracking
- [ ] Session duration metrics
- [ ] Feature usage analytics
- [ ] Error tracking and reporting
- [ ] Performance monitoring
- [ ] User feedback collection

**Technical Notes:**
- Integrate analytics service
- Add telemetry with privacy controls
- Implement error boundary reporting

---

### 7.2 Developer Insights
**Status:** 🔴 Not Implemented  
**Impact:** Low-Medium

**Features:**
- [ ] Coding activity dashboard
- [ ] Language/framework statistics
- [ ] Time spent per project
- [ ] AI assistance metrics
- [ ] Productivity insights

**Technical Notes:**
- Create analytics dashboard route
- Store metrics in Cloudflare D1
- Build visualization components

---

## 🏗️ Priority 8: Infrastructure & Performance

### 8.1 Performance Optimization
**Status:** 🟡 Basic Optimization  
**Impact:** High

**Features:**
- [ ] Faster project cold starts
- [ ] Optimized bundle sizes
- [ ] WebContainer warm-up strategies
- [ ] Lazy loading for large codebases
- [ ] Editor performance for large files
- [ ] Streaming improvements

**Technical Notes:**
- Profile and optimize WebContainer boot
- Implement code splitting
- Add service worker caching

---

### 8.2 Offline Support
**Status:** 🔴 Not Implemented  
**Competitor Feature:** VS Code, local IDEs  
**Impact:** Medium

**Features:**
- [ ] Offline mode for editing
- [ ] Service worker for app caching
- [ ] Local-first architecture
- [ ] Sync when back online
- [ ] Offline indicator

**Technical Notes:**
- Implement service worker
- Use IndexedDB for offline storage
- Add sync conflict resolution

---

### 8.3 Mobile Experience
**Status:** 🟡 Responsive but Limited  
**Impact:** Medium

**Features:**
- [ ] Mobile-optimized UI
- [ ] Touch-friendly controls
- [ ] Mobile code editor improvements
- [ ] Native mobile apps (iOS/Android)
- [ ] Tablet-optimized layout

**Technical Notes:**
- Optimize touch interactions
- Create mobile-first layouts
- Consider React Native or PWA approach

---

## 🎓 Priority 9: Learning & Documentation

### 9.1 Interactive Tutorials
**Status:** 🔴 Not Implemented  
**Impact:** Medium

**Features:**
- [ ] Built-in tutorials
- [ ] Interactive learning paths
- [ ] Framework-specific guides
- [ ] AI-powered learning assistant
- [ ] Code challenges
- [ ] Achievement system

**Technical Notes:**
- Create tutorial content system
- Add guided tour component
- Implement progress tracking

---

### 9.2 Documentation Hub
**Status:** 🟡 External Docs  
**Impact:** Low-Medium

**Features:**
- [ ] In-app documentation
- [ ] Searchable API reference
- [ ] Video tutorials
- [ ] Community cookbook
- [ ] Changelog and updates

**Technical Notes:**
- Create docs route
- Add search functionality
- Embed video content

---

## 🔮 Priority 10: Advanced/Future Features

### 10.1 AI-Powered Testing
**Status:** 🔴 Not Implemented  
**Impact:** High

**Features:**
- [ ] Automatic test generation
- [ ] Visual regression testing
- [ ] AI-powered debugging
- [ ] Test coverage analysis
- [ ] E2E test recording

---

### 10.2 Design Integration
**Status:** 🔴 Not Implemented  
**Impact:** Medium

**Features:**
- [ ] Figma import to code
- [ ] Screenshot to code
- [ ] UI component library
- [ ] Design tokens management
- [ ] Visual CSS editor

---

### 10.3 DevOps Features
**Status:** 🔴 Not Implemented  
**Impact:** Medium

**Features:**
- [ ] CI/CD pipeline integration
- [ ] Docker container support
- [ ] Environment management (dev/staging/prod)
- [ ] Automated deployments
- [ ] Monitoring and logging

---

### 10.4 Enterprise Features
**Status:** 🔴 Not Implemented  
**Impact:** Low (for now)

**Features:**
- [ ] Team workspaces
- [ ] SSO authentication
- [ ] Usage quotas and billing
- [ ] Admin dashboard
- [ ] Audit logs
- [ ] Self-hosted option

---

## 📈 Implementation Priority Matrix

### Quick Wins (High Impact, Low Effort)
1. ✅ Multi-model AI support
2. ✅ Project templates & starters
3. ✅ Prompt library
4. ✅ Enhanced terminal (tabs)
5. ✅ Export project functionality

### Major Initiatives (High Impact, High Effort)
1. ✅ Git integration
2. ✅ Real-time collaboration
3. ✅ Advanced code intelligence (LSP)
4. ✅ Context-aware AI with RAG
5. ✅ Extension system

### Strategic Bets (Medium-High Impact, High Effort)
1. ✅ Import existing projects
2. ✅ Third-party integrations
3. ✅ AI agent modes
4. ✅ Design integration (Figma to code)

### Polish & Nice-to-Have (Variable Impact, Low-Medium Effort)
1. ✅ Theming & customization
2. ✅ Mobile experience
3. ✅ Analytics dashboard
4. ✅ Tutorial system

---

## 🎯 Recommended 90-Day Roadmap

### Month 1: Foundation
- Multi-model AI support
- Enhanced terminal (tabs)
- Project export functionality
- Git integration (Phase 1: local commits)

### Month 2: Developer Experience
- Project templates & starters
- Import from GitHub
- Split editor view
- Command palette
- Prompt library

### Month 3: Collaboration & AI
- Real-time collaboration (Phase 1: basic multiplayer)
- Context-aware AI with @-mentions
- Code intelligence improvements
- Enhanced sharing features

---

## 📝 Notes

**Competitor Analysis:**
- **Cursor**: Best-in-class AI integration, multi-model support, composer mode
- **v0.dev**: Excellent design-to-code, component-focused
- **Replit**: Strong collaboration, deployment, and mobile support
- **Lovable.dev**: Full-stack focus with good database integration
- **GitHub Copilot Workspace**: Task-oriented, natural language planning

**Differentiation Strategy:**
Bolt.new's unique advantages are:
1. **Browser-native** - No installation required
2. **WebContainer** - Full Node.js in browser
3. **StackBlitz backing** - Strong infrastructure and expertise

Focus on making these advantages even stronger while addressing gaps in collaboration, git support, and AI capabilities.

---

**Document Maintainers:** Engineering Team  
**Review Cycle:** Monthly  
**Status Key:** 🔴 Not Started | 🟡 In Progress | 🟢 Complete
