import { Platform } from 'react-native';
import { samplePixels } from '@/lib/color';

/**
 * Free, on-device photo checks so the background removal has something good
 * to work with. Two passes:
 * - before upload: light, sharpness, plain background, framing;
 * - after background removal (web): is the cut-out one clean piece?
 */
export type PhotoIssue = 'dark' | 'bright' | 'blurry' | 'busyBackground' | 'lowContrast' | 'cropped' | 'tooSmall';
export type CutoutIssue = 'cutoutEmpty' | 'cutoutMessy';

export interface PhotoMetrics {
  /** Luminance of the brightest 1% — a black backdrop alone doesn't make a photo dark. */
  brightness: number;
  highlights: number;
  sharpness: number;
  borderNoise: number;
  coverage: number;
  edgeTouch: number;
  bboxArea: number;
}

const WIDTH = 320;
/** Distance (RGB) from the background colour above which a pixel is "garment". */
const FG_DIST = 40;

type RGB = [number, number, number];

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))] ?? 0;
}

export function measurePixels(data: Uint8Array | Uint8ClampedArray, width: number, height: number): PhotoMetrics {
  const n = width * height;
  const px = (x: number, y: number): RGB => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const dist = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  // Luminance map
  const gray = new Float32Array(n);
  let highlights = 0;
  for (let i = 0; i < n; i++) {
    const l = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    gray[i] = l;
    if (l >= 250) highlights += 1;
  }

  // Sharpness: strength of the Laplacian on the strongest edges only
  // (a plain background would drag an overall average down on a sharp photo).
  const lap: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      lap.push(4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width]);
    }
  }
  const mags = lap.map(Math.abs).sort((a, b) => a - b);
  // Mean of the top 10% strongest edges: robust to big plain areas.
  const top = mags.slice(Math.floor(mags.length * 0.9));
  // Normalised by the tonal range so a dim but sharp photo isn't called blurry.
  const tones = Array.from(gray).sort((a, b) => a - b);
  const range = Math.max(24, percentile(tones, 0.99) - percentile(tones, 0.01));
  const sharpness = ((top.reduce((s, v) => s + v, 0) / Math.max(1, top.length)) * 255) / range;

  // Background = median colour of the outer ring.
  const border: RGB[] = [];
  for (let x = 0; x < width; x++) border.push(px(x, 0), px(x, height - 1));
  for (let y = 1; y < height - 1; y++) border.push(px(0, y), px(width - 1, y));
  const bg: RGB = [0, 1, 2].map((c) => median(border.map((p) => p[c]))) as RGB;
  const borderDist = border.map((p) => dist(p, bg)).sort((a, b) => a - b);
  // How far the "typical" border pixel strays from the background: busy scenes score high.
  const borderNoise = percentile(borderDist, 0.6);

  // Garment mask
  let fg = 0;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (dist(px(x, y), bg) > FG_DIST) {
        fg += 1;
        xs.push(x);
        ys.push(y);
      }
    }
  }
  const sampled = Math.ceil(width / 2) * Math.ceil(height / 2);
  const coverage = fg / sampled;

  // Garment running off an edge: share of each side covered by garment.
  const side = (count: number, get: (k: number) => RGB) => {
    let hit = 0;
    for (let k = 0; k < count; k++) if (dist(get(k), bg) > FG_DIST) hit += 1;
    return hit / count;
  };
  const edgeTouch = Math.max(
    side(width, (k) => px(k, 0)),
    side(width, (k) => px(k, height - 1)),
    side(height, (k) => px(0, k)),
    side(height, (k) => px(width - 1, k))
  );

  let bboxArea = 0;
  if (xs.length > 20) {
    xs.sort((a, b) => a - b);
    ys.sort((a, b) => a - b);
    const w = percentile(xs, 0.98) - percentile(xs, 0.02);
    const h = percentile(ys, 0.98) - percentile(ys, 0.02);
    bboxArea = (w * h) / n;
  }

  return { brightness: percentile(tones, 0.99), highlights: highlights / n, sharpness, borderNoise, coverage, edgeTouch, bboxArea };
}

export function issuesFromMetrics(m: PhotoMetrics): PhotoIssue[] {
  const issues: PhotoIssue[] = [];
  if (m.brightness < 90) issues.push('dark');
  if (m.highlights > 0.35) issues.push('bright');
  if (m.sharpness < 14) issues.push('blurry');
  if (m.borderNoise > 38) {
    // The background can't be told apart, so framing can't be judged either.
    issues.push('busyBackground');
    return issues;
  }
  // Only the garment's outline stands out from the background.
  if (m.coverage < 0.03 || m.bboxArea === 0 || m.coverage / m.bboxArea < 0.35) issues.push('lowContrast');
  if (m.edgeTouch > 0.3) issues.push('cropped');
  else if (m.bboxArea > 0 && m.bboxArea < 0.18) issues.push('tooSmall');
  return issues;
}

