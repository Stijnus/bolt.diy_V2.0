import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const PREVIEW_CHANNEL = 'preview-updates';

export async function loader({ params }: LoaderFunctionArgs) {
  const previewId = params.id;

  if (!previewId) {
    throw new Response('Preview ID is required', { status: 400 });
  }

  return json({ previewId });
}

export default function WebContainerPreview() {
  const { previewId } = useLoaderData<typeof loader>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel>();
  const [previewUrl, setPreviewUrl] = useState('');

  const handleRefresh = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = '';
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = previewUrl;
        }
      });
    }
  }, [previewUrl]);

  const notifyPreviewReady = useCallback(() => {
    if (broadcastChannelRef.current && previewUrl) {
      broadcastChannelRef.current.postMessage({
        type: 'preview-ready',
        previewId,
        url: previewUrl,
        timestamp: Date.now(),
      });
    }
  }, [previewId, previewUrl]);

  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel(PREVIEW_CHANNEL);

    broadcastChannelRef.current.onmessage = (event) => {
      if (event.data.previewId === previewId) {
        if (event.data.type === 'refresh-preview' || event.data.type === 'file-change') {
          handleRefresh();
        }
      }
    };

    const url = `https://${previewId}.local-credentialless.webcontainer-api.io`;
    setPreviewUrl(url);

    if (iframeRef.current) {
      iframeRef.current.src = url;
    }

    notifyPreviewReady();

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [previewId, handleRefresh, notifyPreviewReady]);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        title="WebContainer Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
        allow="cross-origin-isolated"
        loading="eager"
        onLoad={notifyPreviewReady}
      />
    </div>
  );
}
