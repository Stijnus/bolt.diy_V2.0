import { useStore } from '@nanostores/react';
import { Crosshair, ExternalLink, RotateCw } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { PortDropdown } from './PortDropdown';
import { Inspector, type ElementInfo } from './Inspector';
import { InspectorPanel } from './InspectorPanel';
import { IconButton } from '~/components/ui/IconButton';
import inspectorScript from './inspector-script.js?raw';
import { workbenchStore } from '~/lib/stores/workbench';
import { chatStore } from '~/lib/stores/chat';

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
  const [directPreviewUrl, setDirectPreviewUrl] = useState<string | undefined>();
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [isInspectorPanelVisible, setIsInspectorPanelVisible] = useState(false);
  const [inspectorError, setInspectorError] = useState<string | null>(null);

  useEffect(() => {
    if (!activePreview) {
      setUrl('');
      setDirectPreviewUrl(undefined);
      setIframeUrl(undefined);

      return;
    }

    const { baseUrl } = activePreview;

    setUrl(baseUrl);
    setDirectPreviewUrl(baseUrl);
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

  const computeBridgeUrl = useCallback(
    (current: string | undefined) => {
      if (!current || typeof window === 'undefined') {
        return null;
      }

      try {
        const bridgeUrl = new URL('/preview', window.location.origin);
        bridgeUrl.searchParams.set('src', current);
        bridgeUrl.searchParams.set('mode', 'bridge');

        const hostHint = getCookie('wc_host');

        if (hostHint) {
          bridgeUrl.searchParams.set('host', hostHint);
        }

        return bridgeUrl.toString();
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!directPreviewUrl) {
      setIframeUrl(undefined);
      return;
    }

    if (isInspectorActive) {
      const bridged = computeBridgeUrl(directPreviewUrl);

      if (!bridged) {
        setInspectorError('Element inspector is unavailable for this preview URL.');
        setIsInspectorActive(false);
        setSelectedElement(null);
        setIsInspectorPanelVisible(false);
        setIframeUrl(directPreviewUrl);

        return;
      }

      setInspectorError(null);

      if (bridged !== iframeUrl) {
        setIframeUrl(bridged);
      }
    } else {
      if (inspectorError) {
        setInspectorError(null);
      }

      if (directPreviewUrl !== iframeUrl) {
        setIframeUrl(directPreviewUrl);
      }
    }
  }, [computeBridgeUrl, directPreviewUrl, iframeUrl, inspectorError, isInspectorActive]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      if (event.data.type !== 'BOLT_PREVIEW_BRIDGE_ERROR') {
        return;
      }

      const description = typeof event.data.description === 'string' ? event.data.description : null;

      setInspectorError(description ?? 'Preview inspector bridge failed.');
      setIsInspectorActive(false);
      setSelectedElement(null);
      setIsInspectorPanelVisible(false);
      setIframeUrl(directPreviewUrl);
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [directPreviewUrl]);

  const injectInspectorScript = useCallback(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return;
    }

    try {
      const doc = iframe.contentDocument;

      if (!doc || !doc.head) {
        return;
      }

      if (doc.getElementById('bolt-inspector-script')) {
        return;
      }

      const scriptEl = doc.createElement('script');
      scriptEl.id = 'bolt-inspector-script';
      scriptEl.type = 'text/javascript';
      scriptEl.textContent = inspectorScript;
      doc.head.appendChild(scriptEl);
    } catch {}
  }, [iframeUrl]);

  useEffect(() => {
    if (!isInspectorActive) {
      return undefined;
    }

    const iframe = iframeRef.current;

    if (!iframe) {
      return;
    }

    const handleLoad = () => {
      injectInspectorScript();
    };

    try {
      if (iframe.contentDocument?.readyState === 'complete') {
        injectInspectorScript();
      }
    } catch {}

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeUrl, injectInspectorScript, isInspectorActive]);

  useEffect(() => {
    if (isInspectorActive) {
      injectInspectorScript();
    }
  }, [isInspectorActive, injectInspectorScript]);

  useEffect(() => {
    if (selectedElement) {
      setIsInspectorPanelVisible(true);
    }
  }, [selectedElement]);

  useEffect(() => {
    setSelectedElement(null);
    setIsInspectorPanelVisible(false);
  }, [directPreviewUrl]);

  const formatElementPrompt = useCallback((element: ElementInfo) => {
    const lines: string[] = [];
    lines.push('Please help update this element in the preview.');
    lines.push(`Selector: ${element.selector || element.tagName.toLowerCase()}`);
    lines.push(`Element: ${element.displayText}`);

    if (element.textContent) {
      lines.push(`Text content: "${element.textContent}"`);
    }

    if (element.elementPath) {
      lines.push(`Hierarchy: ${element.elementPath}`);
    }

    const styleEntries = Object.entries(element.styles);

    if (styleEntries.length > 0) {
      lines.push('Current styles:');
      styleEntries.slice(0, 12).forEach(([prop, value]) => {
        lines.push(`- ${prop}: ${value}`);
      });
    }

    return lines.join('\n');
  }, []);

  const handleElementSelect = useCallback(
    (element: ElementInfo) => {
      setIsInspectorActive(false);
      setSelectedElement(element);

      const prompt = formatElementPrompt(element);
      chatStore.setKey('pendingInput', prompt);
      chatStore.setKey('autoSendPending', false);
      chatStore.setKey('showChat', true);
    },
    [formatElementPrompt],
  );

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

    try {
      // Validate that the URL is well-formed before returning it directly.
      // Opening the WebContainer host avoids additional redirects that can fail under inspector bridge mode.
      // eslint-disable-next-line no-new
      new URL(current);

      return current;
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
          disabled={!computeOpenUrl(directPreviewUrl)}
          title="Open preview in new tab"
          onClick={() => {
            const target = computeOpenUrl(directPreviewUrl);

            if (!target) {
              return;
            }

            window.open(target, '_blank');
          }}
        />
        <IconButton
          icon={Crosshair}
          title="Toggle inspector"
          disabled={!activePreview}
          className={isInspectorActive ? 'text-blue-500' : undefined}
          onClick={() => {
            if (!activePreview) {
              return;
            }

            setIsInspectorActive((value) => {
              const next = !value;

              if (!next) {
                setInspectorError(null);
                setSelectedElement(null);
                setIsInspectorPanelVisible(false);
                setIframeUrl(directPreviewUrl);
              }

              return next;
            });
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
                setDirectPreviewUrl(url);

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
            setHasSelectedPreview={(value) => {
              hasSelectedPreview.current = value;
            }}
            setIsDropdownOpen={setIsPortDropdownOpen}
            previews={previews}
          />
        )}
      </div>
      {inspectorError && <div className="px-3 pb-2 text-xs text-red-500">{inspectorError}</div>}
      <div className="flex-1 border-t border-bolt-elements-borderColor">
        {activePreview ? (
          <iframe ref={iframeRef} className="border-none w-full h-full bg-white" src={iframeUrl} />
        ) : (
          <div className="flex w-full h-full justify-center items-center bg-white">No preview available</div>
        )}
      </div>
      <Inspector isActive={isInspectorActive && Boolean(activePreview)} iframeRef={iframeRef} onElementSelect={handleElementSelect} />
      <InspectorPanel
        selectedElement={selectedElement}
        isVisible={isInspectorPanelVisible}
        onClose={() => {
          setIsInspectorPanelVisible(false);
          setSelectedElement(null);
        }}
      />
    </div>
  );
});
