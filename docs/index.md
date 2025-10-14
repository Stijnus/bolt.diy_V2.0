# BoltDIY V2.0 Documentation

Welcome to the BoltDIY V2.0 documentation. This project is an AI-powered in-browser IDE built with Remix, Cloudflare Pages/Workers, Vercel AI SDK, WebContainers, Supabase, CodeMirror, and Radix UI.

## Quick Navigation

### 🚀 [Getting Started](./getting-started/)
Everything you need to get BoltDIY up and running on your system.
- [Setup Guide](./getting-started/SETUP_GUIDE.md) - Complete installation and configuration
- [Docker Guide](./getting-started/DOCKER.md) - Running with Docker
- [AI Models](./getting-started/ai-models.md) - Configuring AI providers
- [FAQ](./getting-started/faq.md) - Frequently asked questions
- [Troubleshooting](./getting-started/troubleshooting.md) - Common issues and solutions

### 🏗️ [Architecture](./architecture/)
Technical architecture and design documentation.
- [Application Flow & Architecture](./architecture/APPLICATION_FLOW_AND_ARCHITECTURE.md) - High-level system design
- [Current Architecture](./architecture/CURRENT_ARCHITECTURE.md) - Detailed technical architecture
- [Design System](./architecture/DESIGN_SYSTEM.md) - UI/UX design guidelines
- [Multi-Model Implementation](./architecture/MULTI_MODEL_IMPLEMENTATION_SUMMARY.md) - AI model integration

### 🔧 [Development](./development/)
Resources for developers contributing to BoltDIY.
- [Contributing Guide](./development/CONTRIBUTING.md) - How to contribute
- [Documentation Restructure](./development/DOCUMENTATION_RESTRUCTURE.md) - Docs organization
- [Guides Index](./development/guides-index.md) - Development guides overview

### 🚀 [Deployment](./deployment/)
Documentation for deploying BoltDIY in production.
- [GitHub Pages Setup](./deployment/GITHUB_PAGES_SETUP.md) - Deploying to GitHub Pages

### 📋 [Project Management](./project-management/)
Project planning, roadmaps, and decision records.
- [Project Management](./project-management/PROJECT_MANAGEMENT.md) - Development process
- [Feature Roadmap](./project-management/FEATURE_ROADMAP.md) - Planned features
- [Quick Wins Plan](./project-management/QUICK_WINS_PLAN.md) - Priority improvements
- [Current Sprint](./project-management/SPRINT_CURRENT.md) - Active development
- [TODO](./project-management/TODO.md) - Task tracking
- [ADRs](./project-management/adr/) - Architecture Decision Records

### 🔧 [Fixes & Issues](./fixes/)
Bug fixes, patches, and technical solutions.
- [Authentication Fix Summary](./fixes/AUTHENTICATION_FIX_SUMMARY.md)
- [Storage Bucket Fix](./fixes/STORAGE_BUCKET_FIX.md)
- [Settings UX Analysis](./fixes/SETTINGS_UX_ANALYSIS.md)
- [Settings UX Fixes Implementation](./fixes/SETTINGS_UX_FIXES_IMPLEMENTATION.md)
- [Supabase Constraint Fix](./fixes/SUPABASE_CONSTRAINT_FIX.md)
- [Supabase Integration Plan](./fixes/SUPABASE_INTEGRATION_PLAN.md)
- [Quick Fixes](./fixes/QUICK_FIX.md)

### 📚 [Archive](./archive/)
Historical documentation and completed project phases.
- [Projects Implementation Summary](./archive/PROJECTS_IMPLEMENTATION_SUMMARY.md)
- [Projects Phase 1 Quickstart](./archive/PROJECTS_PHASE1_QUICKSTART.md)
- [Projects UX Fixes Needed](./archive/PROJECTS_UX_FIXES_NEEDED.md)
- [Projects UX Improvements Complete](./archive/PROJECTS_UX_IMPROVEMENTS_COMPLETE.md)
- [Projects UX Redesign Summary](./archive/PROJECTS_UX_REDESIGN_SUMMARY.md)
- [Projects Phase 1 Complete](./archive/PROJECTS_PHASE1_COMPLETE.md)
- [Projects Phase 2 Complete](./archive/PROJECTS_PHASE2_COMPLETE.md)
- [Projects UX Implementation Status](./archive/PROJECTS_UX_IMPLEMENTATION_STATUS.md)

## Quick Reference

For quick access to key information:
- **Setup**: Start with the [Setup Guide](./getting-started/SETUP_GUIDE.md)
- **Development**: See the [Contributing Guide](./development/CONTRIBUTING.md)
- **Architecture**: Review the [Application Flow & Architecture](./architecture/APPLICATION_FLOW_AND_ARCHITECTURE.md)
- **AI Models**: Configure providers with the [AI Models Guide](./getting-started/ai-models.md)

## Project Structure

BoltDIY V2.0 uses:
- **Runtime**: Remix + Vite + TypeScript targeting Cloudflare Pages/Workers
- **UI**: React, Radix UI, Tailwind CSS, CodeMirror 6, xterm.js
- **AI**: Vercel AI SDK with multiple provider support
- **Database**: Supabase with RLS
- **Container**: WebContainer API for browser-based Node environment

---

*For questions or contributions, please see our [Contributing Guide](./development/CONTRIBUTING.md).*
