# Current Architecture Assessment

**Document Purpose:** Understand what bolt.new currently has and what's missing  
**Last Updated:** January 3, 2025  
**Status:** Assessment Complete

---

## 🗄️ Database & Storage

### ✅ **What's Currently Implemented**

#### IndexedDB (Client-Side Only)
- **Location:** `app/lib/persistence/db.ts`
- **Database Name:** `boltHistory`
- **Storage:** Browser-side only (no server database)

**What it stores:**
```typescript
{
  id: string;           // Chat ID
  urlId: string;        // URL-friendly ID
  messages: UIMessage[]; // Chat messages
  description?: string;  // Chat description
  timestamp: string;     // ISO timestamp
}
```

**Operations supported:**
- ✅ Store chat history locally
- ✅ Retrieve chat by ID or URL ID
- ✅ Delete chats
- ✅ Get all chats

**Limitations:**
- ❌ **No server-side persistence** - Data lost if browser cache cleared
- ❌ **No sync across devices** - Data stays on one browser
- ❌ **No user accounts** - Anonymous only
- ❌ **No sharing** - Can't share projects with others
- ❌ **No backup** - Data can be lost permanently

---

### ❌ **What's NOT Implemented**

#### Server-Side Database
**Status:** Not implemented  
**Impact:** HIGH - No persistent data, no multi-device, no collaboration

**Missing:**
- [ ] No Cloudflare D1 (SQLite)
- [ ] No Cloudflare KV (Key-Value store)
- [ ] No Cloudflare Durable Objects
- [ ] No external database (Postgres, MySQL, etc.)
- [ ] No Supabase integration
- [ ] No Firebase integration
- [ ] No Prisma ORM

**What this means:**
```
Current: Browser only
┌─────────────┐
│   Browser   │ ← IndexedDB (local only)
└─────────────┘

Missing: Server database
┌─────────────┐     ┌──────────┐     ┌──────────┐
│   Browser   │ ←→  │  Server  │ ←→  │ Database │
└─────────────┘     └──────────┘     └──────────┘
```

---

## 🔐 Authentication & Authorization

### ✅ **What's Currently Implemented**

**NOTHING** - Zero authentication implementation

The only auth-related file is:
- `app/lib/webcontainer/auth.client.ts` - Just exports WebContainer's auth API (for their service, not your users)

### ❌ **What's NOT Implemented**

**Status:** Not implemented  
**Impact:** VERY HIGH - No users, no accounts, no access control

**Missing Features:**
- [ ] **User Authentication**
  - No login/logout
  - No signup/registration
  - No password management
  - No email verification
  - No password reset

- [ ] **Auth Providers**
  - No GitHub OAuth
  - No Google OAuth
  - No Magic link login
  - No SSO (Single Sign-On)

- [ ] **Session Management**
  - No user sessions
  - No JWT tokens
  - No refresh tokens
  - No session expiration

- [ ] **Authorization**
  - No role-based access control (RBAC)
  - No permissions system
  - No API keys
  - No access tokens

**Current User Model:**
```typescript
// This doesn't exist!
// There is no user object, no user ID, nothing
```

---

## 👥 Multi-Tenancy & Organization

### ✅ **What's Currently Implemented**

**NOTHING** - Zero multi-tenancy features

### ❌ **What's NOT Implemented**

**Status:** Not implemented  
**Impact:** HIGH - Can't build teams/organizations

**Missing Entities:**

#### 1. **Users**
```typescript
// Doesn't exist!
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}
```

#### 2. **Organizations/Workspaces**
```typescript
// Doesn't exist!
interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  members: Member[];
}
```

#### 3. **Teams**
```typescript
// Doesn't exist!
interface Team {
  id: string;
  orgId: string;
  name: string;
  members: Member[];
}
```

