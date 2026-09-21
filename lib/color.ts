import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { Platform } from 'react-native';
import type { Locale } from '@/lib/i18n';

/**
 * Free, on-device dominant colour of a garment photo.
 *
 * The photo is shrunk to a tiny thumbnail, the background colour is estimated
 * from the border pixels and ignored, and the most common remaining colour is
 * returned as a hex string.
 */
const SAMPLE_WIDTH = 48;

async function toLocalUri(uri: string, key: string): Promise<string> {
  // The manipulator only reads local files on native; the web build can load URLs.
  if (Platform.OS === 'web' || /^(file|data|blob|content|ph|assets-library):/.test(uri)) return uri;
  const target = `${FileSystem.cacheDirectory}color-${key}.img`;
  const { uri: local } = await FileSystem.downloadAsync(uri, target);
  return local;
}

export async function extractDominantColor(uri: string, key = 'sample'): Promise<string | null> {
  try {
    const src = await toLocalUri(uri, key);
    const small = await ImageManipulator.manipulateAsync(src, [{ resize: { width: SAMPLE_WIDTH } }], {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (!small.base64) return null;
    const img = jpeg.decode(new Uint8Array(decodeBase64(small.base64)), { useTArray: true });
    return dominantFromPixels(img.data, img.width, img.height);
  } catch {
    return null;
  }
}

type RGB = [number, number, number];

function dist(a: RGB, b: RGB): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function median(values: number[]): number {
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

export function dominantFromPixels(data: Uint8Array, width: number, height: number): string | null {
  const px = (x: number, y: number): RGB => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // Background = median of the outer ring of pixels.
  const border: RGB[] = [];
  for (let x = 0; x < width; x++) border.push(px(x, 0), px(x, height - 1));
  for (let y = 0; y < height; y++) border.push(px(0, y), px(width - 1, y));
  const bg: RGB = [0, 1, 2].map((c) => median(border.map((p) => p[c]))) as RGB;

  const collect = (skipBackground: boolean, inset: number) => {
    const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
    let kept = 0;
    const x0 = Math.floor(width * inset);
    const y0 = Math.floor(height * inset);
    for (let y = y0; y < height - y0; y++) {
      for (let x = x0; x < width - x0; x++) {
        const p = px(x, y);
        if (skipBackground && dist(p, bg) < 42) continue;
        kept += 1;
        const key = ((p[0] >> 4) << 8) | ((p[1] >> 4) << 4) | (p[2] >> 4);
        const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        bucket.n += 1;
        bucket.r += p[0];
        bucket.g += p[1];
        bucket.b += p[2];
        buckets.set(key, bucket);
      }
    }
    return { buckets, kept };
  };

  let { buckets, kept } = collect(true, 0.08);
  // Garment the same colour as the background: fall back to the centre.
  if (kept < width * height * 0.05) ({ buckets, kept } = collect(false, 0.3));
  if (kept === 0) return null;

  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) if (!best || bucket.n > best.n) best = bucket;
  if (!best) return null;
  const hex = [best.r, best.g, best.b]
    .map((sum) => Math.round(sum / best!.n).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

// ---------------------------------------------------------------------------
// Human colour names, used in the UI and to brief the stylist.
// ---------------------------------------------------------------------------

function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

const NAMES = {
  black: { fr: 'noir', en: 'black' },
  white: { fr: 'blanc', en: 'white' },
  lightGrey: { fr: 'gris clair', en: 'light grey' },
  grey: { fr: 'gris', en: 'grey' },
  charcoal: { fr: 'anthracite', en: 'charcoal' },
  beige: { fr: 'beige', en: 'beige' },
  camel: { fr: 'camel', en: 'camel' },
  brown: { fr: 'marron', en: 'brown' },
  burgundy: { fr: 'bordeaux', en: 'burgundy' },
  red: { fr: 'rouge', en: 'red' },
  orange: { fr: 'orange', en: 'orange' },
  yellow: { fr: 'jaune', en: 'yellow' },
  khaki: { fr: 'kaki', en: 'khaki' },
  green: { fr: 'vert', en: 'green' },
  darkGreen: { fr: 'vert foncé', en: 'dark green' },
  teal: { fr: 'bleu canard', en: 'teal' },
  navy: { fr: 'bleu marine', en: 'navy' },
  lightBlue: { fr: 'bleu clair', en: 'light blue' },
  denim: { fr: 'bleu jean', en: 'denim blue' },
  blue: { fr: 'bleu', en: 'blue' },
  purple: { fr: 'violet', en: 'purple' },
  pink: { fr: 'rose', en: 'pink' },
} as const;

export function colorName(hex: string | null | undefined, locale: Locale): string | null {
  if (!hex) return null;
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  const [h, s, l] = hsl;
  const pick = (key: keyof typeof NAMES) => NAMES[key][locale];

  if (l < 0.15) return pick('black');
  if (l > 0.9 && s < 0.3) return pick('white');
  if (s < 0.13) return l > 0.66 ? pick('lightGrey') : l > 0.34 ? pick('grey') : pick('charcoal');
  if (h >= 20 && h < 50 && s < 0.5 && l > 0.62) return pick('beige');
  if (h >= 10 && h < 45 && l < 0.4) return pick('brown');
  if (h >= 22 && h < 45 && l <= 0.62) return pick('camel');
  if (h < 10 || h >= 345) return l < 0.32 ? pick('burgundy') : pick('red');
  if (h < 38) return pick('orange');
  if (h >= 45 && h < 100 && s < 0.5 && l < 0.5) return pick('khaki');
  if (h < 65) return pick('yellow');
  if (h < 170) return l < 0.3 ? pick('darkGreen') : pick('green');
  if (h < 195) return pick('teal');
  if (h < 255) {
    if (l < 0.3) return pick('navy');
    if (l > 0.7) return pick('lightBlue');
    if (s < 0.5) return pick('denim');
    return pick('blue');
  }
  if (h < 290) return pick('purple');
  return pick('pink');
}
