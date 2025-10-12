import { Brain, Zap, Layers, Target, Cpu, Wind, Gem } from 'lucide-react';
import type { AIProvider } from '~/types/model';

export const PROVIDER_CONFIG = {
  anthropic: { icon: Brain, name: 'Anthropic' },
  openai: { icon: Zap, name: 'OpenAI' },
  google: { icon: Layers, name: 'Google' },
  deepseek: { icon: Target, name: 'DeepSeek' },
  xai: { icon: Cpu, name: 'xAI' },
  mistral: { icon: Wind, name: 'Mistral' },
  zai: { icon: Gem, name: 'ZAI (GLM)' },
  groq: { icon: Zap, name: 'Groq' },
} as const;

export type ProviderConfig = typeof PROVIDER_CONFIG;
export type ProviderKey = keyof ProviderConfig;

export function getProviderConfig(provider: AIProvider) {
  return PROVIDER_CONFIG[provider as ProviderKey] || { icon: Layers, name: provider };
}
