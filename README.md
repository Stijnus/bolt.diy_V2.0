# BoltDIY V2.0 - Enhanced AI Development Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Remix](https://img.shields.io/badge/Built%20with-Remix-blue)](https://remix.run)
[![Powered by AI](https://img.shields.io/badge/Powered%20by-Multi--Model%20AI-green)]()

An enhanced fork of Bolt.new with **multi-model AI support**, **Supabase authentication**, and a modern UI. Build full-stack applications using 19+ cutting-edge AI models from 6 major providers—all in your browser.

## 🚀 What's New in This Fork

This enhanced version extends the original Bolt.new with powerful new features:

### ✨ Key Enhancements

- **🤖 Multi-Model AI Support** - Choose from 19+ models across 6 providers:
  - **Anthropic**: Claude Sonnet 4.5, Claude Sonnet 4
  - **OpenAI**: GPT-5, GPT-4.1, o3, o4-mini, GPT-4o
  - **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash, Experimental
  - **DeepSeek**: V3.2, Reasoner (most cost-effective)
  - **xAI**: Grok Code Fast 1, Grok 3, Grok 4
  - **Mistral**: Codestral 25.08, Large, Small

- **🔐 Supabase Integration** - Full authentication and data persistence:
  - User authentication (sign up, sign in, password reset)
  - Chat history sync across devices
  - Project management with database storage
  - Secure session handling

- **⚙️ Advanced Settings Page** - Complete control over your environment:
  - Model preferences and defaults
  - Provider configuration
  - Migration tools for legacy data
  - Account management

- **🎨 Modern UI Components** - Built with Radix UI and Tailwind:
  - Model selector with capability badges
  - Connection status indicator
  - Enhanced authentication forms
  - Responsive design throughout

## What Makes This Special

Unlike Claude, v0, or ChatGPT, this platform gives you:

- **Full-Stack in the Browser**: Powered by **StackBlitz's WebContainers**:
  - Install and run npm packages (Vite, Next.js, React, etc.)
  - Run Node.js servers
  - Interact with APIs
  - Deploy to production
  - Share via URL

- **AI with Complete Environment Control**: AI models have full access to:
  - Filesystem operations
  - Node.js server management
  - Package manager (npm/pnpm)
  - Terminal commands
  - Browser console

- **Multi-Model Intelligence**: Switch between models for different tasks:
  - Use Claude Sonnet 4.5 for complex architecture
  - Use Grok Code Fast for quick iterations
  - Use DeepSeek for cost-effective development
  - Use Gemini 2.5 Pro for web development

Whether you're a developer, PM, or designer, you can build production-grade applications with ease.

## 📦 Installation & Setup

### Prerequisites

- **Node.js** >= 18.18.0
- **pnpm** 10.18.0 (recommended) or npm
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Stijnus/bolt-new-enhanced.git
   cd bolt-new-enhanced
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your API keys** in `.env.local`:

   **Required:**
   ```bash
   # Anthropic (required for basic functionality)
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

   # Supabase (required for auth and persistence)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   **Optional (add providers you want to use):**
   ```bash
   OPENAI_API_KEY=sk-xxxxx
   GOOGLE_API_KEY=xxxxx
   DEEPSEEK_API_KEY=xxxxx
   XAI_API_KEY=xxxxx
   MISTRAL_API_KEY=xxxxx
   ```

5. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migrations (check `app/lib/migration/` for scripts)
   - Enable authentication providers in Supabase dashboard

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser** to `http://localhost:5173`

### Building for Production

```bash
pnpm build
pnpm preview
```

### Deployment

This project is configured for **Cloudflare Pages**:

```bash
pnpm deploy
```

Make sure to add all environment variables to your Cloudflare Pages settings.

## 🎯 Usage & Tips

### Choosing the Right AI Model

- **Best for Speed**: Grok Code Fast 1, Gemini 2.5 Flash
- **Best for Cost**: DeepSeek V3.2, Grok Code Fast 1
- **Best for Coding**: Claude Sonnet 4.5, GPT-5, Grok Code Fast 1
- **Best for Context**: Gemini 2.5 Pro (1M tokens), Codestral (256K)

### Tips and Tricks

- **Be specific about your stack**: Mention frameworks like Astro, Tailwind, ShadCN in your initial prompt for proper scaffolding.

- **Use the enhance prompt icon**: Click the enhance icon before sending to refine your prompt with AI assistance.

- **Scaffold basics first**: Establish your application's foundation before adding advanced features.

- **Batch simple instructions**: Combine multiple simple requests into one message to save time and API costs.

- **Switch models strategically**: Use fast models for iterations, powerful models for architecture, and cost-effective models for simple tasks.

- **Save your chats**: All conversations are synced to Supabase—access them from any device.

## 🏗️ Project Structure

```
bolt-new-enhanced/
├── app/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── chat/              # Chat interface & model selector
│   │   ├── header/            # Header with connection status
│   │   ├── settings/          # Settings page components
│   │   ├── sidebar/           # Sidebar with chat history
│   │   └── ui/                # Reusable UI components (Radix)
│   ├── lib/
│   │   ├── .server/
│   │   │   └── llm/
│   │   │       ├── providers/ # AI provider configurations
│   │   │       ├── model-config.ts
│   │   │       ├── provider-factory.ts
│   │   │       └── stream-text.ts
│   │   ├── contexts/          # React contexts (Auth)
│   │   ├── persistence/       # IndexedDB & Supabase
│   │   ├── stores/            # Nanostores (model, settings, etc.)
│   │   └── supabase/          # Supabase client setup
│   ├── routes/                # Remix routes
│   │   ├── api.chat.ts        # Chat API with multi-model support
│   │   ├── settings.tsx       # Settings page
│   │   └── projects.tsx       # Projects page
│   └── types/                 # TypeScript type definitions
├── public/                     # Static assets
└── .env.example               # Environment template
```

## 🔧 Tech Stack

- **Framework**: [Remix](https://remix.run) (React + SSR)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com)
- **UI Components**: [Radix UI](https://www.radix-ui.com) + [Tailwind CSS](https://tailwindcss.com)
- **AI SDKs**: [Vercel AI SDK](https://sdk.vercel.ai)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: [Nanostores](https://github.com/nanostores/nanostores)
- **Code Editor**: [CodeMirror 6](https://codemirror.net)
- **Terminal**: [Xterm.js](https://xtermjs.org)
- **Container**: [WebContainers](https://webcontainers.io) by StackBlitz

## 📚 Features in Detail

### Multi-Model AI Support

19+ models from 6 providers, each with unique strengths:

| Provider | Models | Best For | Cost (per 1M tokens) |
|----------|--------|----------|----------------------|
| Anthropic | Claude Sonnet 4.5, 4 | Complex coding, architecture | $3/$15 |
| OpenAI | GPT-5, GPT-4.1, o3, o4-mini | Reasoning, specialized coding | $3-15 |
| Google | Gemini 2.5 Pro, Flash | Web development, large context | $0.15-7.50 |
| DeepSeek | V3.2, Reasoner | Cost-effective, MoE | $0.28/$0.42 |
| xAI | Grok Code Fast 1, 3, 4 | Fast iterations, agentic | $0.20/$1.50 |
| Mistral | Codestral 25.08, Large | Multi-language, speed | $0.30/$0.90 |

### Authentication & Persistence

- **User Accounts**: Sign up with email/password
- **Session Management**: Secure JWT-based authentication
- **Chat History**: All conversations synced to Supabase
- **Projects**: Create and manage multiple projects
- **Cross-Device Sync**: Access your work from anywhere

### Settings Page

- **Model Preferences**: Set default models per provider
- **Provider Configuration**: Manage API keys and settings
- **Migration Tools**: Import data from local storage
- **Account Settings**: Manage profile and preferences

## 🤝 Contributing

Contributions are welcome! Please check out the [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Running Tests

```bash
pnpm test          # Run tests once
pnpm test:watch    # Run tests in watch mode
pnpm typecheck     # Type checking
pnpm lint          # Lint code
pnpm lint:fix      # Fix linting issues
```

## 📖 Documentation

For more detailed information, check out:

- [Multi-Model Implementation](./MULTI_MODEL_IMPLEMENTATION_SUMMARY.md) - Details on AI provider integration
- [TODO.md](./TODO.md) - Current implementation status and roadmap
- [.env.example](./.env.example) - Complete environment variable documentation

## 🐛 Troubleshooting

### Common Issues

**"Missing API key" error:**
- Verify your `.env.local` has the correct API key
- Check that the key format is correct for the provider
- Ensure you're using the right environment variable name

**"Model not found" error:**
- Check that the model ID matches the provider's documentation
- Verify the model is still available (providers may deprecate models)
- Try switching to a different model from the same provider

**Supabase connection issues:**
- Verify your Supabase URL and keys in `.env.local`
- Check that both server-side and client-side (`VITE_*`) variables are set
- Ensure your Supabase project is active and accessible

**Slow AI responses:**
- Some models are slower than others—check model capabilities
- Consider using "fast" models (Grok Code Fast 1, Gemini Flash)
- Check your network connection and provider status

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🙏 Acknowledgments

- Built on [Bolt.new](https://bolt.new) by StackBlitz
- Powered by [WebContainers](https://webcontainers.io)
- UI components from [Radix UI](https://www.radix-ui.com)
- AI SDKs from [Vercel](https://vercel.com)

## 📞 Support

For issues, questions, or feature requests:
- Open an [Issue](https://github.com/Stijnus/bolt-new-enhanced/issues)
- Check existing issues before creating new ones
- Provide detailed information for bug reports

---

**Maintained by:** [@Stijnus](https://github.com/Stijnus)  
**Based on:** [Bolt.new](https://github.com/stackblitz/bolt.new) by StackBlitz  
**Version:** 2.0.0
