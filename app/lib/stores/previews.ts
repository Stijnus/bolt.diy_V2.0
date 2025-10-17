import type { WebContainer } from '@webcontainer/api';
import { atom } from 'nanostores';

export interface PreviewInfo {
  port: number;
  ready: boolean;
  baseUrl: string;
}

export class PreviewsStore {
  #availablePreviews = new Map<number, PreviewInfo>();
  #webcontainer: Promise<WebContainer>;

  previews = atom<PreviewInfo[]>([]);

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;

    this.#init();
  }

  async #init() {
    const webcontainer = await this.#webcontainer;

    webcontainer.on('port', (port, type, url) => {
      let previewInfo = this.#availablePreviews.get(port);

      if (type === 'close' && previewInfo) {
        this.#availablePreviews.delete(port);
        this.previews.set(this.previews.get().filter((preview) => preview.port !== port));

        return;
      }

      const previews = this.previews.get();

      if (!previewInfo) {
        previewInfo = { port, ready: type === 'open', baseUrl: url };
        this.#availablePreviews.set(port, previewInfo);
        previews.push(previewInfo);
      }

      previewInfo.ready = type === 'open';
      previewInfo.baseUrl = url;

      // Store host hint for proxy routing as cookie
      try {
        const host = new URL(url).hostname;

        if (host.endsWith('webcontainer-api.io')) {
          document.cookie = `wc_host=${encodeURIComponent(host)}; path=/`;

          // Try to extract instance id from host like: <hash>--<port>--<instance>.local-corp.webcontainer-api.io
          const m = host.match(/--(\d+)--([a-z0-9]+)\.local-corp\.webcontainer-api\.io$/i);
          const instance = m?.[2];

          if (instance) {
            document.cookie = `wc_host_${instance}=${encodeURIComponent(host)}; path=/`;
          }
        }
      } catch {}

      this.previews.set([...previews]);
    });

    /*
     * Prefer absolute preview URLs when the dev server is ready.
     * This helps avoid relying on local proxy paths like /webcontainer/connect/*.
     */
    webcontainer.on('server-ready', (port: number, url: string) => {
      let previewInfo = this.#availablePreviews.get(port);

      if (!previewInfo) {
        previewInfo = { port, ready: true, baseUrl: url };
        this.#availablePreviews.set(port, previewInfo);
      }

      previewInfo.ready = true;
      previewInfo.baseUrl = url;

      // Store host hint for proxy routing as cookie
      try {
        const host = new URL(url).hostname;

        if (host.endsWith('webcontainer-api.io')) {
          document.cookie = `wc_host=${encodeURIComponent(host)}; path=/`;
        }
      } catch {}

      const previews = this.previews.get();
      const idx = previews.findIndex((p) => p.port === port);

      if (idx >= 0) {
        previews[idx] = previewInfo;
        this.previews.set([...previews]);
      } else {
        this.previews.set([...previews, previewInfo]);
      }
    });
  }
}
