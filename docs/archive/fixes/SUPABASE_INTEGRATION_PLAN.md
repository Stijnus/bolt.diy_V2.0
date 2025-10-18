# Supabase Integration Implementation Plan

**Goal:** Add authentication, server-side database, and user management to bolt.new  
**Timeline:** 2-3 weeks  
**Effort:** High (but worth it!)  
**Status:** Ready to implement

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 1: Supabase Setup](#phase-1-supabase-setup)
3. [Phase 2: Authentication](#phase-2-authentication)
4. [Phase 3: Database Schema](#phase-3-database-schema)
5. [Phase 4: Migration from IndexedDB](#phase-4-migration-from-indexeddb)
6. [Phase 5: Project Management](#phase-5-project-management)
7. [Phase 6: Real-time Features](#phase-6-real-time-features)
8. [Testing & Deployment](#testing--deployment)

---

## 🎯 Overview

### What You'll Get

```
Before (Current):
┌─────────────┐
│   Browser   │ ← IndexedDB (local, anonymous)
└─────────────┘

After (With Supabase):
┌─────────────┐
│   Browser   │ ← Auth + API Client
└─────────────┘
        ↓
┌─────────────┐
│  Supabase   │
│  - Auth     │ ← GitHub, Google, Email login
│  - Postgres │ ← Users, Projects, Chats
│  - Storage  │ ← Project files (optional)
│  - Realtime │ ← Collaboration (future)
└─────────────┘
```

### Features Enabled
- ✅ User accounts (GitHub/Google/Email)
- ✅ Persistent project storage
- ✅ Multi-device sync
- ✅ Project sharing (public/private)
- ✅ User profiles
- ✅ Real-time collaboration (future)

### Dependencies to Add
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-remix": "^0.2.3"
  }
}
```

---

## 📅 Phase 1: Supabase Setup (Day 1)

### Step 1.1: Create Supabase Project

**Actions:**
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Fill in details:
   ```
   Name: bolt-new-prod
   Database Password: [generate strong password]
   Region: [closest to your users]
   Pricing Plan: Free (upgrade later)
   ```
5. Wait 2-3 minutes for project creation

### Step 1.2: Get API Keys

**Location:** Project Settings > API

Copy these values:
```bash
# .env.local
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only!
```

### Step 1.3: Install Dependencies

```bash
# Add Supabase
pnpm add @supabase/supabase-js @supabase/auth-helpers-remix

# Add additional utilities
pnpm add @supabase/ssr

# Development
pnpm add -D @types/node
```

### Step 1.4: Environment Variables

Create/update `.env.local`:
```bash
# Existing
ANTHROPIC_API_KEY=sk-ant-xxx

# New - Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Optional - for development
VITE_LOG_LEVEL=debug
```

**⚠️ Security Notes:**
- ✅ `SUPABASE_ANON_KEY` - Safe for client-side (has Row Level Security)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - NEVER expose to client (server-only)

### Step 1.5: Create Supabase Client Utilities

**File:** `app/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )
}
```

**File:** `app/lib/supabase/server.ts`
```typescript
import { createServerClient, parse, serialize } from '@supabase/ssr'
import type { AppLoadContext } from '@remix-run/cloudflare'

export function createSupabaseServerClient(request: Request, context: AppLoadContext) {
  const cookies = parse(request.headers.get('Cookie') ?? '')

  return createServerClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(key) {
          return cookies[key]
        },
        set(key, value, options) {
          // Handle setting cookies in Remix
        },
        remove(key, options) {
          // Handle removing cookies
        },
      },
    }
  )
}
```

**File:** `app/lib/supabase/types.ts`
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
        }
        Update: {
          email?: string
          name?: string | null
          avatar_url?: string | null
        }
      }
      // More tables defined in Phase 3
    }
  }
}
```

---

## 🔐 Phase 2: Authentication (Days 2-4)

### Step 2.1: Configure Auth Providers

**In Supabase Dashboard:**

1. **Enable Email Auth:**
   - Go to: Authentication > Providers
   - Enable "Email"
   - Configure email templates (optional)

2. **Enable GitHub OAuth:**
   ```
   1. Go to GitHub > Settings > Developer Settings > OAuth Apps
   2. New OAuth App:
      - Homepage URL: http://localhost:5173 (dev)
      - Callback URL: https://xxxxx.supabase.co/auth/v1/callback
   3. Copy Client ID & Secret
   4. In Supabase: Authentication > Providers > GitHub
      - Paste Client ID & Secret
      - Enable
   ```

3. **Enable Google OAuth (optional):**
   ```
   1. Google Cloud Console > APIs & Services > Credentials
   2. Create OAuth 2.0 Client ID
   3. Add authorized redirect URI
   4. Copy credentials to Supabase
   ```

### Step 2.2: Create Auth Context

