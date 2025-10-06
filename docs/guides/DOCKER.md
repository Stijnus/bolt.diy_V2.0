---
layout: default
title: Docker Guide
nav_order: 4
parent: Guides
---

# Docker Deployment Guide

Comprehensive guide for running BoltDIY V2.0 in Docker containers for development, testing, and self-hosting.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Mode](#development-mode)
- [Production Mode](#production-mode)
- [Environment Variables](#environment-variables)
- [Docker Commands](#docker-commands)
- [Troubleshooting](#troubleshooting)
- [Self-Hosting](#self-hosting)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### Required Software
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: For cloning the repository

### System Requirements
- **RAM**: Minimum 4GB, recommended 8GB+
- **Disk**: 5GB free space
- **OS**: Linux, macOS, or Windows with WSL2

### Installation
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/bolt.diy_V2.0.git
cd bolt.diy_V2.0

# Copy environment file
cp .env.example .env.local
```

### 2. Configure Environment
Edit `.env.local` with your API keys (see [Environment Variables](#environment-variables) section).

### 3. Start Development
```bash
# Start development server
pnpm run docker:dev

# Or using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Access the application at `http://localhost:5173`

## Development Mode

Development mode includes hot module replacement (HMR), source maps, and live reloading.

### Start Development Server
```bash
# Using npm script (recommended)
pnpm run docker:dev

# Or using docker-compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run in background
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Development Features
- **Hot Reload**: Changes to source files automatically reload
- **Debug Mode**: `VITE_LOG_LEVEL=debug` enabled
- **Volume Mounts**: Source code mounted for live editing
- **Port Mapping**:
  - `5173` - Vite dev server
  - `24678` - HMR websocket

### Editing Files
Files are mounted from your host machine, so you can edit with your preferred IDE:
```bash
# Edit files locally
vim app/routes/_index.tsx

# Changes automatically reload in container
```

### View Logs
```bash
# Follow all logs
pnpm run docker:logs

# Or
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

## Production Mode

Production mode uses optimized builds with minification and compression.

### Build Production Image
```bash
# Build production image
pnpm run docker:build

# Or using docker directly
docker build -t boltdiy-v2:latest .
```

### Start Production Server
```bash
# Using npm script
pnpm run docker:prod

# Or using docker-compose
docker-compose up

# Run in background
pnpm run docker:up
```

Access the application at `http://localhost:8788`

### Production Features
- **Optimized Build**: Minified and tree-shaken code
- **Multi-stage Build**: Smaller image size (~200MB vs 1GB+)
- **Health Checks**: Automatic health monitoring
- **Restart Policy**: Auto-restart on failure

## Environment Variables

### Required Variables
Create `.env.local` with these required variables:

```bash
# Anthropic (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Supabase (REQUIRED for auth/database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional AI Provider Variables
```bash
# OpenAI (OPTIONAL)
OPENAI_API_KEY=sk-xxxxx

# Google AI (OPTIONAL)
GOOGLE_API_KEY=xxxxx

# DeepSeek (OPTIONAL)
DEEPSEEK_API_KEY=xxxxx

# xAI (OPTIONAL)
XAI_API_KEY=xxxxx

# Mistral (OPTIONAL)
MISTRAL_API_KEY=xxxxx
```

### Development Variables
```bash
# Logging
VITE_LOG_LEVEL=debug

# Port configuration
PORT=8788          # Production port
DEV_PORT=5173      # Development port
```

## Docker Commands

### Available NPM Scripts
```bash
# Build Commands
pnpm run docker:build        # Build production image
pnpm run docker:build:dev    # Build development image

# Run Commands
pnpm run docker:dev          # Start development mode
pnpm run docker:prod         # Start production mode
pnpm run docker:up           # Start in background (detached)
pnpm run docker:down         # Stop and remove containers

# Utility Commands
pnpm run docker:logs         # View logs
pnpm run docker:clean        # Clean containers and images
```

### Raw Docker Commands
```bash
# Build
docker build -t boltdiy-v2:latest .
docker build --target development -t boltdiy-v2:dev .

# Run
docker run -p 8788:8788 --env-file .env.local boltdiy-v2:latest
docker run -p 5173:5173 --env-file .env.local boltdiy-v2:dev

# Inspect
docker ps                    # List running containers
docker images                # List images
docker logs <container-id>   # View container logs
docker exec -it <container-id> sh  # Shell into container

# Clean
docker stop $(docker ps -aq)       # Stop all containers
docker rm $(docker ps -aq)         # Remove all containers
docker rmi boltdiy-v2:latest       # Remove image
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :5173
lsof -i :8788

# Kill process
kill -9 <PID>

# Or use different port
DEV_PORT=3000 pnpm run docker:dev
```

#### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Verify environment file
cat .env.local

# Remove and rebuild
pnpm run docker:down
pnpm run docker:clean
pnpm run docker:build
```

#### Hot Reload Not Working
```bash
# On macOS/Windows, add polling
# In docker-compose.dev.yml, these are already set:
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

#### Build Failures
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t boltdiy-v2:latest .

# Check disk space
docker system df
```

#### Permission Denied
```bash
# On Linux, add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo
sudo docker-compose up
```

### Debug Mode
```bash
# Run with verbose output
docker-compose --verbose up

# Check container health
docker inspect <container-id> | grep -A 10 Health

# Shell into running container
docker exec -it boltdiy-v2-app sh

# View environment variables
docker exec boltdiy-v2-app env
```

## Self-Hosting

### Production Deployment

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clone and Configure
```bash
# Clone repository
git clone https://github.com/yourusername/bolt.diy_V2.0.git
cd bolt.diy_V2.0

# Configure environment
cp .env.example .env.local
nano .env.local  # Add your API keys
```

#### 3. Setup Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/boltdiy
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8788;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. SSL with Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

#### 5. Start Application
```bash
# Start in production mode
pnpm run docker:up

# Verify running
docker ps

# Check logs
pnpm run docker:logs
```

### Using Docker Registry

#### GitHub Container Registry
```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image
docker tag boltdiy-v2:latest ghcr.io/username/boltdiy-v2:latest

# Push image
docker push ghcr.io/username/boltdiy-v2:latest

# Pull and run on server
docker pull ghcr.io/username/boltdiy-v2:latest
docker run -p 8788:8788 --env-file .env.local ghcr.io/username/boltdiy-v2:latest
```

## Advanced Configuration

### Custom Build Args
```bash
# Build with custom Node version
docker build --build-arg NODE_VERSION=20 -t boltdiy-v2:latest .

# Build for different platform
docker build --platform linux/amd64 -t boltdiy-v2:latest .
```

### Multi-Platform Builds
```bash
# Setup buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/username/boltdiy-v2:latest \
  --push .
```

### Resource Limits
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Custom Network
```bash
# Create custom network
docker network create boltdiy-network

# Run container on custom network
docker run --network boltdiy-network \
  -p 8788:8788 \
  --env-file .env.local \
  boltdiy-v2:latest
```

### Persistent Data
```yaml
# docker-compose.yml
volumes:
  app_data:
    driver: local

services:
  app:
    volumes:
      - app_data:/app/data
```

## Best Practices

### Security
1. **Never commit `.env.local`** to version control
2. **Rotate API keys** regularly
3. **Use secrets management** for production (Docker secrets, Vault)
4. **Run as non-root user** (already configured in Dockerfile)
5. **Keep images updated** with security patches

### Performance
1. **Use multi-stage builds** (already implemented)
2. **Minimize layers** - combine RUN commands
3. **Leverage build cache** - order COPY commands properly
4. **Use .dockerignore** - exclude unnecessary files

### Monitoring
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Inspect container
docker inspect boltdiy-v2-app

# View processes
docker top boltdiy-v2-app
```

## Additional Resources

- [Official Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Remix Deployment Guide](https://remix.run/docs/en/main/guides/deployment)

## Support

For issues or questions:
- GitHub Issues: [bolt.diy_V2.0/issues](https://github.com/yourusername/bolt.diy_V2.0/issues)
- Documentation: [https://yourusername.github.io/bolt.diy_V2.0](https://yourusername.github.io/bolt.diy_V2.0)
