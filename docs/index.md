---
layout: default
title: BoltDIY V2.0 Documentation Hub
description: Complete documentation for BoltDIY V2.0 - enhanced AI development platform with multi-model support
---

# 📖 BoltDIY V2.0 Documentation

Welcome to the complete documentation for BoltDIY V2.0 - the enhanced AI development platform with multi-model support, authentication, and modern UI.

## 🚀 Quick Navigation

### 🏁 Getting Started
- **[📋 Complete Setup Guide](../SETUP_GUIDE.md)** - Step-by-step installation and configuration
- **[⚡ Quick Start](../README.md#-installation--setup)** - Fast setup for experienced users
- **[🎯 First Project](#creating-your-first-project)** - Build your first application
- **[🐛 Troubleshooting](./troubleshooting.md)** - Common issues and solutions

### 📚 Features & Guides
- **[🤖 AI Models Guide](./ai-models.md)** - Complete guide to all 19+ supported AI models
- **[🔐 Authentication](./authentication.md)** - User accounts and session management
- **[💾 Data Persistence](./data-persistence.md)** - Chat history and project storage
- **[⚙️ Settings & Configuration](./configuration.md)** - Customize your environment
- **[🎨 UI Components](./DESIGN_SYSTEM.md)** - Design system and components

### 🔧 Technical Documentation
- **[🏗️ Architecture Overview](./CURRENT_ARCHITECTURE.md)** - System architecture and design
- **[🔌 Provider Integration](../MULTI_MODEL_IMPLEMENTATION_SUMMARY.md)** - AI provider implementation details
- **[📊 Project Management](./PROJECT_MANAGEMENT.md)** - Development workflow and planning
- **[🛠️ Contributing](../CONTRIBUTING.md)** - How to contribute to the project

---

## 🌟 What is BoltDIY V2.0?

BoltDIY V2.0 is an enhanced AI-powered development platform that combines the power of multiple AI models with a complete development environment in your browser.

### Key Features

🤖 **Multi-Model AI Support**
- 19+ AI models from 6 major providers
- Switch between models for different tasks
- Cost-effective and powerful options

🔐 **Secure Authentication**
- User accounts with Supabase Auth
- Secure session management
- Cross-device synchronization

💻 **Full Development Environment**
- Powered by StackBlitz WebContainers
- Run Node.js, install packages, deploy apps
- Complete filesystem access for AI

🎨 **Modern UI**
- Built with Radix UI and Tailwind CSS
- Responsive design
- Dark/light theme support

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.18.0
- pnpm 10.18.0 (recommended) or npm
- Supabase account (free tier available)
- At least one AI provider API key

### Installation Overview

1. **[Clone and Install](../SETUP_GUIDE.md#step-1-clone-and-install)** - Get the code and dependencies
2. **[Setup Supabase](../SETUP_GUIDE.md#step-2-create-supabase-project)** - Create your database
3. **[Configure Environment](../SETUP_GUIDE.md#step-4-configure-environment-variables)** - Add API keys
4. **[Initialize Database](../SETUP_GUIDE.md#step-5-set-up-database-the-easy-way-)** - Run our setup script
5. **[Start Developing](../SETUP_GUIDE.md#step-8-start-developing-)** - Launch the application

> 💡 **Need detailed instructions?** Follow our [Complete Setup Guide](../SETUP_GUIDE.md) for step-by-step instructions with troubleshooting.

---

## 🤖 AI Models at a Glance

BoltDIY supports 19+ models across 6 providers:

| Provider | Models | Best For | Cost Range |
|----------|--------|----------|------------|
| **Anthropic** | Claude Sonnet 4.5, 4 | Complex coding, architecture | $3-15/1M tokens |
| **OpenAI** | GPT-5, GPT-4.1, o3, o4-mini | Reasoning, specialized tasks | $3-15/1M tokens |
| **Google** | Gemini 2.5 Pro, Flash | Web dev, large context | $0.15-7.50/1M tokens |
| **DeepSeek** | V3.2, Reasoner | Cost-effective development | $0.28-0.42/1M tokens |
| **xAI** | Grok Code Fast 1, 3, 4 | Fast iterations | $0.20-1.50/1M tokens |
| **Mistral** | Codestral 25.08, Large | Multi-language coding | $0.30-0.90/1M tokens |

**[📖 View Complete AI Models Guide →](./ai-models.md)**

---

## 🎯 Creating Your First Project

Once you have BoltDIY running:

1. **Sign Up**: Create your account using the Sign Up button
2. **Verify Email**: Check your inbox and click the verification link
3. **Start Chatting**: Use the chat interface to describe your project
4. **Choose a Model**: Select the best AI model for your task
5. **Build**: Let AI scaffold your application with full-stack capabilities

### Pro Tips for Success

💡 **Be Specific**: Mention frameworks like "React with Tailwind" or "Next.js with TypeScript"

🔄 **Use the Right Model**: 
- Fast iterations → Grok Code Fast 1
- Complex architecture → Claude Sonnet 4.5
- Cost-effective → DeepSeek V3.2

📝 **Enhance Prompts**: Use the enhance button (✨) to improve your prompts

🏗️ **Scaffold First**: Start with basic structure, then add features

---

## 📊 Architecture Overview

BoltDIY V2.0 is built with modern technologies:

```
Frontend (Remix + React)
├── Authentication (Supabase Auth)
├── AI Models (6 Providers, 19+ Models)
├── WebContainers (StackBlitz)
└── UI Components (Radix + Tailwind)

Backend (Cloudflare Workers)
├── API Routes (/api/chat)
├── Database (Supabase PostgreSQL)
├── File System (WebContainers)
└── Model Routing (Provider Factory)
```

**[🔍 Detailed Architecture →](./CURRENT_ARCHITECTURE.md)**

---

## 🆘 Need Help?

### Quick Links
- **[🐛 Troubleshooting](./troubleshooting.md)** - Common issues and solutions
- **[❓ FAQ](./faq.md)** - Frequently asked questions
- **[💬 GitHub Issues](https://github.com/Stijnus/bolt-new-enhanced/issues)** - Report bugs or request features

### Support Options

1. **Check Documentation**: Most questions are answered in our guides
2. **Search Issues**: Look for existing solutions in GitHub issues
3. **Create New Issue**: Provide detailed information for new problems
4. **Community**: Engage with other users in discussions

---

## 🔗 External Links

- **[Main Repository](https://github.com/Stijnus/bolt-new-enhanced)** - Source code and releases
- **[Supabase Dashboard](https://supabase.com)** - Manage your database
- **[StackBlitz WebContainers](https://webcontainers.io)** - The technology powering our dev environment
- **[Remix Framework](https://remix.run)** - The web framework we use

---

## 📄 License & Credits

**License**: MIT - see [LICENSE](../LICENSE) for details

**Credits**:
- Built on [Bolt.new](https://bolt.new) by StackBlitz
- Enhanced by [@Stijnus](https://github.com/Stijnus)
- Powered by [WebContainers](https://webcontainers.io)
- UI components from [Radix UI](https://www.radix-ui.com)

---

*Last updated: October 2025 | Version 2.0.0*