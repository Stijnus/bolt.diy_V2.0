import { env } from 'node:process';
import { PROVIDER_CONFIGS } from './model-config';
import type { AIProvider } from './providers/types';

/**
 * Get the API key for a specific provider.
 *
 * @deprecated Use getProviderApiKey from provider-factory instead.
 */
export function getAPIKey(cloudflareEnv: Env, provider: AIProvider = 'anthropic'): string {
  const config = PROVIDER_CONFIGS[provider];

  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const envVar = config.apiKeyEnvVar;

  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `env`.
   */
  return env[envVar] || (cloudflareEnv as any)[envVar];
}

/**
 * Get Anthropic API key (for backward compatibility).
 */
export function getAnthropicAPIKey(cloudflareEnv: Env): string {
  return getAPIKey(cloudflareEnv, 'anthropic');
}