**File:** `app/lib/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '~/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGitHub,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Step 2.3: Create Auth UI Components

**File:** `app/components/auth/LoginModal.tsx`
```typescript
import { useState } from 'react'
import { Dialog } from '~/components/ui/Dialog'
import { useAuth } from '~/lib/contexts/AuthContext'
import { IconButton } from '~/components/ui/IconButton'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn, signUp, signInWithGitHub, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6 max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h2>

        {/* OAuth Buttons */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => signInWithGitHub()}
            className="w-full btn btn-secondary"
          >
            <i className="i-ph-github-logo" />
            Continue with GitHub
          </button>
          <button
            onClick={() => signInWithGoogle()}
            className="w-full btn btn-secondary"
          >
            <i className="i-ph-google-logo" />
            Continue with Google
          </button>
        </div>

        <div className="divider">or</div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            required
          />

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-500 hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-blue-500 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}
```

**File:** `app/components/auth/UserMenu.tsx`
```typescript
import { useState } from 'react'
import { useAuth } from '~/lib/contexts/AuthContext'
import { LoginModal } from './LoginModal'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) {
    return (
      <>
        <button
          onClick={() => setLoginOpen(true)}
          className="btn btn-primary"
        >
          Sign In
        </button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2"
      >
        <img
          src={user.user_metadata.avatar_url || '/default-avatar.png'}
          alt={user.email}
          className="w-8 h-8 rounded-full"
        />
        <span>{user.email}</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
```

### Step 2.4: Add Auth to Header

**File:** `app/components/header/Header.tsx`
```typescript
import { UserMenu } from '~/components/auth/UserMenu'

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <h1>Bolt.new</h1>
        {/* ... existing header content ... */}
      </div>
      
      {/* Add user menu */}
      <UserMenu />
    </header>
  )
}
```

### Step 2.5: Create Auth Callback Route

**File:** `app/routes/auth.callback.tsx`
```typescript
import { LoaderFunction, redirect } from '@remix-run/cloudflare'
import { createSupabaseServerClient } from '~/lib/supabase/server'

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createSupabaseServerClient(request, context)
    await supabase.auth.exchangeCodeForSession(code)
  }

  return redirect('/')
}
```

### Step 2.6: Wrap App with Auth Provider

**File:** `app/root.tsx`
```typescript
import { AuthProvider } from '~/lib/contexts/AuthContext'

export default function App() {
  return (
    <html>
      <body>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## 🗄️ Phase 3: Database Schema (Days 5-6)

### Step 3.1: Design Database Schema

**Go to:** Supabase Dashboard > SQL Editor

**Execute this SQL:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  files JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table (replaces IndexedDB storage)
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  url_id TEXT NOT NULL UNIQUE,
  description TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project collaborators (for sharing)
CREATE TABLE public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_chats_url_id ON public.chats(url_id);
CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3.2: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = user_id OR
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.project_collaborators
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Chats policies
CREATE POLICY "Users can view own chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = user_id);

-- Collaborators policies
CREATE POLICY "Users can view collaborators of their projects"
  ON public.project_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND user_id = auth.uid()
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "Project owners can manage collaborators"
  ON public.project_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_collaborators.project_id
      AND user_id = auth.uid()
    )
  );
```

### Step 3.3: Create Database Functions

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 3.4: Generate TypeScript Types

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref xxxxx

# Generate types
supabase gen types typescript --linked > app/lib/supabase/database.types.ts
```

---

## 🔄 Phase 4: Migration from IndexedDB (Days 7-8)

### Step 4.1: Create Migration Utility

**File:** `app/lib/migration/migrate-to-supabase.ts`
```typescript
import { openDatabase, getAll } from '~/lib/persistence/db'
import { createClient } from '~/lib/supabase/client'
import type { ChatHistoryItem } from '~/lib/persistence/useChatHistory'

export async function migrateIndexedDBToSupabase() {
  const supabase = createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User must be logged in to migrate')
  }

  // Get all chats from IndexedDB
  const db = await openDatabase()
  if (!db) {
    throw new Error('Could not open IndexedDB')
  }

  const chats = await getAll(db)
  
  // Migrate each chat to Supabase
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const chat of chats) {
    try {
      const { error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          url_id: chat.urlId,
          description: chat.description,
          messages: chat.messages,
        })

      if (error) throw error
      results.success++
    } catch (error: any) {
      results.failed++
      results.errors.push(`Chat ${chat.id}: ${error.message}`)
    }
  }

  return results
}
```

### Step 4.2: Create Migration UI