#### 4. **Projects**
```typescript
// Doesn't exist!
interface Project {
  id: string;
  name: string;
  ownerId: string;
  orgId?: string;
  visibility: 'private' | 'public';
  collaborators: string[];
}
```

#### 5. **Permissions**
```typescript
// Doesn't exist!
interface Permission {
  userId: string;
  resourceId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
}
```

---

## 🏗️ Current vs. Needed Architecture

### **Current State: Single-User, Client-Side Only**

```
┌──────────────────────────────────┐
│         User's Browser           │
│                                  │
│  ┌────────────────────────────┐ │
│  │     IndexedDB (local)      │ │
│  │   - Chat history only      │ │
│  │   - No sync                │ │
│  │   - No backup              │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │   WebContainer (browser)   │ │
│  │   - Runs code locally      │ │
│  │   - No persistence         │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
                ↓
        Anthropic API (Claude)
```

### **Needed Architecture: Multi-User, Cloud-Based**

```
┌──────────────────────────────────┐
│         User's Browser           │
│                                  │
│  ┌────────────────────────────┐ │
│  │   IndexedDB (cache only)   │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │      WebContainer          │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
                ↓
        ┌──────────────┐
        │   Auth API   │ ← Login/signup
        └──────────────┘
                ↓
┌───────────────────────────────────┐
│     Cloudflare Workers/Pages      │
│                                   │
│  ┌─────────────────────────────┐ │
│  │  API Routes                 │ │
│  │  - /api/projects            │ │
│  │  - /api/users               │ │
│  │  - /api/organizations       │ │
│  └─────────────────────────────┘ │
└───────────────────────────────────┘
        ↓           ↓           ↓
  ┌─────────┐  ┌────────┐  ┌─────────┐
  │ D1 (DB) │  │   KV   │  │ R2/Blob │
  │         │  │(Cache) │  │(Files)  │
  └─────────┘  └────────┘  └─────────┘
```

---

## 📊 Feature Gap Analysis

### **Core Missing Features**

| Feature | Current | Needed | Priority | Effort |
|---------|---------|--------|----------|--------|
| **Authentication** | ❌ None | ✅ Full auth system | CRITICAL | High |
| **User Accounts** | ❌ None | ✅ User profiles | CRITICAL | Medium |
| **Server Database** | ❌ None | ✅ Cloudflare D1/Postgres | CRITICAL | High |
| **Project Persistence** | ❌ Browser only | ✅ Server storage | CRITICAL | High |
| **Organizations** | ❌ None | ✅ Org/workspace support | HIGH | High |
| **Teams** | ❌ None | ✅ Team collaboration | HIGH | Medium |
| **Permissions** | ❌ None | ✅ RBAC system | HIGH | Medium |
| **Project Sharing** | ❌ None | ✅ Public/private projects | HIGH | Medium |
| **Multi-device Sync** | ❌ None | ✅ Cloud sync | MEDIUM | Medium |
| **Billing** | ❌ None | ✅ Subscription mgmt | MEDIUM | High |

---

## 🎯 What This Means for Your Roadmap

### **Phase 1: Foundation (Must Have First)**
Before you can build advanced features, you need:

1. **Authentication System** (Week 1-2)
   - Choose auth provider (Clerk, Auth0, Supabase Auth, or custom)
   - Implement login/signup
   - User sessions
   - Protected routes

2. **Server-Side Database** (Week 2-3)
   - Set up Cloudflare D1 or external database
   - Design database schema
   - Migrate from IndexedDB to server
   - Implement API routes

3. **User & Project Models** (Week 3-4)
   - User table
   - Project table
   - Ownership relationships
   - Basic CRUD operations

### **Phase 2: Collaboration (After Foundation)**
Once Phase 1 is complete:

4. **Organizations/Workspaces** (Week 5-6)
5. **Team Features** (Week 6-7)
6. **Permissions System** (Week 7-8)

### **Phase 3: Advanced Features**
7. Real-time collaboration
8. Billing/subscriptions
9. Analytics
10. Enterprise features

