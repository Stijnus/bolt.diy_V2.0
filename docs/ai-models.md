---
layout: default
title: AI Models Guide
description: Complete guide to 19+ AI models from 6 major providers supported by BoltDIY V2.0
---

# 🤖 AI Models Guide

BoltDIY V2.0 supports **19+ AI models** from **6 major providers**, giving you unprecedented choice and flexibility for your development needs.

## 🎯 Quick Model Selection Guide

### For Different Use Cases

**🚀 Fast Development & Iterations**
- **Grok Code Fast 1** - Lightning fast responses, great for quick edits
- **Gemini 2.5 Flash** - Speed with Google's reliability

**💡 Complex Architecture & Planning**
- **Claude Sonnet 4.5** - Best reasoning and complex problem solving
- **GPT-5** - Advanced reasoning capabilities
- **Gemini 2.5 Pro** - Excellent for large-scale planning

**💰 Cost-Effective Development**
- **DeepSeek V3.2** - Extremely cost-effective, surprisingly capable
- **DeepSeek Reasoner** - Great reasoning at low cost
- **Grok Code Fast 1** - Fast and affordable

**🌐 Web Development**
- **Gemini 2.5 Pro** - Excellent HTML/CSS/JS understanding
- **Claude Sonnet 4.5** - Great React/Next.js knowledge
- **Codestral 25.08** - Strong in modern frameworks

---

## 📊 Complete Provider Breakdown

### 🟣 Anthropic (Claude)

| Model | Context | Strengths | Cost (Input/Output per 1M tokens) | Best For |
|-------|---------|-----------|-----------------------------------|----------|
| **Claude Sonnet 4.5** | 200K | Best reasoning, excellent coding | $3/$15 | Complex architecture, debugging |
| **Claude Sonnet 4** | 200K | Strong reasoning, reliable | $3/$15 | General development, analysis |

