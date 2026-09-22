import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Where the garment actually is inside a cut-out: transparent margins differ
 * from one photo to the next, so fitting the whole file makes pieces look
 * randomly bigger or smaller. Measured once per URL (web: canvas alpha scan).
 */
export interface ContentBox {
  /** Natural image size, in pixels. */
  width: number;
  height: number;
  /** Opaque content, as fractions of the natural size. */
  x: number;
  y: number;
  w: number;
  h: number;
}

const cache = new Map<string, ContentBox | null>();
const pending = new Map<string, Promise<ContentBox | null>>();
const SCAN = 160;

function measure(uri: string): Promise<ContentBox | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = SCAN / Math.max(img.width, img.height);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let x0 = w;
        let y0 = h;
        let x1 = -1;
        let y1 = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 24) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }
        // Fully opaque (no cut-out) or empty: the whole image is the content.
        const box =
          x1 < 0
            ? { x: 0, y: 0, w: 1, h: 1 }
            : { x: x0 / w, y: y0 / h, w: (x1 - x0 + 1) / w, h: (y1 - y0 + 1) / h };
        resolve({ width: img.width, height: img.height, ...box });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

export function useContentBox(uri: string | null | undefined): ContentBox | null | undefined {
  const [box, setBox] = useState<ContentBox | null | undefined>(() => (uri ? cache.get(uri) : null));
  useEffect(() => {
    if (!uri) {
      setBox(null);
      return;
    }
    if (cache.has(uri)) {
      setBox(cache.get(uri));
      return;
    }
    let alive = true;
    setBox(undefined);
    let job = pending.get(uri);
    if (!job) {
      job = measure(uri).then((result) => {
        cache.set(uri, result);
        pending.delete(uri);
        return result;
      });
      pending.set(uri, job);
    }
    job.then((result) => alive && setBox(result));
    return () => {
      alive = false;
    };
  }, [uri]);
  return box;
}
