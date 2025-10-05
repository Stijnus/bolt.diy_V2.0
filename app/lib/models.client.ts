/**
 * Client-side model registry.
 * This mirrors the server-side configuration for the UI.
 */
import type { AIProvider, ModelInfo, ProviderInfo } from '~/types/model';

export const MODELS: Record<AIProvider, ModelInfo[]> = {
  anthropic: [
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      description: 'Best overall coding model with 30+ hour autonomy',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: { vision: true, tools: true, reasoning: true, coding: true },
      pricing: { input: 3, output: 15 },
      isDefault: true,
    },
    {
      id: 'claude-sonnet-4-20250514',
      name: 'Claude Sonnet 4',
      description: 'Previous generation, highly capable',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: { vision: true, tools: true, coding: true },
      pricing: { input: 3, output: 15 },
    },
    {
      id: 'claude-3-5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet (Legacy)',
      description: 'Legacy model kept for backward compatibility',
      provider: 'anthropic',
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: { vision: true, tools: true, coding: true },
      pricing: { input: 3, output: 15 },
    },
  ],
  openai: [
    {
      id: 'gpt-5',
      name: 'GPT-5',
      description: 'Smartest model with built-in thinking',
      provider: 'openai',
      maxTokens: 16384,
      contextWindow: 128000,
      capabilities: { vision: true, tools: true, reasoning: true, coding: true },
      pricing: { input: 5, output: 15 },
      isDefault: true,
    },
    {
      id: 'gpt-4.1',
      name: 'GPT-4.1',
      description: 'Specialized for coding tasks',
      provider: 'openai',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { vision: true, tools: true, coding: true },
      pricing: { input: 3, output: 12 },
    },
    {
      id: 'o3',
      name: 'OpenAI o3',
      description: 'Advanced reasoning model',
      provider: 'openai',
      maxTokens: 100000,
      contextWindow: 128000,
      capabilities: { tools: true, reasoning: true, coding: true },
      pricing: { input: 10, output: 40 },
    },
    {
      id: 'o4-mini',
      name: 'OpenAI o4-mini',
      description: 'Fast, cost-efficient reasoning model',
      provider: 'openai',
      maxTokens: 65536,
      contextWindow: 128000,
      capabilities: { tools: true, reasoning: true, coding: true, fast: true },
      pricing: { input: 1.1, output: 4.4 },
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Multimodal model with strong general capabilities',
      provider: 'openai',
      maxTokens: 16384,
      contextWindow: 128000,
      capabilities: { vision: true, tools: true, coding: true },
      pricing: { input: 2.5, output: 10 },
    },
  ],
  google: [
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      description: '#1 on WebDev Arena with 1M context',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 1000000,
      capabilities: { vision: true, tools: true, reasoning: true, coding: true },
      pricing: { input: 2.5, output: 10 },
      isDefault: true,
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Fast and cost-effective',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 1000000,
      capabilities: { vision: true, tools: true, coding: true, fast: true },
      pricing: { input: 0.15, output: 0.6 },
    },
    {
      id: 'gemini-exp-1206',
      name: 'Gemini Experimental',
      description: 'Latest experimental model with cutting-edge capabilities',
      provider: 'google',
      maxTokens: 8192,
      contextWindow: 2000000,
      capabilities: { vision: true, tools: true, reasoning: true, coding: true },
      pricing: { input: 2.5, output: 10 },
    },
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek V3.2',
      description: 'Cost-effective with excellence in math & code',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 64000,
      capabilities: { tools: true, reasoning: true, coding: true, fast: true },
      pricing: { input: 0.28, output: 0.42, cachedInput: 0.028 },
      isDefault: true,
    },
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek Reasoner',
      description: 'Advanced reasoning model',
      provider: 'deepseek',
      maxTokens: 8192,
      contextWindow: 64000,
      capabilities: { tools: true, reasoning: true, coding: true },
      pricing: { input: 0.55, output: 2.19, cachedInput: 0.14 },
    },
  ],
  xai: [
    {
      id: 'grok-code-fast-1',
      name: 'Grok Code Fast 1',
      description: 'Speedy and economical agentic coding',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: { tools: true, reasoning: true, coding: true, fast: true },
      pricing: { input: 0.2, output: 1.5, cachedInput: 0.02 },
      isDefault: true,
    },
    {
      id: 'grok-3',
      name: 'Grok 3',
      description: 'Advanced reasoning and coding',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: { tools: true, reasoning: true, coding: true },
      pricing: { input: 2, output: 10 },
    },
    {
      id: 'grok-4',
      name: 'Grok 4',
      description: 'Most intelligent Grok model with native tool use',
      provider: 'xai',
      maxTokens: 8192,
      contextWindow: 131072,
      capabilities: { vision: true, tools: true, reasoning: true, coding: true },
      pricing: { input: 5, output: 15 },
    },
  ],
  mistral: [
    {
      id: 'codestral-latest',
      name: 'Codestral 25.08',
      description: '2x faster with 80+ languages',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 256000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.3, output: 0.9 },
      isDefault: true,
    },
    {
      id: 'mistral-large-latest',
      name: 'Mistral Large',
      description: 'General-purpose flagship model',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 128000,
      capabilities: { tools: true, reasoning: true, coding: true },
      pricing: { input: 2, output: 6 },
    },
    {
      id: 'mistral-small-latest',
      name: 'Mistral Small',
      description: 'Fast and cost-effective model for simple coding tasks',
      provider: 'mistral',
      maxTokens: 8192,
      contextWindow: 32000,
      capabilities: { tools: true, coding: true, fast: true },
      pricing: { input: 0.2, output: 0.6 },
    },
  ],
};

export const PROVIDERS: ProviderInfo[] = [
  { id: 'anthropic', name: 'Anthropic', models: MODELS.anthropic },
  { id: 'openai', name: 'OpenAI', models: MODELS.openai },
  { id: 'google', name: 'Google', models: MODELS.google },
  { id: 'deepseek', name: 'DeepSeek', models: MODELS.deepseek },
  { id: 'xai', name: 'xAI', models: MODELS.xai },
  { id: 'mistral', name: 'Mistral', models: MODELS.mistral },
];

export function getAllModels(): ModelInfo[] {
  return Object.values(MODELS).flat();
}

export function getProviderModels(provider: AIProvider): ModelInfo[] {
  return MODELS[provider] || [];
}

export function getModel(provider: AIProvider, modelId: string): ModelInfo | undefined {
  return MODELS[provider]?.find((m) => m.id === modelId);
}

export function getDefaultModel(provider: AIProvider): ModelInfo | undefined {
  const models = MODELS[provider] || [];
  return models.find((m) => m.isDefault) || models[0];
}
