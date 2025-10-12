import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { PROVIDER_CONFIGS } from '~/lib/.server/llm/model-config';
import type { AIProvider, ModelInfo, ProviderConfig } from '~/lib/.server/llm/providers/types';

/**
 * GET /api/models/full
 * Returns full curated model lists per provider, filtered by which API keys are configured.
 * If a provider API key is not present (via headers or env), it will be omitted.
 */

function getEnvVar(env: any, key: string): string | undefined {
  return env?.[key] || process.env[key];
}

function getHeaderKey(request: Request, provider: string): string | undefined {
  const h = request.headers;
  return (h.get(`x-api-key-${provider}`) || h.get(`${provider}-api-key`) || undefined) as string | undefined;
}

function hasProviderKey(request: Request, env: any, providerConfig: ProviderConfig): boolean {
  const headerKey = getHeaderKey(request, providerConfig.id);
  const envKey = getEnvVar(env, providerConfig.apiKeyEnvVar);

  return Boolean(headerKey || envKey);
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const env = (context as any)?.cloudflare?.env as any;

  // Build response with models per provider only when the key is available
  const modelsByProvider: Partial<Record<AIProvider, ModelInfo[]>> = {};

  for (const [id, cfg] of Object.entries(PROVIDER_CONFIGS) as [AIProvider, ProviderConfig][]) {
    if (hasProviderKey(request, env, cfg)) {
      // Ensure each model has the provider field set correctly (defensive copy)
      modelsByProvider[id] = cfg.models.map((m) => ({ ...m, provider: id }));
    }
  }

  return json({ modelsByProvider });
}