export async function checkPhoto(uri: string): Promise<{ issues: PhotoIssue[]; metrics: PhotoMetrics } | null> {
  const img = await samplePixels(uri, WIDTH, `check-${Date.now()}`);
  if (!img) return null;
  const metrics = measurePixels(img.data, img.width, img.height);
  return { issues: issuesFromMetrics(metrics), metrics };
}

// ---------------------------------------------------------------------------
// After background removal
// ---------------------------------------------------------------------------

/** Share of opaque pixels and share of them in the biggest connected blob. */
export function measureAlpha(data: Uint8Array | Uint8ClampedArray, width: number, height: number) {
  const n = width * height;
  const solid = new Uint8Array(n);
  let opaque = 0;
  for (let i = 0; i < n; i++) {
    if (data[i * 4 + 3] > 128) {
      solid[i] = 1;
      opaque += 1;
    }
  }
  // Flood fill to find the largest blob.
  const seen = new Uint8Array(n);
  let largest = 0;
  const stack: number[] = [];
  for (let start = 0; start < n; start++) {
    if (!solid[start] || seen[start]) continue;
    let size = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      size += 1;
      const x = i % width;
      const neighbours = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width];
      for (const j of neighbours) {
        if (j >= 0 && j < n && solid[j] && !seen[j]) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (size > largest) largest = size;
  }
  return { coverage: opaque / n, mainBlob: opaque ? largest / opaque : 0 };
}

export function cutoutIssues(m: { coverage: number; mainBlob: number }): CutoutIssue[] {
  if (m.coverage < 0.04) return ['cutoutEmpty'];
  if (m.mainBlob < 0.85) return ['cutoutMessy'];
  return [];
}

function loadAlphaWeb(url: string, width: number): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = width;
        const h = Math.max(1, Math.round((img.height / img.width) * w));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ data: ctx.getImageData(0, 0, w, h).data, width: w, height: h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Checks the cut-out (web only; native keeps the result as is). */
export async function checkCutout(url: string): Promise<CutoutIssue[]> {
  if (Platform.OS !== 'web') return [];
  const img = await loadAlphaWeb(url, 96);
  if (!img) return [];
  return cutoutIssues(measureAlpha(img.data, img.width, img.height));
}

// ---------------------------------------------------------------------------
// Try-on photo of the user (full body, facing the camera)
// ---------------------------------------------------------------------------

export type BodyIssue = 'dark' | 'bright' | 'blurry' | 'landscape' | 'busyBackground' | 'cutOff' | 'tooFar';

export function bodyIssuesFromMetrics(m: PhotoMetrics, width: number, height: number, edges: { top: number; bottom: number }): BodyIssue[] {
  const issues: BodyIssue[] = [];
  if (height < width * 1.15) issues.push('landscape');
  if (m.brightness < 90) issues.push('dark');
  // No 'bright' here: a white wall behind the person is ideal, not overexposure.
  if (m.sharpness < 14) issues.push('blurry');
  if (m.borderNoise > 38) {
    // Framing can't be judged on a busy background; the AI check covers it.
    issues.push('busyBackground');
    return issues;
  }
  // Head touching the top of the frame means it's cut off. (The floor makes the
  // bottom edge unreliable: feet are left to the AI check.)
  if (edges.top > 0.07) issues.push('cutOff');
  else if (m.bboxArea > 0 && m.bboxArea < 0.12) issues.push('tooFar');
  return issues;
}

/**
 * Widest compact blob crossing the top and bottom rows, relative to the rest
 * of their own row. Comparing with the row itself (not the whole border) ignores gradients
 * and vignetting: only a compact object such as a head crossing the edge counts.
 */
export function topBottomEdges(data: Uint8Array | Uint8ClampedArray, width: number, height: number) {
  const row = (y: number) => {
    const pixels: RGB[] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
    const ref: RGB = [0, 1, 2].map((c) => median(pixels.map((p) => p[c]))) as RGB;
    // Longest run of standing-out pixels in the central 70% (corners vignette).
    let run = 0;
    let best = 0;
    for (let x = Math.floor(width * 0.15); x < Math.ceil(width * 0.85); x++) {
      const p = pixels[x];
      run = Math.hypot(p[0] - ref[0], p[1] - ref[1], p[2] - ref[2]) > FG_DIST ? run + 1 : 0;
      if (run > best) best = run;
    }
    return best / width;
  };
  return { top: row(0), bottom: row(height - 1) };
}

export async function checkBodyPhoto(uri: string): Promise<BodyIssue[] | null> {
  const img = await samplePixels(uri, 240, `body-${Date.now()}`);
  if (!img) return null;
  const metrics = measurePixels(img.data, img.width, img.height);
  return bodyIssuesFromMetrics(metrics, img.width, img.height, topBottomEdges(img.data, img.width, img.height));
}
