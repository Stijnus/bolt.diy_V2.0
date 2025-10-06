# 🛠️ BoltDIY V2.0 - Scripts Documentation

This directory contains utility scripts to help with setup, maintenance, and troubleshooting of your BoltDIY project.

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
- Node.js >= 18.18.0
- pnpm installed
- Internet connection (to download packages)

---

### 📄 schema.sql - Database Schema

**Purpose**: Complete SQL schema for Supabase database

**Contains**:
- **Tables**: users, projects, chats, project_collaborators
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
- ✅ Project management
- ✅ Collaboration features
- ✅ Secure access policies

---

### 🖥️ setup-database.js - Node.js Setup Script

**Purpose**: Alternative Node.js version of the setup script

**Usage**:
```bash
node scripts/setup-database.js
```

**What it does**:
1. Validates environment variables
2. Connects to Supabase
3. Attempts to execute schema (with fallback instructions)
4. Verifies table creation
5. Provides next steps

**When to use**:
- When bash scripts don't work (Windows)
- Automated CI/CD pipelines
- Programmatic setup

**Note**: Due to Supabase API limitations, you'll still need to manually run the SQL in most cases. The script provides clear instructions.

---

## 🎯 Quick Reference

| Command | Purpose | Time | Risk |
|---------|---------|------|------|
| `npm run setup` | Initial database setup | 1-2 min | Low |
| `npm run clean` | Deep clean & rebuild | 3-5 min | Low |
| `npm run clean:cache` | Quick cache clear | <1 min | None |
| `npm run clean:build` | Remove build files only | <1 min | None |
| `npm run setup:help` | View setup guide | Instant | None |

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
cd /path/to/bolt-new-enhanced

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
  run: node scripts/setup-database.js
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
