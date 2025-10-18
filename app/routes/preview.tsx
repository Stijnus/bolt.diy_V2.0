import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import inspectorScript from '~/components/workbench/inspector-script.js?raw';

const WEB_CONTAINER_HOST_SUFFIX = '.webcontainer-api.io';
const HOST_PARAM_KEYS = ['host', 'targetHost'] as const;

type LoaderData =
  | {
      targetUrl: string;
      message?: undefined;
    }
  | {
      targetUrl: null;
      message: string;
    };

function isAllowedHost(host: string | null | undefined): host is string {
  return Boolean(host && host.endsWith(WEB_CONTAINER_HOST_SUFFIX));
}

function getCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    const trimmedKey = rawKey?.trim();

    if (!trimmedKey || trimmedKey !== key) {
      continue;
    }

    const value = rest.join('=').trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

function resolveTargetUrl(srcParam: string | null, hostParam: string | null, requestUrl: URL, cookieHeader: string | null) {
  if (!srcParam) {
    return { targetUrl: null, message: 'Missing preview source URL.' } as LoaderData;
  }

  let parsed: URL;

  try {
    parsed = new URL(srcParam, requestUrl.origin);
  } catch (error) {
    return {
      targetUrl: null,
      message: `Invalid src parameter: ${(error as Error).message}`,
    } as LoaderData;
  }

  const wcHostCookie = cookieHeader ? getCookieValue(cookieHeader, 'wc_host') : null;

  const hostHintCandidates = [hostParam, wcHostCookie];

  for (const key of HOST_PARAM_KEYS) {
    hostHintCandidates.push(parsed.searchParams.get(key));
  }

  const hostHint = hostHintCandidates.find(isAllowedHost);

  if (isAllowedHost(parsed.hostname)) {
    // Already points to a WebContainer host; respect the explicit host in src.
  } else if (parsed.pathname.startsWith('/webcontainer/') && hostHint) {
    parsed = new URL(parsed.pathname + parsed.search + parsed.hash, `https://${hostHint}`);
  } else if (hostHint) {
    parsed.hostname = hostHint;
    parsed.protocol = 'https:';
  }

  if (!parsed.hostname.endsWith(WEB_CONTAINER_HOST_SUFFIX)) {
    return {
      targetUrl: null,
      message: 'Unable to resolve WebContainer host for preview.',
    } as LoaderData;
  }

  // Opening the connect endpoint directly is rarely useful—prefer the root.
  if (parsed.pathname.startsWith('/webcontainer/connect/')) {
    parsed.pathname = '/';
    parsed.search = '';
  }

  for (const key of HOST_PARAM_KEYS) {
    parsed.searchParams.delete(key);
  }

  return { targetUrl: parsed.toString() } as LoaderData;
}

function escapeScriptContent(content: string) {
  return content.replace(/<\/script>/gi, '<\\/script>');
}

