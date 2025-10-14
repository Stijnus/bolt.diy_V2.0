# Deployment Documentation

Documentation for deploying BoltDIY V2.0 in production environments.

## Contents

### Deployment Platforms
- **[GitHub Pages Setup](./GITHUB_PAGES_SETUP.md)** - Deploying to GitHub Pages

## Deployment Options

BoltDIY V2.0 supports several deployment platforms:

### Recommended: Cloudflare Pages
- **Primary target platform** - Built for Cloudflare Pages/Workers
- **Automatic deployments** from GitHub
- **Edge computing** with global distribution
- **Serverless functions** for API routes

### Alternative: GitHub Pages
- **Static site hosting** - For documentation and simple deployments
- **Custom domains** supported
- **GitHub Actions** integration for CI/CD

### Development Deployment
For development and testing:
```bash
pnpm build
pnpm preview
```

## Production Requirements

- Node.js ≥ 20
- Supabase project configured
- AI provider API keys
- Environment variables configured
- Domain name (optional)

---

[← Back to Documentation Home](../index.md)