import type { LoaderFunction } from '@remix-run/cloudflare';

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // validate that the URL is from allowed domains for security
  const allowedDomains = ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'ui-avatars.com'];

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  const isAllowed = allowedDomains.some(
    (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain),
  );

  if (!isAllowed) {
    return new Response('Domain not allowed', { status: 403 });
  }

  try {
    // fetch the image from the external service
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Bolt.new Avatar Proxy',
      },
    });

    if (!response.ok) {
      return new Response('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageData = await response.arrayBuffer();

    // return the image with proper CORS headers
    return new Response(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // cache for 1 hour
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Avatar proxy error:', error);
    return new Response('Error fetching image', { status: 500 });
  }
};
