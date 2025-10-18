import { useEffect, useRef, useState } from 'react';

interface InspectorProps {
  isActive: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onElementSelect: (elementInfo: ElementInfo) => void;
}

export interface ElementInfo {
  displayText: string;
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  styles: Record<string, string>; // Changed from CSSStyleDeclaration
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
  selector?: string;
  elementPath?: string;
}

export const Inspector = ({ isActive, iframeRef, onElementSelect }: InspectorProps) => {
  const [hoveredElement, setHoveredElement] = useState<ElementInfo | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !iframeRef.current) {
      return undefined;
    }

    const iframe = iframeRef.current;

    const sendActivationMessage = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'INSPECTOR_ACTIVATE',
            active: isActive,
          },
          '*',
        );
      }
    };

    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) {
        return;
      }

      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      if (event.data.type === 'INSPECTOR_READY') {
        sendActivationMessage();
        return;
      }

      if (event.data.type === 'INSPECTOR_HOVER') {
        const rawElementInfo = event.data.elementInfo as ElementInfo | undefined;

        if (!rawElementInfo || !rawElementInfo.rect) {
          return;
        }

        // Adjust coordinates relative to iframe position
        const iframeRect = iframe.getBoundingClientRect();
        const elementInfo: ElementInfo = {
          ...rawElementInfo,
          rect: {
            ...rawElementInfo.rect,
            x: rawElementInfo.rect.x + iframeRect.x,
            y: rawElementInfo.rect.y + iframeRect.y,
            top: rawElementInfo.rect.top + iframeRect.y,
            left: rawElementInfo.rect.left + iframeRect.x,
          },
        };

        setHoveredElement(elementInfo);
      } else if (event.data.type === 'INSPECTOR_CLICK') {
        const rawElementInfo = event.data.elementInfo as ElementInfo | undefined;

        if (!rawElementInfo || !rawElementInfo.rect) {
          return;
        }

        // Adjust coordinates relative to iframe position
        const iframeRect = iframe.getBoundingClientRect();
        const elementInfo: ElementInfo = {
          ...rawElementInfo,
          rect: {
            ...rawElementInfo.rect,
            x: rawElementInfo.rect.x + iframeRect.x,
            y: rawElementInfo.rect.y + iframeRect.y,
            top: rawElementInfo.rect.top + iframeRect.y,
            left: rawElementInfo.rect.left + iframeRect.x,
          },
        };

        onElementSelect(elementInfo);
      } else if (event.data.type === 'INSPECTOR_LEAVE') {
        setHoveredElement(null);
      }
    };

    window.addEventListener('message', handleMessage);

    // Send activation message to iframe
    // Try to send activation message immediately and on load
    sendActivationMessage();
    iframe.addEventListener('load', sendActivationMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      iframe.removeEventListener('load', sendActivationMessage);

      // Deactivate inspector in iframe
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'INSPECTOR_ACTIVATE',
            active: false,
          },
          '*',
        );
      }
    };
  }, [isActive, iframeRef, onElementSelect]);

  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null);
    }
  }, [isActive]);

  // Render overlay for hovered element
  return (
    <>
      {isActive && hoveredElement && (
        <div
          ref={overlayRef}
          className="fixed pointer-events-none z-50 border-2 border-blue-500 bg-blue-500/10"
          style={{
            left: hoveredElement.rect.x,
            top: hoveredElement.rect.y,
            width: hoveredElement.rect.width,
            height: hoveredElement.rect.height,
          }}
        >
          {/* Element info tooltip */}
          <div className="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {hoveredElement.tagName.toLowerCase()}
            {hoveredElement.id && `#${hoveredElement.id}`}
            {hoveredElement.className && `.${hoveredElement.className.split(' ')[0]}`}
          </div>
        </div>
      )}
    </>
  );
};
