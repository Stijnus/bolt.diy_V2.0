---
layout: default
title: Frequently Asked Questions
description: Common questions and answers about BoltDIY V2.0 features, setup, and usage
---

# ❓ Frequently Asked Questions

Common questions and answers about BoltDIY V2.0.

## 🚀 Getting Started

### Q: What is BoltDIY V2.0?
**A:** BoltDIY V2.0 is an enhanced version of Bolt.new that adds multi-model AI support (19+ models from 6 providers), Supabase authentication, cloud-synced chat history, and modern UI components. It's a complete AI development platform that runs in your browser.

### Q: How is this different from the original Bolt.new?
**A:** Key differences include:
- **Multi-Model AI**: 19+ models vs just Claude
- **Authentication**: User accounts with Supabase
- **Cloud Sync**: Chat history saved across devices  
- **Modern UI**: Radix UI components with better UX
- **Enhanced Settings**: Complete configuration control

### Q: Do I need to pay for AI models?
**A:** Yes, you need API keys from AI providers. However:
- Most providers offer free credits to start
- DeepSeek models are extremely cost-effective ($0.14-0.28 per 1M tokens)
- You only pay for what you use
- Many models cost less than $1 per hour of heavy usage

### Q: What's the minimum setup to get started?
**A:** You need:
- Anthropic API key (required)
- Supabase account (free tier)
- Node.js >= 18.18.0
- About 10 minutes for setup

---

## 🤖 AI Models & Providers

### Q: Which AI model should I use?
**A:** Depends on your needs:
- **Fast development**: Grok Code Fast 1, Gemini Flash
- **Complex problems**: Claude Sonnet 4.5, GPT-5
- **Budget-friendly**: DeepSeek V3.2, Reasoner
- **Large codebases**: Gemini 2.5 Pro (1M context), Codestral

### Q: Can I use multiple models in the same project?
**A:** Absolutely! You can switch models mid-conversation. Many users start with fast models for scaffolding, then switch to more powerful models for complex logic.

### Q: What if I only have one API key?
**A:** That's fine! BoltDIY works with just Anthropic. You can add other providers later. The interface will show which models are available based on your API keys.

### Q: Are there free AI models I can use?
**A:** While the models themselves aren't free, many providers offer generous free credits:
- Anthropic: $5 free credits
- OpenAI: $5 free credits for new accounts
- Google: Free tier with quotas
- DeepSeek: Very low costs (often under $1 for extensive use)

### Q: What's the most cost-effective setup?
**A:** For maximum value:
1. **Primary**: DeepSeek V3.2 (90% capability, 10% cost)
2. **Backup**: Anthropic Claude for complex issues
3. **Speed**: Grok Code Fast 1 for iterations
4. **Research**: Google Gemini 2.5 Pro for large context

---

## 🔧 Technical Questions  

### Q: Does this work offline?
**A:** The interface can work offline for viewing existing chats, but AI models require internet connection. WebContainers also need internet for package installations.

### Q: What browsers are supported?
**A:** Modern browsers:
- **Recommended**: Chrome, Edge, Firefox (latest)
- **Limited**: Safari (WebContainer limitations)
- **Not supported**: Internet Explorer, very old browsers

### Q: Can I self-host this?
**A:** Yes! The project is open source. You can:
- Deploy to Cloudflare Pages (recommended)
- Use Vercel, Netlify, or similar platforms
- Self-host on your own servers
- Run locally for development

### Q: What about data privacy?
**A:** Your data privacy depends on:
- **Chat history**: Stored in your Supabase instance (you control)
- **AI requests**: Sent to respective AI providers
- **Projects**: Run locally in WebContainers
- **Code**: Never stored on our servers

### Q: Can I import my existing Bolt.new chats?
**A:** Yes! Use the migration tool in Settings:
1. Go to Settings → Migration
2. Click "Import from Local Storage"
3. Your IndexedDB data will be migrated to Supabase

---

## 🛠️ Development & Projects

### Q: What can I build with BoltDIY?
**A:** Anything you can build with modern web technologies:
- React, Vue, Angular applications
- Node.js servers and APIs  
- Full-stack applications
- Static sites with Astro, Next.js
- Database-backed applications
- Real-time applications with WebSockets

### Q: How do I deploy my projects?
**A:** Projects run in WebContainers and can be:
- Shared via URL (built-in sharing)
- Deployed to Vercel, Netlify, etc.
- Downloaded and deployed manually
- Connected to Git repositories

### Q: Are there any limitations?
**A:** WebContainer limitations:
- No native binaries
- Limited system access
- Node.js focused (no Python, Go, etc.)
- Memory/CPU limits in browser