function escapeHtml(content: string) {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createBridgeBootstrapScript(targetUrl: string) {
  const target = new URL(targetUrl);
  const targetHref = target.toString();
  const targetOrigin = target.origin;

  const script = `
    (function () {
      const targetUrl = ${JSON.stringify(targetHref)};
      const targetOrigin = ${JSON.stringify(targetOrigin)};

      window.__boltPreviewBridge = { targetUrl, targetOrigin };

      const normalize = (value, kind) => {
        if (!value || typeof value !== 'string') {
          return value;
        }

        const trimmed = value.trim();

        if (!trimmed) {
          return trimmed;
        }

        const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed);

        if (hasScheme) {
          if (kind === 'ws' && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
            return trimmed.replace(/^http/, 'ws').replace(/^https/, 'wss');
          }

          return trimmed;
        }

        try {
          const resolved = new URL(trimmed, targetUrl);

          if (kind === 'ws') {
            const protocol = resolved.protocol === 'https:' ? 'wss:' : 'ws:';
            return protocol + '//' + resolved.host + resolved.pathname + resolved.search + resolved.hash;
          }

          return resolved.toString();
        } catch (error) {
          console.warn('Failed to normalize preview bridge URL', { value, kind, error });
          return value;
        }
      };

      const OriginalRequest = window.Request;
      const OriginalEventSource = window.EventSource;
      const OriginalWebSocket = window.WebSocket;
      const originalFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;

      if (originalFetch) {
        window.fetch = function (input, init) {
          if (typeof input === 'string') {
            const rewritten = normalize(input);
            return originalFetch(rewritten, init);
          }

          if (input instanceof URL) {
            const rewritten = normalize(input.toString());
            return originalFetch(rewritten, init);
          }

          if (input instanceof OriginalRequest) {
            const rewritten = normalize(input.url);

            if (rewritten !== input.url) {
              const cloned = new OriginalRequest(rewritten, input);
              return originalFetch(cloned, init);
            }
          }

          return originalFetch(input, init);
        };
      }

      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        const rewritten = normalize(url);
        return originalXHROpen.call(this, method, rewritten, async, user, password);
      };

      if (typeof navigator.sendBeacon === 'function') {
        const originalSendBeacon = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = function (url, data) {
          const rewritten = normalize(url);
          return originalSendBeacon(rewritten, data);
        };
      }

      if (OriginalEventSource) {
        const PatchedEventSource = function (url, config) {
          const rewritten = normalize(url);
          return new OriginalEventSource(rewritten, config);
        };

        PatchedEventSource.prototype = OriginalEventSource.prototype;
        window.EventSource = PatchedEventSource;
      }

      if (OriginalWebSocket) {
        const PatchedWebSocket = function (url, protocols) {
          const rewritten = normalize(url, 'ws');
          return new OriginalWebSocket(rewritten, protocols);
        };

        PatchedWebSocket.prototype = OriginalWebSocket.prototype;
        window.WebSocket = PatchedWebSocket;
      }
    })();
  `;

  return `<script type="text/javascript" data-bolt-preview-bridge-bootstrap>${escapeScriptContent(script)}</script>`;
}

// Rewrite absolute-root resource URLs (e.g., /@vite/client) to the upstream origin.
// This is necessary because absolute paths ignore <base> and would otherwise request
// our app origin instead of the upstream dev server.
function rewriteAbsoluteResourceUrls(html: string, targetOrigin: string) {
  // Matches src|href|action attributes with a single leading slash (not protocol-relative //)
  const re = /(\s(?:src|href|action)\s*=\s*)(["'])\/(?!\/)([^"']*)(\2)/gi;

  return html.replace(re, (_match, prefix: string, quote: string, path: string, suffixQuote: string) => {
    return `${prefix}${quote}${targetOrigin}/${path}${suffixQuote}`;
  });
}

function injectInspectorIntoHtml(html: string, targetUrl: string) {
  const baseHref = new URL('.', targetUrl).toString();
  const baseTag = `<base href="${baseHref}">`;
  const bridgeBootstrap = createBridgeBootstrapScript(targetUrl);
  const inspectorTag = `<script type="text/javascript">${escapeScriptContent(inspectorScript)}</script>`;
  const injection = `${baseTag}\n${bridgeBootstrap}\n${inspectorTag}`;
  const headOpenPattern = /<head([^>]*)>/i;
  const targetOrigin = new URL(targetUrl).origin;
  // First, rewrite absolute-root URLs so assets load from the upstream dev server instead of our origin
  const rewritten = rewriteAbsoluteResourceUrls(html, targetOrigin);

  if (headOpenPattern.test(rewritten)) {
    return rewritten.replace(headOpenPattern, `<head$1>\n${injection}\n`);
  }

  if (rewritten.includes('</head>')) {
    return rewritten.replace('</head>', `${injection}\n</head>`);
  }

  return `${injection}\n${rewritten}`;
}

function renderBridgeErrorHtml(title: string, description: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Preview inspector unavailable</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .container { max-width: 32rem; padding: 1.5rem; text-align: center; background-color: rgba(15, 23, 42, 0.75); border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 0.75rem; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.4); }
      h1 { font-size: 1.25rem; margin-bottom: 0.75rem; }
      p { margin: 0.5rem 0; color: #cbd5f5; }
      code { display: inline-block; margin-top: 0.75rem; padding: 0.5rem 0.75rem; background-color: rgba(30, 41, 59, 0.9); border-radius: 0.5rem; font-size: 0.875rem; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${escapeHtml(title)}</h1>
      <p style="white-space: pre-wrap;">${escapeHtml(description)}</p>
      <code>Try disabling the inspector to restore the direct preview.</code>
    </div>
    <script>
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: 'BOLT_PREVIEW_BRIDGE_ERROR',
              title: ${JSON.stringify(title)},
              description: ${JSON.stringify(description)},
            },
            '*',
          );
        }
      } catch (error) {
        console.error('Failed to notify parent about preview bridge error', error);
      }
    </script>
  </body>
</html>`;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const srcParam = url.searchParams.get('src');
  const hostParam = url.searchParams.get('host');
  const mode = url.searchParams.get('mode');
  const cookieHeader = request.headers.get('cookie');

  const resolved = resolveTargetUrl(srcParam, hostParam, url, cookieHeader);

  if (!resolved.targetUrl) {
    return json(resolved, { status: 400 });
  }

  if (mode === 'bridge') {
    try {
      const upstreamHeaders: HeadersInit = {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      };

      const userAgent = request.headers.get('user-agent');

      if (userAgent) {
        upstreamHeaders['User-Agent'] = userAgent;
      }

      const acceptLanguage = request.headers.get('accept-language');

      if (acceptLanguage) {
        upstreamHeaders['Accept-Language'] = acceptLanguage;
      }

      if (cookieHeader) {
        upstreamHeaders['Cookie'] = cookieHeader;
      }

      const upstreamResponse = await fetch(resolved.targetUrl, {
        headers: upstreamHeaders,
        redirect: 'follow',
      });

      if (!upstreamResponse.ok) {
        let snippet = '';

        try {
          const text = await upstreamResponse.text();
          snippet = text.slice(0, 400);
        } catch (readError) {
          snippet = `Unable to read upstream response body: ${(readError as Error).message}`;
        }

        const detail = `Failed to load preview (HTTP ${upstreamResponse.status}).\n\nUpstream response snippet:\n${snippet}`;

        return new Response(renderBridgeErrorHtml('Preview inspector unavailable', detail), {
          // Use 200 so the iframe renders our error page instead of the browser treating it as a network error
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
      }

      const contentType = upstreamResponse.headers.get('content-type') ?? '';

      if (!contentType.includes('text/html')) {
        return new Response(
          renderBridgeErrorHtml(
            'Preview inspector unavailable',
            'The requested document is not HTML. Only HTML documents can be inspected.',
          ),
          {
            status: 415,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          },
        );
      }

      const upstreamHtml = await upstreamResponse.text();
      const bridgedHtml = injectInspectorIntoHtml(upstreamHtml, resolved.targetUrl);

      return new Response(bridgedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Unknown error';

      return new Response(
        renderBridgeErrorHtml('Preview inspector proxy error', `Reason: ${reason}`),
        {
          status: 502,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        },
      );
    }
  }

  return redirect(resolved.targetUrl);
}

export default function PreviewFallback() {
  const data = useLoaderData<typeof loader>();
  let message: string | undefined;

  if (data && typeof data === 'object' && 'message' in data) {
    const value = (data as { message?: unknown }).message;

    if (typeof value === 'string') {
      message = value;
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Unable to open preview</h1>
      <p className="text-base text-bolt-elements-textSecondary">{message ?? 'Unknown error'}</p>
      <p className="text-sm text-bolt-elements-textTertiary">
        Make sure a preview is running and try again from the workbench preview panel.
      </p>
    </div>
  );
}
