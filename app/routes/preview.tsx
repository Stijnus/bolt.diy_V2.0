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

function injectInspectorIntoHtml(html: string, targetUrl: string) {
  const baseHref = new URL('.', targetUrl).toString();
  const baseTag = `<base href="${baseHref}">`;
  const scriptTag = `<script type="text/javascript">${escapeScriptContent(inspectorScript)}</script>`;

  if (html.includes('</head>')) {
    return html.replace('</head>', `${baseTag}\n${scriptTag}\n</head>`);
  }

  return `${baseTag}\n${scriptTag}\n${html}`;
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
      <h1>${title}</h1>
      <p>${description}</p>
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

      const upstreamResponse = await fetch(resolved.targetUrl, {
        headers: upstreamHeaders,
        redirect: 'follow',
      });

      if (!upstreamResponse.ok) {
        const detail = `Failed to load preview (HTTP ${upstreamResponse.status}).`;

        return new Response(renderBridgeErrorHtml('Preview inspector unavailable', detail), {
          status: upstreamResponse.status,
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
