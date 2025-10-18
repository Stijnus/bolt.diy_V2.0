import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

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
    // Already points to a WebContainer host. Optionally adjust host via hint.
    if (hostHint && parsed.hostname !== hostHint) {
      parsed.hostname = hostHint;
    }
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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const srcParam = url.searchParams.get('src');
  const hostParam = url.searchParams.get('host');
  const cookieHeader = request.headers.get('cookie');

  const resolved = resolveTargetUrl(srcParam, hostParam, url, cookieHeader);

  if (!resolved.targetUrl) {
    return json(resolved, { status: 400 });
  }

  return redirect(resolved.targetUrl);
}

export default function PreviewFallback() {
  const data = useLoaderData<typeof loader>();
  const message = typeof data === 'object' && 'message' in data ? data.message : undefined;

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
