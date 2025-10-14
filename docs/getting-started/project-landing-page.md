---
layout: default
title: BoltDIY V2.0 - Enhanced AI Development Platform
description: Complete documentation for BoltDIY V2.0 with multi-model AI support, authentication, and modern UI
permalink: /
---

# 🚀 BoltDIY V2.0
## Enhanced AI Development Platform

**The most advanced fork of Bolt.new** - Build full-stack applications using **19+ cutting-edge AI models** from 6 major providers, all with secure authentication and modern UI.

<div class="hero-buttons" style="text-align: center; margin: 2rem 0;">
  <a href="{{ '/docs/' | relative_url }}" class="btn btn-primary">📖 Documentation</a>
  <a href="{{ '/SETUP_GUIDE' | relative_url }}" class="btn btn-secondary">📋 Setup Guide</a>
  <a href="https://github.com/Stijnus/bolt.diy_V2.0" class="btn btn-secondary">🔗 GitHub</a>
</div>

---

## ✨ Key Features

### 🤖 **Multi-Model AI Support**
Choose from **19+ AI models** across 6 major providers:
- **Anthropic**: Claude Sonnet 4.5, Claude Sonnet 4
- **OpenAI**: GPT-5, GPT-4.1, o3, o4-mini, GPT-4o
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash, Experimental
- **DeepSeek**: V3.2, Reasoner (most cost-effective)
- **xAI**: Grok Code Fast 1, Grok 3, Grok 4
- **Mistral**: Codestral 25.08, Large, Small

### 🔐 **Secure Authentication**
- User accounts with Supabase Auth
- Secure session management
- Cross-device synchronization
- Chat history sync across devices

### 💻 **Full Development Environment**
- Powered by StackBlitz WebContainers
- Run Node.js, install packages, deploy apps
- Complete filesystem access for AI
- In-browser terminal and code editor

### 🎨 **Modern UI**
- Built with Radix UI and Tailwind CSS
- Responsive design for all devices
- Dark/light theme support
- Enhanced authentication forms

---

## 🎯 Choose the Right AI Model

| Provider | Best For | Cost Range | Speed |
|----------|----------|------------|-------|
| **🟣 Anthropic** | Complex coding, architecture | $3-15/1M tokens | ⭐⭐⭐ |
| **🔵 OpenAI** | Reasoning, specialized tasks | $3-15/1M tokens | ⭐⭐⭐ |
| **🟢 Google** | Web dev, large context (1M tokens) | $0.15-7.50/1M tokens | ⭐⭐⭐⭐ |
| **🔴 DeepSeek** | Budget-friendly development | $0.28-0.42/1M tokens | ⭐⭐⭐⭐ |
| **⚡ xAI** | Fast iterations, rapid prototyping | $0.20-1.50/1M tokens | ⭐⭐⭐⭐⭐ |
| **🟡 Mistral** | Multi-language coding | $0.30-0.90/1M tokens | ⭐⭐⭐⭐ |

**[🤖 View Complete AI Models Guide →]({{ '/docs/ai-models' | relative_url }})**

---

## 🚀 Quick Start

Get BoltDIY V2.0 running in **5 minutes**:

```bash
# Clone and install
git clone https://github.com/Stijnus/bolt.diy_V2.0.git
cd bolt.diy_V2.0
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start developing
pnpm dev
```

**Need help?** Follow our **[📋 Complete Setup Guide]({{ '/SETUP_GUIDE' | relative_url }})** for detailed instructions with troubleshooting.

---

## 📚 Documentation

### 🏁 **Getting Started**
- **[📋 Complete Setup Guide]({{ '/SETUP_GUIDE' | relative_url }})** - Step-by-step installation
- **[🤖 AI Models Guide]({{ '/docs/ai-models' | relative_url }})** - All 19+ supported models
- **[🐛 Troubleshooting]({{ '/docs/troubleshooting' | relative_url }})** - Common issues & solutions
- **[❓ FAQ]({{ '/docs/faq' | relative_url }})** - Frequently asked questions

### 🔧 **Technical Reference**
- **[📖 Documentation Hub]({{ '/docs/' | relative_url }})** - Complete overview
- **[🏗️ Architecture]({{ '/docs/CURRENT_ARCHITECTURE' | relative_url }})** - System design
- **[🎨 Design System]({{ '/docs/DESIGN_SYSTEM' | relative_url }})** - UI components

---

## 💡 What Makes BoltDIY Special?

Unlike Claude, v0, or ChatGPT, BoltDIY gives you:

**🌐 Full-Stack in the Browser**: Powered by StackBlitz's WebContainers
- Install and run npm packages (Vite, Next.js, React, etc.)
- Run Node.js servers and interact with APIs  
- Deploy to production and share via URL

**🧠 AI with Complete Environment Control**: AI models have full access to:
- Filesystem operations and Node.js server management
- Package manager (npm/pnpm) and terminal commands
- Browser console and debugging tools

**🔀 Multi-Model Intelligence**: Switch between models for different tasks:
- Use **Claude Sonnet 4.5** for complex architecture
- Use **Grok Code Fast** for quick iterations  
- Use **DeepSeek** for cost-effective development
- Use **Gemini 2.5 Pro** for large-scale planning

---

## 🆘 Need Help?

**Quick Support**:
- **[🐛 Troubleshooting Guide]({{ '/docs/troubleshooting' | relative_url }})** - Solve common issues
- **[❓ FAQ]({{ '/docs/faq' | relative_url }})** - Get answers fast
- **[💬 GitHub Issues](https://github.com/Stijnus/bolt.diy_V2.0/issues)** - Report bugs

**Support Process**:
1. Check our documentation (most questions answered here)
2. Search existing GitHub issues for solutions
3. Create a new issue with detailed information
4. Join community discussions

---

## 📄 Credits & License

**License**: MIT - see [LICENSE](https://github.com/Stijnus/bolt.diy_V2.0/blob/main/LICENSE) for details

**Built on**:
- [Bolt.new](https://bolt.new) by StackBlitz
- [WebContainers](https://webcontainers.io) technology
- [Radix UI](https://www.radix-ui.com) components
- [Supabase](https://supabase.com) for auth & database

**Enhanced by**: [@Stijnus](https://github.com/Stijnus) | **Version**: 2.0.0 | **Last Updated**: October 2025

---

<div style="text-align: center; margin: 3rem 0; padding: 2rem; background-color: #f6f8fa; border-radius: 0.5rem;">
  <h3>🎉 Ready to build something amazing?</h3>
  <p>Start with our setup guide and join the community of developers using BoltDIY V2.0</p>
  <a href="{{ '/SETUP_GUIDE' | relative_url }}" class="btn btn-primary">Get Started Now</a>
</div>