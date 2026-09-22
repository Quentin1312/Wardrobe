import { Platform, Share } from 'react-native';
import { fonts } from '@/constants/theme';
import { colorName } from '@/lib/color';
import { COMPANION_ART, type CompanionKind } from '@/lib/companion';
import { accessoryForWeather, accessoryLayers } from '@/lib/companion/accessories';
import type { Shape } from '@/lib/companion/art';
import type { Locale } from '@/lib/i18n';
import type { Clothing, ClothingCategory } from '@/lib/types';

/**
 * "Share my look": a 1080×1350 (4:5, Instagram-friendly) card with the pieces
 * stacked like the fitting room, their names and colours, the weather and the
 * companion dressed for it. Drawn on a canvas (web), shared with the Web Share
 * API, or downloaded when the browser can't share files.
 */
export interface LookCardInput {
  items: Clothing[];
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  firstName: string | null;
  weather: { temp: number; condition: string; main: string } | null;
  companion: CompanionKind | null;
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

const W = 1080;
const H = 1350;
const PAD = 72;
const INK = '#151517';
const MUTED = '#6D6D68';
const BG = '#F2F2EE';
const CARD = '#FFFFFF';
const ACCENT = '#635BFF';
const LIME = '#C9FF3F';

const ORDER: ClothingCategory[] = ['jacket', 'top', 'bottom', 'shoes', 'accessory'];
const WEIGHT: Record<ClothingCategory, number> = { jacket: 1, top: 1, bottom: 1.15, shoes: 0.6, accessory: 0.55 };

export function orderLook(items: Clothing[]): Clothing[] {
  const rank = (c: Clothing) => (c.category ? ORDER.indexOf(c.category) : ORDER.length);
  return [...items].sort((a, b) => rank(a) - rank(b));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

function shapeSvg(s: Shape): string {
  const op = s.opacity ?? 1;
  if (s.t === 'ellipse') return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${s.fill}" opacity="${op}"/>`;
  if (s.t === 'circle') return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.fill}" opacity="${op}"/>`;
  return `<path d="${s.d}" fill="${s.fill ?? 'none'}" stroke="${s.stroke ?? 'none'}" stroke-width="${s.strokeWidth ?? 0}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
}

/** The companion, happy and dressed for the weather, as a standalone SVG. */
function companionSvg(kind: CompanionKind, weather: LookCardInput['weather']): string {
  const art = COMPANION_ART[kind];
  const acc = accessoryLayers(kind, weather ? accessoryForWeather(weather.temp, weather.main) : null);
  const shapes = [...acc.back, ...art.tail, ...art.body, ...acc.neck, ...acc.front, ...art.head, ...art.eyes, ...art.mouthHappy, ...acc.head];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 200 200">${shapes.map(shapeSvg).join('')}</svg>`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Cuts text with an ellipsis so it fits the width. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
}

/** Word-wraps into at most `max` lines, the last one ellipsed. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(next).width <= width || !line) {
      line = next;
      continue;
    }
    lines.push(line);
    line = words[i];
    if (lines.length === max - 1) {
      line = words.slice(i).join(' ');
      break;
    }
  }
  lines.push(line);
  return lines.slice(0, max).map((l, i, all) => (i === all.length - 1 ? fit(ctx, l, width) : l));
}

function font(size: number, family: string) {
  return `${size}px ${family}, "Helvetica Neue", Arial, sans-serif`;
}

async function ensureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(
    [fonts.sans, fonts.sansMedium, fonts.sansSemi, fonts.sansBold, fonts.serifItalic].map((f) =>
      document.fonts.load(`40px ${f}`).catch(() => [])
    )
  );
}

export async function renderLookCard(input: LookCardInput): Promise<Blob> {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Header: lime pill + date, then the title.
  const { t, locale } = input;
  ctx.font = font(26, fonts.sansBold);
  const pill = t('share.eyebrow').toUpperCase();
  const pillW = ctx.measureText(pill).width + 44;
  ctx.fillStyle = LIME;
  roundRect(ctx, PAD, PAD, pillW, 50, 25);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.fillText(pill, PAD + 22, PAD + 26);

  const date = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  ctx.font = font(28, fonts.sansMedium);
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'right';
  ctx.fillText(date.charAt(0).toUpperCase() + date.slice(1), W - PAD, PAD + 26);
  ctx.textAlign = 'left';

  ctx.font = font(92, fonts.serifItalic);
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  const title = input.firstName ? t('share.titleNamed', { name: input.firstName }) : t('share.title');
  ctx.fillText(fit(ctx, title, W - PAD * 2), PAD, PAD + 160);

  // Pieces, stacked like the fitting room, labels on the right.
  const pieces = orderLook(input.items).slice(0, 5);
  const top = PAD + 210;
  const bottom = H - 230;
  const gap = 18;
  const total = pieces.reduce((sum, p) => sum + WEIGHT[p.category ?? 'accessory'], 0) || 1;
  const avail = bottom - top - gap * Math.max(0, pieces.length - 1);
  const boxX = PAD;
  const boxW = 560;
  const labelX = boxX + boxW + 40;
  const labelW = W - PAD - labelX;

  const images = await Promise.all(
    pieces.map((p) => loadImage(p.photo_clean_url ?? p.photo_url).catch(() => null))
  );

  let y = top;
  pieces.forEach((piece, i) => {
    const h = (avail * WEIGHT[piece.category ?? 'accessory']) / total;
    ctx.fillStyle = CARD;
    roundRect(ctx, boxX, y, boxW, h, 30);
    ctx.fill();

    const img = images[i];
    if (img) {
      const inset = 22;
      const scale = Math.min((boxW - inset * 2) / img.width, (h - inset * 2) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      roundRect(ctx, boxX, y, boxW, h, 30);
      ctx.clip();
      ctx.drawImage(img, boxX + (boxW - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.restore();
    }

    // Label block, vertically centred on its piece.
    ctx.font = font(36, fonts.sansSemi);
    const nameLines = wrap(ctx, piece.name ?? t(`category.${piece.category ?? 'accessory'}`), labelW, 2);
    const colour = colorName(piece.dominant_color, locale);
    const blockH = 34 + nameLines.length * 42 + (colour ? 40 : 0);
    let ly = y + h / 2 - blockH / 2;
    ctx.font = font(22, fonts.sansBold);
    ctx.fillStyle = ACCENT;
    ctx.fillText(t(`category.${piece.category ?? 'accessory'}`).toUpperCase(), labelX, ly + 22);
    ly += 34;
    ctx.font = font(36, fonts.sansSemi);
    ctx.fillStyle = INK;
    for (const l of nameLines) {
      ctx.fillText(l, labelX, ly + 34);
      ly += 42;
    }
    if (colour && piece.dominant_color) {
      ctx.beginPath();
      ctx.arc(labelX + 11, ly + 18, 11, 0, Math.PI * 2);
      ctx.fillStyle = piece.dominant_color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = font(26, fonts.sans);
      ctx.fillStyle = MUTED;
      ctx.fillText(fit(ctx, colour, labelW - 34), labelX + 32, ly + 27);
    }
    y += h + gap;
  });

  // Footer: wordmark + weather on the left, companion on the right.
  ctx.font = font(64, fonts.serifItalic);
  ctx.fillStyle = INK;
  ctx.fillText('Wardrobe', PAD, H - PAD - 14);
  if (input.weather) {
    ctx.font = font(28, fonts.sansMedium);
    ctx.fillStyle = MUTED;
    ctx.fillText(fit(ctx, `${input.weather.temp}° · ${input.weather.condition}`, 520), PAD, H - PAD - 100);
  }
  if (input.companion) {
    const svg = companionSvg(input.companion, input.weather);
    const pet = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`).catch(() => null);
    if (pet) ctx.drawImage(pet, W - PAD - 220, H - 236, 220, 220);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('blob'))), 'image/png')
  );
}

export async function prepareLookFile(input: LookCardInput): Promise<File> {
  const blob = await renderLookCard(input);
  const stamp = new Date().toISOString().slice(0, 10);
  return new File([blob], `wardrobe-look-${stamp}.png`, { type: 'image/png' });
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Shares the prepared card; falls back to a download when files can't be shared. */
export async function shareLookFile(file: File, text: string): Promise<ShareResult> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text });
      return 'shared';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'cancelled';
      // e.g. the gesture expired while the image was drawing: save it instead.
    }
  }
  try {
    download(file);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

/** Native fallback: share the look as text. */
export async function shareLookText(input: LookCardInput): Promise<ShareResult> {
  const lines = orderLook(input.items).map((p) => {
    const colour = colorName(p.dominant_color, input.locale);
    return `· ${p.name ?? input.t(`category.${p.category ?? 'accessory'}`)}${colour ? ` (${colour})` : ''}`;
  });
  try {
    const res = await Share.share({ message: `${input.t('share.title')}\n${lines.join('\n')}` });
    return res.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    return 'failed';
  }
}

export const canDrawCard = Platform.OS === 'web';
