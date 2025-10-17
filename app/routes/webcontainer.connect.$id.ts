import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';

const WEB_CONTAINER_HOST_SUFFIX = '.webcontainer-api.io';
const HOST_PARAM_KEYS = ['host', 'targetHost'] as const;

function isAllowedHost(hostname: string | null | undefined): hostname is string {
  return Boolean(hostname && hostname.endsWith(WEB_CONTAINER_HOST_SUFFIX));
}

function parseCookies(header: string | null) {
  const map = new Map<string, string>();

  if (!header) {
    return map;
  }

  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey?.trim();

    if (!key) {
      continue;
    }

    const val = rest.join('=');

    if (!val) {
      continue;
    }

    try {
      map.set(key, decodeURIComponent(val.trim()));
    } catch {
      map.set(key, val.trim());
    }
  }

  return map;
}

function findHostHint(request: Request): string | null {
  const url = new URL(request.url);

  for (const key of HOST_PARAM_KEYS) {
    const v = url.searchParams.get(key);

    if (isAllowedHost(v)) {
      return v!;
    }
  }

  const cookies = parseCookies(request.headers.get('cookie'));
  const wcHost = cookies.get('wc_host');

  if (isAllowedHost(wcHost)) {
    return wcHost!;
  }

  const candidates = [
    request.headers.get('x-webcontainer-host'),
    request.headers.get('origin'),
    request.headers.get('referer'),
  ];

  for (const value of candidates) {
    if (!value) {
      continue;
    }

    try {
      const u = new URL(value);

      if (isAllowedHost(u.hostname)) {
        return u.hostname;
      }

      for (const key of HOST_PARAM_KEYS) {
        const h = u.searchParams.get(key);

        if (isAllowedHost(h)) {
          return h!;
        }
      }
    } catch {}
  }

  return null;
}

function createForwardHeaders(original: Headers, targetHost: string) {
  const forward = new Headers();
  original.forEach((value, key) => {
    const k = key.toLowerCase();

    if (k === 'host' || k === 'content-length' || k === 'connection') {
      return;
    }

    forward.set(key, value);
  });
  forward.set('host', targetHost);

  return forward;
}

async function handle({ request, params }: LoaderFunctionArgs | ActionFunctionArgs) {
  const id = params.id as string | undefined;

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const targetHost = findHostHint(request);

  if (!targetHost) {
    // Client-side fallback: try to read wc_host cookie and redirect
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Connecting…</title></head><body><script>
      (function(){
        try {
          var params = new URLSearchParams(window.location.search);
          if (!params.get('host')) {
            var cookie = document.cookie.split(';').map(function(s){return s.trim()}).find(function(s){return s.indexOf('wc_host=') === 0});
            if (cookie) {
              var host = decodeURIComponent(cookie.substring('wc_host='.length));
              params.set('host', host);
              window.location.replace(window.location.pathname + '?' + params.toString());
              return;
            }
          }
        } catch (e) {}
        document.body.textContent = 'Missing WebContainer host hint. Open the preview first so we can learn the host, then try again.';
      })();
    <\/script></body></html>`;
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const reqUrl = new URL(request.url);
  const upstreamUrl = new URL(`https://${targetHost}/webcontainer/connect/${encodeURIComponent(id)}`);

  // Preserve other query params except our internal host hint
  const search = new URLSearchParams(reqUrl.searchParams);

  for (const key of HOST_PARAM_KEYS) {
    search.delete(key);
  }

  const qs = search.toString();
  upstreamUrl.search = qs ? `?${qs}` : '';

  const headers = createForwardHeaders(request.headers, targetHost);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const resp = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
      signal: controller.signal,
    });

    const outHeaders = new Headers(resp.headers);
    outHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: outHeaders });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return new Response('Upstream timeout', { status: 504 });
    }

    return new Response('Proxy error', { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export const loader = (args: LoaderFunctionArgs) => handle(args);
export const action = (args: ActionFunctionArgs) => handle(args);