---

## 💡 Recommended Approach

### **Option A: Quick Start with Supabase** (Fastest)
```bash
# Add Supabase
pnpm add @supabase/supabase-js

# Supabase gives you:
✅ Auth (built-in)
✅ PostgreSQL database
✅ Real-time subscriptions
✅ Storage (for files)
✅ Row-level security
```

**Pros:**
- Fast setup (hours, not days)
- Auth included
- Real-time built-in
- Good free tier

**Cons:**
- External dependency
- Less control
- Potential vendor lock-in

### **Option B: Cloudflare-Native** (Best for Bolt.new)
```bash
# Cloudflare D1 (SQLite)
# Cloudflare KV (caching)
# Cloudflare R2 (file storage)
# Cloudflare Access/Zero Trust (auth)
```

**Pros:**
- Same platform as your app
- Great performance
- No cold starts
- Cost-effective

**Cons:**
- More setup work
- Need to build auth yourself (or use Clerk)
- More pieces to manage

### **Option C: Custom with Auth Provider** (Balanced)
```bash
# Auth: Clerk or Auth0
pnpm add @clerk/remix

# Database: Cloudflare D1 or Neon/PlanetScale
# Storage: Cloudflare R2
```

**Pros:**
- Professional auth solution
- Flexible database choice
- Good developer experience

**Cons:**
- Multiple services to manage
- Additional costs

---

## 📝 Next Steps - Infrastructure Plan

I can create detailed implementation plans for:

### 1. **Authentication Setup** (Choose one)
   - [ ] Plan A: Clerk integration (recommended)
   - [ ] Plan B: Supabase Auth
   - [ ] Plan C: Auth0
   - [ ] Plan D: Custom auth with Cloudflare Access

### 2. **Database Setup** (Choose one)
   - [ ] Plan A: Cloudflare D1 (SQLite)
   - [ ] Plan B: Supabase PostgreSQL
   - [ ] Plan C: Neon PostgreSQL
   - [ ] Plan D: PlanetScale MySQL

### 3. **Schema Design**
   - [ ] Users table
   - [ ] Projects table
   - [ ] Organizations table
   - [ ] Teams table
   - [ ] Permissions table
   - [ ] Sessions table

### 4. **Migration Strategy**
   - [ ] Migrate IndexedDB to server
   - [ ] Backward compatibility
   - [ ] Data import/export

---

## 🔍 Summary

### **Current Reality:**
```yaml
Authentication: None (anonymous only)
Database: IndexedDB (browser-only, no sync)
Users: None (no accounts)
Organizations: None
Teams: None
Permissions: None
Multi-device: Not possible
Collaboration: Not possible
Server Storage: None
```

### **What You Need to Build:**
```yaml
✅ Full authentication system
✅ Server-side database
✅ User management
✅ Organization/workspace support
✅ Team features
✅ Permission system
✅ Project persistence
✅ Multi-device sync
✅ Collaboration features
```

---

## ❓ Questions for You

To help you decide on the architecture:

1. **Budget/Cost concerns?**
   - Free tier: Supabase/Cloudflare
   - Paid: Clerk + Neon
   - Enterprise: Custom solution

2. **Timeline?**
   - Fast (1-2 weeks): Supabase all-in-one
   - Moderate (3-4 weeks): Clerk + Cloudflare D1
   - Long-term (6-8 weeks): Custom everything

3. **Team size?**
   - Solo: Go with managed services (Supabase/Clerk)
   - Small team: Mix of managed + custom
   - Large team: Full custom control

4. **Scale expectations?**
   - Small (<1K users): Any option works
   - Medium (10K users): Cloudflare or Supabase
   - Large (100K+ users): Cloudflare Workers + D1

---

**Want me to create a detailed implementation plan for authentication + database setup?** 

Let me know which option you prefer and I'll create step-by-step guides!
