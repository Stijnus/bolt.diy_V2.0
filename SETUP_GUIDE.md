# 🚀 BoltDIY V2.0 - Complete Setup Guide

This guide will help you set up BoltDIY V2.0 from scratch in just a few minutes!

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** >= 18.18.0 ([Download here](https://nodejs.org/))
- **pnpm** 10.18.0 or later (`npm install -g pnpm`)
- A **Supabase account** (free tier works great!) - [Sign up here](https://supabase.com)
- At least one **AI provider API key** (Anthropic required, others optional)

## 🎯 Quick Start (5 Minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/Stijnus/bolt-new-enhanced.git
cd bolt-new-enhanced

# Install dependencies
pnpm install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: BoltDIY (or whatever you like)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to you
4. Click "Create new project" and wait ~2 minutes for it to initialize

### Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, click the **Settings** gear icon (bottom left)
2. Go to **API** section
3. Copy these values (you'll need them next):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the shorter one)
   - **service_role** key (the longer one - keep this secret!)

### Step 4: Configure Environment Variables

```bash
# Create your environment file
cp .env.example .env.local

# Open .env.local in your editor
# For macOS/Linux:
nano .env.local

# For Windows:
notepad .env.local
```

Fill in at minimum these **required** variables:

```bash
# REQUIRED: Anthropic API (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# REQUIRED: Supabase (server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# REQUIRED: Supabase (client-side - must have VITE_ prefix)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Optional** - Add more AI providers if you want:

```bash
# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-xxxxx

# Google AI (get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=xxxxx

# DeepSeek (get from https://platform.deepseek.com/)
DEEPSEEK_API_KEY=xxxxx

# xAI (get from https://x.ai/api)
XAI_API_KEY=xxxxx

# Mistral (get from https://console.mistral.ai/)
MISTRAL_API_KEY=xxxxx
```

Save and close the file!

### Step 5: Set Up Database (THE EASY WAY 🎉)

We've made this super simple! Just run:

```bash
# Make the setup script executable (macOS/Linux)
chmod +x scripts/setup.sh

# Run the setup script
./scripts/setup.sh
```

**What this does:**
- ✅ Validates your environment variables
- ✅ Copies the database schema SQL to your clipboard
- ✅ Opens your Supabase SQL Editor automatically
- ✅ Gives you clear step-by-step instructions

**Then just:**
1. Paste the SQL (already in your clipboard!)
2. Click "Run"
3. Done! ✨

### Step 6: Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Email** in the list
3. Make sure it's **enabled** (it should be by default)
4. Click **Save**

### Step 7: Configure Site URL

1. Still in **Authentication**, go to **URL Configuration**
2. Add these URLs:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add `http://localhost:5173/**`
3. Click **Save**

### Step 8: Start Developing! 🚀

```bash
# Start the development server
pnpm dev
```

Open your browser to **http://localhost:5173**

You should see the BoltDIY landing page!

### Step 9: Create Your First Account

1. Click **Sign Up** in the top right
2. Enter your email and password
3. Check your email for the confirmation link
4. Click the link to verify
5. You're in! Start building! 🎉

---

## 🐛 Troubleshooting

### "Missing environment variables" error

**Problem**: The app can't find your API keys

**Solution**:
1. Make sure `.env.local` exists in your project root
2. Verify all required variables are set (see Step 4)
3. Restart your development server (`pnpm dev`)

### "Database error" or "relation does not exist"

**Problem**: Database schema wasn't set up correctly

**Solution**:
1. Run the setup script again: `./scripts/setup.sh`
2. Or manually run the SQL:
   - Open `scripts/schema.sql`
   - Copy all contents
   - Go to Supabase SQL Editor
   - Paste and run

### "Email not confirmed" message

**Problem**: You haven't verified your email yet

**Solution**:
1. Check your inbox (and spam folder!)
2. Click the verification link in the email
3. If you didn't receive it, click "Resend" on the login page

### "Could not connect to Supabase"

**Problem**: Your Supabase credentials might be wrong

**Solution**:
1. Double-check your `.env.local` has the correct:
   - `SUPABASE_URL` (must be from your project)
   - `SUPABASE_ANON_KEY` (the public anon key)
2. Make sure you have both regular and `VITE_` prefixed versions
3. Restart your dev server

### "Anthropic API error"

**Problem**: Your Anthropic API key is invalid or expired

**Solution**:
1. Get a new key from https://console.anthropic.com/
2. Make sure you have credits available
3. Update `ANTHROPIC_API_KEY` in `.env.local`
4. Restart your dev server

---

## 🎓 Next Steps

Now that you're set up, here's what you can do:

### Try Different AI Models

1. Click the **model selector** in the chat interface
2. Choose from 19+ models across 6 providers
3. Compare their performance for your use case!

### Create a Project

1. Click **Projects** in the sidebar
2. Click **New Project**
3. Start building your application!

### Customize Settings

1. Click your profile picture → **Settings**
2. Configure:
   - Default AI models
   - Provider preferences
   - Account details

### Import Existing Chats

If you have data in IndexedDB from another Bolt instance:

1. Go to **Settings** → **Migration**
2. Click **Import from Local Storage**
3. Your chats will be synced to Supabase!

---

## 📚 Additional Resources

- **Multi-Model Guide**: See `MULTI_MODEL_IMPLEMENTATION_SUMMARY.md` for details on each AI provider
- **Environment Variables**: See `.env.example` for all available options
- **TODO List**: See `TODO.md` for the roadmap and current status
- **Main README**: See `README.md` for feature overview

---

## 🆘 Still Having Issues?

1. **Check the logs**: Look at your browser console and terminal for error messages
2. **Search existing issues**: https://github.com/Stijnus/bolt-new-enhanced/issues
3. **Open a new issue**: Include:
   - Your error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)
   - Screenshots if relevant

---

## 🎉 Success!

If you made it here and everything is working, congratulations! 🎊

You now have a powerful AI development platform with:
- ✅ Multi-model AI support (19+ models)
- ✅ Secure authentication
- ✅ Cloud-synced chat history
- ✅ Project management
- ✅ In-browser development environment

Happy coding! 🚀

---

**Version**: 2.0.0  
**Last Updated**: October 2025  
**Maintained by**: [@Stijnus](https://github.com/Stijnus)
