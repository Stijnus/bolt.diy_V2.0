---
layout: default
title: Troubleshooting Guide
description: Common issues and step-by-step solutions for BoltDIY V2.0 setup and usage
---

# 🐛 Troubleshooting Guide

This guide covers common issues you might encounter while setting up or using BoltDIY V2.0, along with step-by-step solutions.

## 🚨 Common Setup Issues

### "Missing environment variables" Error

**Symptoms:**
- Application crashes on startup
- Error message about missing API keys
- "ANTHROPIC_API_KEY is required" message

**Solutions:**

1. **Check if `.env.local` exists**:
   ```bash
   ls -la .env.local
   ```
   If not found, create it:
   ```bash
   cp .env.example .env.local
   ```

2. **Verify required variables are set**:
   ```bash
   # Open your .env.local file
   cat .env.local
   ```
   
   Make sure you have at minimum:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Restart the development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   pnpm dev
   ```

---

### Database Connection Issues

**Symptoms:**
- "Could not connect to Supabase" error
- "relation does not exist" errors
- Authentication not working

**Solutions:**

1. **Verify Supabase credentials**:
   - Go to your [Supabase dashboard](https://supabase.com/dashboard)
   - Navigate to Settings → API
   - Copy the correct Project URL and keys
   - Update your `.env.local` file

2. **Check if database schema is installed**:
   ```bash
   # Run our setup script
   ./scripts/setup.sh
   ```
   
   Or manually:
   - Open Supabase SQL Editor
   - Copy contents from `scripts/schema.sql`
   - Paste and run the SQL

3. **Verify Site URL configuration**:
   - In Supabase dashboard: Authentication → URL Configuration
   - Add `http://localhost:5173` to Site URL
   - Add `http://localhost:5173/**` to Redirect URLs

---

### AI Model Errors

**Symptoms:**
- "Model not found" errors
- No models available in selector
- API rate limit errors

**Solutions:**

1. **Verify API keys format**:
   ```bash
   # Anthropic keys start with: sk-ant-api03-
   # OpenAI keys start with: sk-
   # Google keys are alphanumeric
   # DeepSeek keys start with: sk-
   ```

2. **Check API quotas and credits**:
   - Visit each provider's dashboard
   - Verify you have available credits
   - Check for rate limiting or usage caps

3. **Test individual providers**:
   - Start with just Anthropic (required)
   - Add other providers one by one
   - Check which specific provider is failing

---

## 💻 Development Issues

### WebContainer Not Starting

**Symptoms:**
- Terminal doesn't load in projects
- "WebContainer failed to start" error
- File system operations fail

**Solutions:**

1. **Clear browser cache and storage**:
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage and IndexedDB
   - Reload the page

2. **Check browser compatibility**:
   - Use Chrome, Edge, or Firefox (latest versions)
   - Disable browser extensions that might interfere
   - Try incognito/private mode

3. **Network issues**:
   - Check if corporate firewall blocks WebContainer APIs
   - Try different network connection
   - Disable VPN if active

---

### Performance Issues

**Symptoms:**
- Slow AI responses
- Interface freezing
- High CPU/memory usage

**Solutions:**

1. **Switch to faster models**:
   - Use Grok Code Fast 1 for quick responses
   - Use Gemini 2.5 Flash for speed
   - Avoid o3/Reasoner models for simple tasks

2. **Optimize prompts**:
   - Be more specific and concise
   - Break large requests into smaller ones
   - Use appropriate context length

3. **Browser optimization**:
   - Close unused tabs
   - Clear browser cache
   - Disable unnecessary extensions

---

## 🔐 Authentication Issues

### Email Verification Problems

**Symptoms:**
- "Email not confirmed" message
- Can't sign in after registration
- No verification email received

**Solutions:**

1. **Check email and spam folder**:
   - Look in all email folders
   - Wait up to 10 minutes for delivery
   - Check if email provider blocks automated emails

2. **Resend verification**:
   - Click "Resend" on the login page
   - Or use Supabase dashboard to manually verify user

3. **Configure email settings in Supabase**:
   - Go to Authentication → Email Templates
   - Verify email settings are correct
   - Check SMTP configuration if using custom email

---

### Session Issues

