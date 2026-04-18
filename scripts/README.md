# 🛠️ BoltDIY V2.0 - Scripts Documentation

This directory contains utility scripts to help with setup, maintenance, and troubleshooting of your BoltDIY workspace.

## 📜 Available Scripts

### 🚀 setup.sh - Database Setup Script

**Purpose**: Automates the Supabase database setup process

**Usage**:

```bash
npm run setup
# or
./scripts/setup.sh
```

**What it does**:

1. ✅ Validates your `.env.local` environment variables
2. ✅ Checks for required Supabase credentials
3. ✅ Copies the database schema SQL to your clipboard
4. ✅ Opens your Supabase SQL Editor in the browser
5. ✅ Provides step-by-step instructions

**When to use**:

- First time setting up the project
- After creating a new Supabase project
- When you need to recreate the database schema

**Requirements**:

- `.env.local` file must exist with Supabase credentials
- Internet connection to access Supabase
- macOS/Linux (uses bash)

---

### 🧹 clean.js - Deep Clean Script

**Purpose**: Performs a complete cleanup and rebuild of the project

**Usage**:

```bash
npm run clean
# or
node scripts/clean.js
```

**What it does**:

1. 🗑️ Removes all build artifacts (`dist`, `build`, `.remix`, `.wrangler`)
2. 🧹 Clears all caches (Vite, Remix, Wrangler, ESLint)
3. 📦 Removes `node_modules` directory
4. 🔄 Removes `pnpm-lock.yaml`
5. 🧼 Prunes pnpm store
6. 📥 Reinstalls all dependencies fresh
7. 🏗️ Rebuilds the entire project
8. ✅ Verifies types and build

**When to use**:

- Build errors that won't go away
- Dependency conflicts
- After switching branches with different dependencies
- Strange runtime errors
- Before deployment to ensure clean build
- After major package updates

**Time**: Typically takes 3-5 minutes

**Requirements**:

- Node.js >= 20.0.0
- pnpm installed
- Internet connection (to download packages)

---

### 📄 schema.sql - Database Schema

**Purpose**: Complete SQL schema for Supabase database (for NEW installations)

**Contains**:

- **Tables**: users, chats
- **Row Level Security (RLS)**: Policies for data access
- **Triggers**: Auto-update timestamps
- **Functions**: User profile creation on signup
- **Indexes**: Performance optimizations

**Usage**:

1. Copy the entire file contents
2. Go to Supabase SQL Editor: https://app.supabase.com/project/_/sql
3. Paste and run

**Or use the setup script** (recommended):

```bash
npm run setup
```

**Schema includes**:

- ✅ User authentication integration
- ✅ Chat history storage
- ✅ Secure access policies

**Note**: For existing databases that need updates, see `migrations/` folder instead.

---

### 🔄 migrations/ - Database Migrations

**Purpose**: Incremental SQL updates for existing Supabase databases

**When to use**:

- You already have a database set up with the old schema
- You encounter constraint errors when syncing chats
- You need to update specific tables without recreating everything
- You want to apply schema changes to production databases safely

**When NOT to use**:

- Fresh Supabase project → Use `schema.sql` instead
- First-time setup → Use `npm run setup` instead

**How to apply**:

1. Navigate to `scripts/migrations/` folder
2. Read the migration's README for instructions
3. Apply migrations in order (001, 002, etc.)
4. Verify changes in Supabase dashboard

**Current migrations**:

- `001_fix_chats_unique_constraint.sql` - Fixes chat table constraint mismatch
- `002_remove_legacy_project_tables.sql` - Removes old project tables and chat project references

**Detailed instructions**: See `migrations/README.md`

**Example**:

```bash
# Manual application (recommended)
# 1. Copy migration file contents
# 2. Paste in Supabase SQL Editor
# 3. Execute and verify

# Or using Supabase CLI
supabase db execute --file scripts/migrations/001_fix_chats_unique_constraint.sql
```

---

## 🎯 Quick Reference

