import { useStore } from '@nanostores/react';
import { ExternalLink, RotateCw } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { PortDropdown } from './PortDropdown';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';

export const Preview = memo(() => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const hasSelectedPreview = useRef(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const [url, setUrl] = useState('');
  const [iframeUrl, setIframeUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!activePreview) {
      setUrl('');
      setIframeUrl(undefined);

      return;
    }

    const { baseUrl } = activePreview;

    setUrl(baseUrl);
    setIframeUrl(baseUrl);
  }, [activePreview, activePreview?.baseUrl]);

  const validateUrl = useCallback(
    (value: string) => {
      if (!activePreview) {
        return false;
      }

      const { baseUrl } = activePreview;

      if (value === baseUrl) {
        return true;
      } else if (value.startsWith(baseUrl)) {
        return ['/', '?', '#'].includes(value.charAt(baseUrl.length));
      }

      return false;
    },
    [activePreview],
  );

  const findMinPortIndex = useCallback(
    (minIndex: number, preview: { port: number }, index: number, array: { port: number }[]) => {
      return preview.port < array[minIndex].port ? index : minIndex;
    },
    [],
  );

  // when previews change, display the lowest port if user hasn't selected a preview
  useEffect(() => {
    if (previews.length > 1 && !hasSelectedPreview.current) {
      const minPortIndex = previews.reduce(findMinPortIndex, 0);

      setActivePreviewIndex(minPortIndex);
    }
  }, [previews]);

  const reloadPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  function getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`));

    if (!match) {
      return null;
    }

    try {
      return decodeURIComponent(match.substring(name.length + 1));
    } catch {
      return match.substring(name.length + 1);
    }
  }

  function computeOpenUrl(current: string | undefined): string | null {
    if (!current) {
      return null;
    }

    // If it's already absolute, open as-is
    try {
      const u = new URL(current);
      return u.toString();
    } catch {}

    // Handle local proxy paths like /webcontainer/connect/:id
    if (current.startsWith('/webcontainer/')) {
      const wcHost = getCookie('wc_host');

      if (!wcHost) {
        return null;
      }

      const base = new URL(current, window.location.origin);
      base.searchParams.set('host', wcHost);

      return base.toString();
    }

    // Fallback: resolve relative to origin
    try {
      return new URL(current, window.location.origin).toString();
    } catch {
      return null;
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {isPortDropdownOpen && (
        <div className="z-[995] w-full h-full absolute" onClick={() => setIsPortDropdownOpen(false)} />
      )}
      <div className="bg-bolt-elements-background-depth-2 p-2 flex items-center gap-1.5">
        <IconButton icon={RotateCw} onClick={reloadPreview} />
        <IconButton
          icon={ExternalLink}
          disabled={!computeOpenUrl(iframeUrl)}
          title="Open preview in new tab"
          onClick={() => {
            const target = computeOpenUrl(iframeUrl);

            if (!target) {
              return;
            }

            window.open(target, '_blank');
          }}
        />
        <div className="flex items-center gap-1 flex-grow bg-bolt-elements-preview-addressBar-background border border-bolt-elements-borderColor text-bolt-elements-preview-addressBar-text rounded-full px-3 py-1 text-sm hover:bg-bolt-elements-preview-addressBar-backgroundHover focus-within:bg-bolt-elements-preview-addressBar-backgroundActive focus-within:border-bolt-elements-borderColorActive focus-within:text-bolt-elements-preview-addressBar-textActive">
          <input
            ref={inputRef}
            className="w-full bg-transparent outline-none"
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && validateUrl(url)) {
                setIframeUrl(url);

                if (inputRef.current) {
                  inputRef.current.blur();
                }
              }
            }}
          />
        </div>
        {previews.length > 1 && (
          <PortDropdown
            activePreviewIndex={activePreviewIndex}
            setActivePreviewIndex={setActivePreviewIndex}
            isDropdownOpen={isPortDropdownOpen}
            setHasSelectedPreview={(value) => (hasSelectedPreview.current = value)}
            setIsDropdownOpen={setIsPortDropdownOpen}
            previews={previews}
          />
        )}
      </div>
      <div className="flex-1 border-t border-bolt-elements-borderColor">
        {activePreview ? (
          <iframe ref={iframeRef} className="border-none w-full h-full bg-white" src={iframeUrl} />
        ) : (
          <div className="flex w-full h-full justify-center items-center bg-white">No preview available</div>
        )}
      </div>
    </div>
  );
});