**Symptoms:**
- Keeps asking to log in
- "Session expired" errors
- Can't stay logged in

**Solutions:**

1. **Check browser settings**:
   - Ensure cookies are enabled
   - Disable "Clear cookies on exit"
   - Allow third-party cookies for Supabase

2. **Verify Supabase JWT settings**:
   - Go to Authentication → Settings
   - Check JWT expiry time
   - Verify Site URL is correctly set

---

## 📱 Browser-Specific Issues

### Chrome/Chromium
- Clear site data: Settings → Privacy → Site Settings
- Disable AdBlock for localhost
- Check if "Secure Cookies" is causing issues

### Firefox
- Clear storage: DevTools → Storage → Clear All
- Check if Enhanced Tracking Protection interferes
- Disable strict cookie policy for localhost

### Safari
- Enable Web Developer tools
- Clear all website data
- Allow all cookies temporarily for testing

---

## 🛠️ Development Server Issues

### Port Already in Use

**Symptoms:**
- "Port 5173 is already in use"
- Server won't start

**Solutions:**

```bash
# Find process using port 5173
lsof -i :5173

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port
pnpm dev --port 3000
```

---

### Module Resolution Errors

**Symptoms:**
- "Module not found" errors
- Import/export issues
- TypeScript errors

**Solutions:**

1. **Clear cache and reinstall**:
   ```bash
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install
   ```

2. **Check Node.js version**:
   ```bash
   node --version
   # Should be >= 20.0.0
   ```

3. **Clear build cache**:
   ```bash
   rm -rf .cache
   rm -rf dist
   pnpm build
   ```

---

## 📊 Debugging Tools

### Browser DevTools

**Console Errors**:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Copy full error text for support

**Network Issues**:
1. Go to Network tab in DevTools
2. Reload page and reproduce issue
3. Look for failed requests (red entries)
4. Check response details

### Application Logs

**Server Logs**:
```bash
# In terminal where you run pnpm dev
# Look for error messages
# Check API response codes
```

**Supabase Logs**:
- Go to Supabase dashboard
- Navigate to Logs section
- Filter by error level
- Look for authentication/database errors

---

## 🔍 Getting More Help

### Information to Collect

When asking for help, please provide:

1. **Environment Details**:
   ```bash
   node --version
   pnpm --version
   # Or npm --version
   ```

2. **Error Messages**:
   - Full error text from console
   - Screenshots if helpful
   - Steps to reproduce the issue

3. **Configuration**:
   - Which providers/models you're using
   - Browser and version
   - Operating system

### Support Channels

1. **Check Existing Issues**:
   - Search [GitHub Issues](https://github.com/Stijnus/bolt.diy_V2.0/issues)
   - Look for similar problems and solutions

2. **Create New Issue**:
   - Use issue templates if available
   - Provide all relevant information
   - Include steps to reproduce

3. **Community Help**:
   - Check discussions in the repository
   - Look for community solutions
   - Share your own fixes to help others

---

## ⚡ Quick Fixes

### Reset Everything
```bash
# Nuclear option - reset everything
rm -rf node_modules
rm -rf .cache
rm -rf dist
rm .env.local

# Start fresh
cp .env.example .env.local
# Edit .env.local with your keys
pnpm install
pnpm dev
```

### Emergency Backup
```bash
# Before making major changes, backup your config
cp .env.local .env.backup
cp -r docs docs.backup

# If things break, restore
cp .env.backup .env.local
```

### Health Check Script
```bash
# Create a simple health check
echo "Checking Node.js version:"
node --version

echo "Checking pnpm:"
pnpm --version

echo "Checking environment file:"
ls -la .env.local

echo "Checking dependencies:"
pnpm list --depth=0
```

---

## 📞 Still Need Help?

If none of these solutions work:

1. **Document your issue**: Write down exactly what you did and what happened
2. **Try minimal reproduction**: Start with a fresh clone and minimal configuration  
3. **Check system requirements**: Ensure your system meets all prerequisites
4. **Ask for help**: Create a detailed GitHub issue with all the information above

Remember: Most issues are configuration-related and can be solved by carefully following the [Setup Guide](../SETUP_GUIDE.md) again from the beginning.

---

*[← Back to Documentation Hub](./index.md)*