**API Setup**: Get your key at [console.anthropic.com](https://console.anthropic.com/)

**Environment Variable**: `ANTHROPIC_API_KEY=sk-ant-api03-xxxxx`

---

### 🔵 OpenAI (GPT)

| Model | Context | Strengths | Cost (Input/Output per 1M tokens) | Best For |
|-------|---------|-----------|-----------------------------------|----------|
| **GPT-5** | 128K | Advanced reasoning | $3-15 | Complex problem solving |
| **GPT-4.1** | 128K | Reliable, well-tested | $3-15 | General development |
| **o3** | 128K | Specialized reasoning | $15-60 | Mathematical, logical tasks |
| **o4-mini** | 128K | Lighter version | $0.15-0.60 | Quick tasks |
| **GPT-4o** | 128K | Optimized version | $2.50-10 | Balanced performance |

**API Setup**: Get your key at [platform.openai.com](https://platform.openai.com/api-keys)

**Environment Variable**: `OPENAI_API_KEY=sk-xxxxx`

---

### 🟢 Google (Gemini)

| Model | Context | Strengths | Cost (Input/Output per 1M tokens) | Best For |
|-------|---------|-----------|-----------------------------------|----------|
| **Gemini 2.5 Pro** | 1M | Huge context, web knowledge | $1.25/$7.50 | Large projects, research |
| **Gemini 2.5 Flash** | 1M | Speed + large context | $0.075/$0.30 | Fast iterations |
| **Gemini Experimental** | Variable | Latest features | Variable | Testing new capabilities |

**API Setup**: Get your key at [makersuite.google.com](https://makersuite.google.com/app/apikey)

**Environment Variable**: `GOOGLE_API_KEY=xxxxx`

---

### 🔴 DeepSeek (Most Cost-Effective)

| Model | Context | Strengths | Cost (Input/Output per 1M tokens) | Best For |
|-------|---------|-----------|-----------------------------------|----------|
| **DeepSeek V3.2** | 64K | MoE architecture, efficient | $0.14/$0.28 | Budget-conscious development |
| **DeepSeek Reasoner** | 64K | Reasoning capabilities | $0.55/$2.19 | Logical problem solving |

**API Setup**: Get your key at [platform.deepseek.com](https://platform.deepseek.com/)

**Environment Variable**: `DEEPSEEK_API_KEY=xxxxx`

> 💡 **Pro Tip**: DeepSeek models offer exceptional value - often 90% of the capability at 10% of the cost!

---

### ⚡ xAI (Grok)

| Model | Context | Strengths | Cost (Input/Output per 1M tokens) | Best For |
|-------|---------|-----------|-----------------------------------|----------|
| **Grok Code Fast 1** | 128K | Extremely fast responses | $0.50/$1.50 | Rapid prototyping |
| **Grok 3** | 128K | Balanced performance | $1/$3 | General development |
| **Grok 4** | 128K | Advanced capabilities | $2/$6 | Complex tasks |

**API Setup**: Get your key at [x.ai/api](https://x.ai/api)

**Environment Variable**: `XAI_API_KEY=xxxxx`

---

### 🟡 Mistral

| Model | Context | Strengths | Cost (Input/Output per 1M tokens) | Best For |
|-------|---------|-----------|-----------------------------------|----------|
| **Codestral 25.08** | 256K | Large context, multi-lang | $0.30/$0.90 | Large codebases |
| **Mistral Large** | 128K | Strong reasoning | $2/$6 | Complex development |
| **Mistral Small** | 128K | Efficient performance | $0.20/$0.60 | Simple tasks |

**API Setup**: Get your key at [console.mistral.ai](https://console.mistral.ai/)

**Environment Variable**: `MISTRAL_API_KEY=xxxxx`

---

## 🎛️ How to Switch Models

### In the Interface

1. **Open Chat**: Start a new conversation or continue existing
2. **Click Model Selector**: Look for the model dropdown (usually shows current model)
3. **Choose Provider**: Select from Anthropic, OpenAI, Google, etc.
4. **Pick Model**: Choose specific model based on your needs
5. **Start Chatting**: Your messages now use the selected model

### Model Indicators

- **🟢 Green**: Model is available and configured
- **🟡 Yellow**: Model available but may have limitations
- **🔴 Red**: Model not available (API key missing/invalid)

---

## 💡 Best Practices

### Model Selection Strategy

**Start Fast, Scale Up**
1. **Prototype**: Use Grok Code Fast 1 or DeepSeek V3.2 for initial ideas
2. **Refine**: Switch to Claude Sonnet 4.5 for complex logic
3. **Polish**: Use Gemini 2.5 Pro for large-scale refinements

**Cost Optimization**
- **Development**: Use DeepSeek models for most tasks
- **Complex Problems**: Claude Sonnet 4.5 when you need the best
- **Large Context**: Gemini 2.5 Pro for big codebases

### Prompt Optimization

**For Each Provider Type:**

**Claude Models**: 
- Be direct and specific
- Use structured thinking prompts
- Great with "think step by step"

**OpenAI Models**:
- Clear, conversational prompts
- Good with examples and context
- Responds well to system messages

**Google Models**:
- Detailed context works well
- Good with web-related queries
- Excellent for research tasks

**DeepSeek Models**:
- Keep prompts focused
- Great for code generation
- Efficient with clear instructions

**Grok Models**:
- Fast, direct requests
- Good for quick iterations
- Excellent for rapid prototyping

---

## 🔧 Configuration & Troubleshooting

### Adding New Provider Keys

1. **Edit `.env.local`**:
   ```bash
   # Add your new API key
   PROVIDER_API_KEY=your-key-here
   ```

2. **Restart Development Server**:
   ```bash
   pnpm dev
   ```

3. **Verify in Interface**: Check that models show as available (green)

### Common Issues

**"Model not found" Error**
- Verify API key is correct and has proper format
- Check that the model ID matches provider documentation
- Ensure you have sufficient credits/quota

**Slow Responses**
- Some models are inherently slower (o3, Reasoner models)
- Check your internet connection
- Try switching to faster models (Flash, Code Fast)

**Rate Limiting**
- Implement delays between requests
- Consider upgrading your API plan
- Switch to providers with higher limits

### Environment Variables Quick Reference

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Optional (add as needed)
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=xxxxx
DEEPSEEK_API_KEY=xxxxx
XAI_API_KEY=xxxxx
MISTRAL_API_KEY=xxxxx
```

---

## 📈 Performance Comparison

### Speed Rankings (Fastest to Slowest)
1. 🥇 **Grok Code Fast 1** - Lightning fast
2. 🥈 **Gemini 2.5 Flash** - Very fast
3. 🥉 **DeepSeek V3.2** - Fast and cheap
4. **Claude Sonnet 4** - Moderate
5. **GPT-4.1** - Moderate  
6. **Gemini 2.5 Pro** - Slower but powerful
7. **o3/Reasoner models** - Slowest but thoughtful

### Cost Rankings (Cheapest to Most Expensive)
1. 🥇 **DeepSeek V3.2** - $0.14/$0.28 per 1M tokens
2. 🥈 **Gemini 2.5 Flash** - $0.075/$0.30 per 1M tokens
3. 🥉 **Mistral Small** - $0.20/$0.60 per 1M tokens
4. **Grok Code Fast 1** - $0.50/$1.50 per 1M tokens
5. **Claude Sonnet 4.5** - $3/$15 per 1M tokens
6. **GPT-5** - $3-15 per 1M tokens
7. **o3** - $15-60 per 1M tokens

---

## 🚀 Advanced Features

### Model Chaining
- Start with fast model for scaffolding
- Switch to powerful model for complex logic  
- Use cost-effective model for refinements

### Context Management
- **Large Files**: Use Gemini 2.5 Pro (1M context)
- **Code Reviews**: Codestral 25.08 (256K context)
- **Quick Edits**: Most models handle standard contexts well

### Specialized Use Cases
- **Math/Logic**: o3, DeepSeek Reasoner
- **Web Scraping**: Gemini models (web knowledge)
- **API Integration**: Claude models (excellent reasoning)
- **UI/UX**: All models, but Claude excels at design decisions

---

*[← Back to Documentation Hub](./index.md)*