**File:** `app/components/migration/MigrationBanner.tsx`
```typescript
import { useState } from 'react'
import { migrateIndexedDBToSupabase } from '~/lib/migration/migrate-to-supabase'

export function MigrationBanner() {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleMigrate = async () => {
    setMigrating(true)
    try {
      const result = await migrateIndexedDBToSupabase()
      setResult(result)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Local data detected!</h3>
          <p className="text-sm">
            Migrate your local chat history to the cloud for multi-device access.
          </p>
        </div>
        <button
          onClick={handleMigrate}
          disabled={migrating}
          className="btn btn-primary"
        >
          {migrating ? 'Migrating...' : 'Migrate Now'}
        </button>
      </div>
      
      {result && (
        <div className="mt-2 text-sm">
          {result.error ? (
            <p className="text-red-600">Error: {result.error}</p>
          ) : (
            <p className="text-green-600">
              Successfully migrated {result.success} chats!
              {result.failed > 0 && ` (${result.failed} failed)`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 📦 Phase 5: Project Management (Days 9-11)

### Step 5.1: Create Project Service

**File:** `app/lib/services/projects.ts`
```typescript
import { createClient } from '~/lib/supabase/client'
import type { Database } from '~/lib/supabase/database.types'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export class ProjectService {
  private supabase = createClient()

  async createProject(data: Omit<ProjectInsert, 'user_id'>) {
    const { data: project, error } = await this.supabase
      .from('projects')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return project
  }

  async getProjects() {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getProject(id: string) {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateProject(id: string, updates: ProjectUpdate) {
    const { data, error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteProject(id: string) {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async shareProject(projectId: string, userEmail: string, role: 'editor' | 'viewer') {
    // Get user by email
    const { data: targetUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (!targetUser) {
      throw new Error('User not found')
    }

    // Add collaborator
    const { error } = await this.supabase
      .from('project_collaborators')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role,
      })

    if (error) throw error
  }
}
```

### Step 5.2: Create Projects UI

**File:** `app/components/projects/ProjectsList.tsx`
```typescript
import { useState, useEffect } from 'react'
import { ProjectService } from '~/lib/services/projects'

export function ProjectsList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const projectService = new ProjectService()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      setProjects(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map((project) => (
        <div key={project.id} className="border rounded-lg p-4">
          <h3 className="font-bold">{project.name}</h3>
          <p className="text-sm text-gray-600">{project.description}</p>
          <div className="mt-2 flex gap-2">
            <button className="btn btn-sm">Open</button>
            <button className="btn btn-sm btn-secondary">Share</button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 🔄 Phase 6: Real-time Features (Days 12-14)

### Step 6.1: Enable Real-time on Tables

**In Supabase Dashboard:**
```sql
-- Enable real-time for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
```

### Step 6.2: Create Real-time Collaboration Hook

**File:** `app/lib/hooks/useRealtimeProject.ts`
```typescript
import { useEffect, useState } from 'react'
import { createClient } from '~/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeProject(projectId: string) {
  const [collaborators, setCollaborators] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`project:${projectId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setCollaborators(Object.values(state).flat())
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [projectId])

  const updatePresence = (cursor: { x: number; y: number }) => {
    const channel = supabase.channel(`project:${projectId}`)
    channel.track({ cursor, timestamp: Date.now() })
  }

  return { collaborators, updatePresence }
}
```

---

## ✅ Testing & Deployment

### Testing Checklist

**Authentication:**
- [ ] Sign up with email works
- [ ] Sign in with email works
- [ ] GitHub OAuth works
- [ ] Google OAuth works (if enabled)
- [ ] Sign out works
- [ ] Session persists on reload
- [ ] Protected routes redirect to login

**Database:**
- [ ] Projects CRUD works
- [ ] Chats save to database
- [ ] Multi-device sync works
- [ ] RLS policies enforce correctly
- [ ] Public projects visible to all
- [ ] Private projects visible only to owner

**Migration:**
- [ ] IndexedDB data migrates successfully
- [ ] No data loss during migration
- [ ] Duplicate prevention works

### Deployment

```bash
# 1. Update environment variables in production
# Cloudflare Pages > Settings > Environment Variables
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...

# 2. Build and deploy
pnpm run build
pnpm run deploy

# 3. Verify in production
# Test auth flow
# Test project creation
# Test sync across devices
```

---

## 📊 Success Metrics

After implementation, you should have:

✅ **Authentication**
- Users can sign up/sign in
- OAuth providers work
- Sessions managed securely

✅ **Database**
- All data stored server-side
- Multi-device sync working
- No data loss

✅ **Projects**
- Users can create/edit/delete projects
- Projects persist across devices
- Sharing works (public/private)

✅ **Migration**
- Existing users can migrate data
- No disruption to workflow

---

## 🔜 Next Steps After Supabase Integration

Once Supabase is integrated, you can:

1. **Build Quick Wins Features** (back to sprint plan)
   - Multi-model AI
   - Project templates
   - Enhanced terminal
   - Prompt library

2. **Add Collaboration**
   - Real-time cursors
   - Live editing
   - Chat in projects

3. **Add Organizations**
   - Team workspaces
   - Shared projects
   - Billing/subscriptions

---

## 💡 Tips & Best Practices

1. **Start small** - Get auth working first, then add features
2. **Test RLS policies** - Security is critical
3. **Use transactions** - For complex operations
4. **Cache wisely** - Use IndexedDB for offline capability
5. **Monitor usage** - Supabase dashboard shows metrics

---

**Ready to start?** Begin with Phase 1 and work through systematically. Let me know when you're ready to begin, or if you need help with any specific step!
