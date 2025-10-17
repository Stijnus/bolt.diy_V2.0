import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';

const WEB_CONTAINER_HOST_SUFFIX = '.webcontainer-api.io';
const HOST_PARAM_KEYS = ['host', 'targetHost'] as const;
const PATH_PARAM_KEYS = ['path', 'targetPath'] as const;

function extractWebContainerHost(
  request: Request,
  splatPath: string | undefined,
  explicitHint?: string | null,
): string | null {
  if (isAllowedHost(explicitHint)) {
    return explicitHint;
  }

  const cookieHeader = request.headers.get('cookie') || '';

  if (cookieHeader) {
    const cookies = new Map<string, string>();

    for (const part of cookieHeader.split(';')) {
      const [rawKey, ...rest] = part.split('=');
      const key = rawKey?.trim();

      if (!key) {
        continue;
      }

      const val = rest.join('=').trim();
      cookies.set(key, decodeURIComponent(val));
    }

    const wcHost = cookies.get('wc_host');

    if (isAllowedHost(wcHost)) {
      return wcHost;
    }
  }

  const headerCandidates = [
    request.headers.get('x-webcontainer-host'),
    request.headers.get('origin'),
    request.headers.get('referer'),
  ];

  for (const value of headerCandidates) {
    if (!value) {
      continue;
    }

    try {
      const candidateUrl = new URL(value);

      if (isAllowedHost(candidateUrl.hostname)) {
        return candidateUrl.hostname;
      }

      for (const key of HOST_PARAM_KEYS) {
        const paramHost = candidateUrl.searchParams.get(key);

        if (isAllowedHost(paramHost)) {
          return paramHost;
        }
      }
    } catch {
      // Ignore invalid URLs
    }
  }

  /*
   * When the client fails to provide any hint, fail fast instead of
   * accidentally proxying to an arbitrary host.
   */
  console.warn('Unable to determine WebContainer host for proxy', {
    path: splatPath,
    url: request.url,
  });

  return null;
}

function isAllowedHost(hostname: string | null | undefined): hostname is string {
  if (!hostname) {
    return false;
  }

  // Only allow StackBlitz WebContainer hosts to mitigate SSRF risk.
  return hostname.endsWith(WEB_CONTAINER_HOST_SUFFIX);
}

function createForwardHeaders(original: Headers, targetHost: string) {
  const forwardHeaders = new Headers();

  original.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (['host', 'content-length'].includes(lowerKey)) {
      return;
    }

    if (lowerKey === 'connection') {
      return;
    }

    forwardHeaders.set(key, value);
  });

  // Ensure downstream host sees the correct Host header.
  forwardHeaders.set('host', targetHost);

  return forwardHeaders;
}

async function proxyRequest({ request, params }: LoaderFunctionArgs | ActionFunctionArgs) {
  const splatPath = params['*'];

  if (!splatPath) {
    return new Response('Missing target path', { status: 400 });
  }

  const requestUrl = new URL(request.url);

  const directHostHint = HOST_PARAM_KEYS.map((key) => requestUrl.searchParams.get(key)).find(Boolean);
  const targetHost = extractWebContainerHost(request, splatPath, directHostHint);

  if (!targetHost) {
    return new Response('Missing WebContainer host hint', { status: 400 });
  }

  const pathOverride = PATH_PARAM_KEYS.map((key) => requestUrl.searchParams.get(key)).find(Boolean);

  const forwardSearchParams = new URLSearchParams(requestUrl.searchParams);

  for (const key of HOST_PARAM_KEYS) {
    forwardSearchParams.delete(key);
  }

  for (const key of PATH_PARAM_KEYS) {
    forwardSearchParams.delete(key);
  }

  const upstreamUrl = new URL(`https://${targetHost}/`);

  if (pathOverride) {
    const normalized = pathOverride.startsWith('/') ? pathOverride : `/${pathOverride}`;
    upstreamUrl.pathname = normalized;
  } else {
    upstreamUrl.pathname = splatPath.startsWith('/') ? splatPath : `/${splatPath}`;
  }

  const forwardSearch = forwardSearchParams.toString();
  upstreamUrl.search = forwardSearch ? `?${forwardSearch}` : '';

  const headers = createForwardHeaders(request.headers, targetHost);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
      signal: controller.signal,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return new Response('Upstream WebContainer request timed out', { status: 504 });
    }

    console.error('WebContainer proxy failed', {
      path: splatPath,
      error,
    });

    return new Response('WebContainer proxy failed', { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export async function loader(args: LoaderFunctionArgs) {
  if (args.request.method !== 'GET' && args.request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'GET,HEAD',
      },
    });
  }

  return proxyRequest(args);
}

export async function action(args: ActionFunctionArgs) {
  return proxyRequest(args);
}