| Command               | Purpose                               | Time    | Risk     |
| --------------------- | ------------------------------------- | ------- | -------- |
| `npm run setup`       | Initial database setup (new installs) | 1-2 min | Low      |
| `migrations/*.sql`    | Update existing database schema       | 1-2 min | Medium\* |
| `npm run clean`       | Deep clean & rebuild                  | 3-5 min | Low      |
| `npm run clean:cache` | Quick cache clear                     | <1 min  | None     |
| `npm run clean:build` | Remove build files only               | <1 min  | None     |
| `npm run setup:help`  | View setup guide                      | Instant | None     |

\* _Always backup before running migrations on production databases_

---

## 🔧 Additional Commands

### Quick Cache Clear

```bash
npm run clean:cache
```

Removes only cache directories without reinstalling dependencies.

### Clean Build Only

```bash
npm run clean:build
```

Removes only build output directories.

### View Setup Guide

```bash
npm run setup:help
```

Displays the complete setup guide in your terminal.

---

## 📊 Database Setup Workflow

### For New Supabase Projects

```
1. Create new Supabase project
2. Run: npm run setup
   → This will execute schema.sql
3. Verify tables in Supabase dashboard
4. Start developing!
```

### For Existing Databases That Need Updates

```
1. Check if migration is needed
   → Look in migrations/README.md for symptoms
2. Backup your database (important!)
3. Apply migration from migrations/ folder
   → Copy SQL and paste in Supabase SQL Editor
4. Verify changes
5. Continue developing
```

### Migration vs Schema Decision Tree

```
┌─────────────────────────────────────┐
│ Do you have an existing database?   │
└─────────────┬───────────────────────┘
              │
        ┌─────┴─────┐
        │           │
       YES         NO
        │           │
        │           └──→ Use schema.sql
        │                (npm run setup)
        │
        ├─→ Are you getting constraint errors?
        │   Or need to update specific tables?
        │           │
        │     ┌─────┴─────┐
        │     │           │
        │    YES         NO
        │     │           │
        │     │           └──→ Continue as is
        │     │
        │     └──→ Use migrations/
        │          (Apply in order: 001, 002, etc.)
        │
        └─→ Want to start fresh?
            └──→ Drop all tables, then use schema.sql
```

---

## 🐛 Troubleshooting

### "Permission denied" when running scripts

**Solution**:

```bash
chmod +x scripts/*.sh
```

### "Command not found" errors

**Problem**: Script path or Node.js not found

**Solution**:

```bash
# Make sure you're in project root
cd /path/to/bolt.diy_V2.0

# Verify Node.js is installed
node --version

# Run script with explicit node
node scripts/clean.js
```

### Clean script fails during dependency install

**Problem**: Network issues or corrupted pnpm cache

**Solution**:

```bash
# Clear pnpm cache manually
pnpm store prune
rm -rf ~/.pnpm-store

# Try clean script again
npm run clean
```

### Setup script can't find .env.local

**Problem**: Environment file not created

**Solution**:

```bash
# Create from example
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

---

## 📚 Learn More

- **Complete Setup Guide**: See `../SETUP_GUIDE.md`
- **Environment Variables**: See `../.env.example`
- **Multi-Model Setup**: See `../MULTI_MODEL_IMPLEMENTATION_SUMMARY.md`
- **Project README**: See `../README.md`

---

## 🤝 Contributing

If you improve these scripts or add new ones:

1. Document them in this README
2. Add usage examples
3. Include error handling
4. Test on multiple platforms if possible
5. Update package.json scripts

---

## ⚠️ Important Notes

### Destructive Operations

The `clean.js` script is **destructive** - it will:

- Delete your `node_modules` (safe - will be reinstalled)
- Remove all build output (safe - will be rebuilt)
- Clear all caches (safe)

It will **NOT** delete:

- Your source code
- Your `.env.local` file
- Your git history
- Any of your project files

### Windows Compatibility

The bash scripts (`.sh`) may not work on Windows. Use:

- **Git Bash** (comes with Git for Windows)
- **WSL (Windows Subsystem for Linux)**
- Or the Node.js alternatives (`.js` files)

### CI/CD Usage

These scripts work great in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Setup Database
  run: ./scripts/setup.sh
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

- name: Clean Build
  run: npm run clean
```

---

**Last Updated**: October 2025  
**Version**: 2.0.0  
**Maintained by**: [@Stijnus](https://github.com/Stijnus)
