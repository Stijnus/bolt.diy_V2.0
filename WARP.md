# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Primary Development Workflow
- `pnpm install` - Install dependencies (uses pnpm v9.4.0)
- `pnpm run dev` - Start development server with Remix Vite
- `pnpm run build` - Build project for production
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm test` - Run test suite with Vitest
- `pnpm test:watch` - Run tests in watch mode

### Code Quality
- `pnpm run lint` - Run ESLint with caching
- `pnpm run lint:fix` - Run ESLint and auto-fix issues

### Deployment & Production
- `pnpm run start` - Run built application locally with Wrangler Pages (uses bindings.sh for environment setup)
- `pnpm run preview` - Build and start locally (for testing production build)
- `pnpm run deploy` - Build and deploy to Cloudflare Pages
- `pnpm run typegen` - Generate TypeScript types using Wrangler

### Environment Setup
- Create `.env.local` with `ANTHROPIC_API_KEY=XXX` for Claude integration
- Optional: Set `VITE_LOG_LEVEL=debug` for enhanced debugging
- Chrome 129 has known issues with local development - use Chrome Canary for testing

## Architecture Overview

### Tech Stack
**Bolt.new** is an AI-powered web development tool built with:
- **Frontend**: Remix (React framework) with Vite, TypeScript
- **Styling**: UnoCSS with Tailwind reset
- **AI Integration**: Claude Sonnet 3.5 via Anthropic API using AI SDK
- **Code Execution**: WebContainer API for browser-based Node.js environments
- **Deployment**: Cloudflare Pages + Workers
- **State Management**: Nanostores for lightweight reactive state
- **Terminal**: xterm.js for in-browser terminal

### Core Architecture Patterns

#### WebContainer Integration
- `app/lib/webcontainer/index.ts` - WebContainer bootstrapping and management
- WebContainers provide full-stack sandbox environments in the browser
- Enables AI to have complete control over filesystem, Node.js server, package manager, and terminal
- Working directory name configured via `WORK_DIR_NAME` constant

#### AI/LLM Layer (`app/lib/.server/llm/`)
- `model.ts` - Claude Sonnet 3.5 model configuration
- `prompts.ts` - System prompts and AI instruction templates
- `stream-text.ts` - Streaming response handling
- `constants.ts` - Model limits (MAX_TOKENS: 8192, MAX_RESPONSE_SEGMENTS: 2)

#### State Management (`app/lib/stores/`)
Key stores for application state:
- `workbench.ts` - Main workbench state and WebContainer interactions
- `files.ts` - File system operations and file tree management
- `editor.ts` - Code editor state and content management
- `terminal.ts` - Terminal state and command execution
- `chat.ts` - AI chat conversation state
- `previews.ts` - Application preview management

#### Component Structure (`app/components/`)
- `chat/` - AI conversation interface and message handling
- `workbench/` - Main development environment (editor, terminal, preview)
- `editor/` - CodeMirror-based code editor with syntax highlighting
- `sidebar/` - File explorer and navigation
- `header/` - Application header and controls
- `ui/` - Reusable UI components (built with Radix UI)

#### Route Structure (`app/routes/`)
- `_index.tsx` - Main chat interface entry point
- `api.chat.ts` - AI chat API endpoint with streaming
- `api.enhancer.ts` - Prompt enhancement API
- `chat.$id.tsx` - Individual chat session routes

### Key Technical Details

#### Package Manager
- Uses **pnpm** (v9.4.0) as package manager - always use pnpm for consistency
- Node.js requirement: >=18.18.0

#### Development Environment
- Remix with Vite for fast development and HMR
- UnoCSS for atomic CSS with Tailwind compatibility
- TypeScript with strict configuration
- Vitest for testing

#### Production Deployment
- Built for Cloudflare Pages with Workers runtime
- Uses bindings.sh script for environment variable setup in local production testing
- WebContainer API requires commercial license for commercial usage

#### Browser Compatibility
- Chrome 129 has known issues with JavaScript modules in Vite development
- Development: Use Chrome Canary if encountering Chrome 129 issues
- Production builds (`pnpm run build && pnpm run start`) work fine in Chrome 129

### Development Guidelines

#### File Organization
- Server-side code in `app/lib/.server/` (never imported client-side)
- Client-only code suffixed with `.client.ts/tsx`
- Shared utilities in `app/utils/`
- Type definitions in `app/types/`

#### WebContainer Development
- WebContainer instance is globally managed and persisted during HMR
- All file system operations should go through the WebContainer API
- Terminal interactions managed through xterm.js integration

#### AI Integration
- All LLM interactions use streaming responses
- Prompts are centralized in `app/lib/.server/llm/prompts.ts`
- Rate limiting and token management handled at API level