### Q: Can multiple people work on the same project?
**A:** Currently, projects are single-user. However:
- You can share project URLs
- Export/import project files
- Use version control (Git) for collaboration
- Community features may come in future updates

---

## 🔐 Authentication & Data

### Q: Why do I need a Supabase account?
**A:** Supabase provides:
- User authentication (sign up/sign in)
- Cloud storage for chat history
- Cross-device synchronization
- Project persistence
- Secure session management

### Q: Is my data secure?
**A:** Security measures include:
- JWT-based authentication
- Encrypted connections (HTTPS)
- Data stored in your own Supabase instance
- No data stored on BoltDIY servers
- You control access and permissions

### Q: What if I don't want cloud sync?
**A:** You can:
- Use local-only mode (limited features)
- Run your own Supabase instance
- Fork the project and remove cloud features
- Export/backup your data regularly

### Q: Can I delete my data?
**A:** Yes! You have full control:
- Delete individual chats in the interface
- Clear all data in Settings
- Delete your Supabase project entirely
- Export data before deletion

---

## 💰 Costs & Pricing

### Q: How much does it cost to run BoltDIY?
**A:** Typical costs:
- **Development**: ~$0-5/month (free tiers + light usage)
- **Heavy use**: ~$10-30/month (depends on model choice)
- **Professional**: ~$50+/month (premium models, high usage)

### Q: What's the cheapest way to use this?
**A:** Cost optimization:
1. Use DeepSeek V3.2 primarily ($0.14-0.28 per 1M tokens)
2. Supabase free tier (up to 50MB database)
3. Short, focused prompts
4. Switch to premium models only when needed

### Q: Are there any hidden fees?
**A:** No hidden fees from BoltDIY (it's open source). Costs are:
- AI provider API usage (pay-per-use)
- Supabase hosting (generous free tier)
- Optional: your own hosting costs

---

## 🆘 Troubleshooting

### Q: Why can't I see any AI models?
**A:** Common causes:
- Missing or invalid API keys in `.env.local`
- API keys don't have sufficient credits/quota
- Network issues preventing API calls
- Browser blocking requests

### Q: The application won't start, what should I do?
**A:** Try this checklist:
1. Check Node.js version (`node --version` >= 18.18.0)
2. Verify `.env.local` exists and has required variables
3. Run `pnpm install` to ensure dependencies
4. Clear browser cache and reload
5. Check browser console for errors

### Q: WebContainers won't load, help!
**A:** WebContainer issues:
1. Use supported browser (Chrome/Edge/Firefox)
2. Disable browser extensions
3. Try incognito/private mode
4. Check if corporate firewall blocks WebContainer APIs
5. Clear browser storage and reload

### Q: My chats disappeared, can I recover them?
**A:** Recovery options:
1. Check if you're logged into the same account
2. Look in browser DevTools → Application → IndexedDB
3. Check Supabase dashboard for data
4. Use migration tool if data exists locally
5. Contact support with details

---

## 🔄 Updates & Maintenance

### Q: How do I update to the latest version?
**A:** For self-hosted installations:
```bash
git pull origin main
pnpm install
pnpm build
```

### Q: What if something breaks after an update?
**A:** Rollback steps:
1. Check the changelog for breaking changes
2. Update your environment variables if needed
3. Clear cache and rebuild: `rm -rf node_modules && pnpm install`
4. If still broken, revert: `git checkout previous-working-commit`

### Q: How can I contribute to the project?
**A:** Ways to contribute:
- Report bugs and issues
- Submit feature requests  
- Contribute code via pull requests
- Improve documentation
- Help other users in discussions
- Share your projects and experiences

---

## 🔗 Resources & Links

### Q: Where can I get help?
**A:** Support resources:
- **Documentation**: [docs/index.md](./index.md)
- **Setup Guide**: [SETUP_GUIDE.md](../SETUP_GUIDE.md)
- **Troubleshooting**: [troubleshooting.md](./troubleshooting.md)
- **GitHub Issues**: [Create new issue](https://github.com/Stijnus/bolt-new-enhanced/issues)
- **Discussions**: Community discussions in repository

### Q: Where can I see examples of what people built?
**A:** Examples and showcases:
- Check GitHub Issues for user projects
- Look for community discussions
- Follow project social media
- Share your own creations!

### Q: How do I stay updated with new features?
**A:** Stay informed:
- Watch the GitHub repository
- Follow project announcements
- Check the changelog regularly
- Join community discussions

---

*Have a question not covered here? [Create an issue](https://github.com/Stijnus/bolt-new-enhanced/issues) or check our [complete documentation](./index.md).*

---

*[← Back to Documentation Hub](./index.md)*