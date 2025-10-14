# Architecture Documentation

Technical architecture and design documentation for BoltDIY V2.0.

## Contents

### Core Architecture
- **[Application Flow & Architecture](./APPLICATION_FLOW_AND_ARCHITECTURE.md)** - High-level system design and data flows
- **[Current Architecture](./CURRENT_ARCHITECTURE.md)** - Detailed technical architecture and components

### Design & Implementation
- **[Design System](./DESIGN_SYSTEM.md)** - UI/UX design guidelines and component library
- **[Multi-Model Implementation](./MULTI_MODEL_IMPLEMENTATION_SUMMARY.md)** - AI model integration architecture

## Architecture Overview

BoltDIY V2.0 is built with modern web technologies:

- **Frontend**: Remix + React + TypeScript
- **Runtime**: Cloudflare Pages/Workers
- **UI Framework**: Radix UI + Tailwind CSS
- **Code Editor**: CodeMirror 6
- **Terminal**: xterm.js
- **WebContainer**: @webcontainer/api for browser Node.js environment
- **AI Integration**: Vercel AI SDK with multiple providers
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth

---

[← Back to Documentation Home](../index.md)