import type { CompanionKind, Shape } from './art';

/**
 * Weather outfits for the companion. Shapes live on the same 200×200 canvas
 * as the art and are split by depth so they move with the right body part:
 * - back:  behind everything (umbrella canopy)
 * - neck:  on the body, under the head (scarf)
 * - front: on the body, over the scarf (umbrella shaft held by the paw)
 * - head:  on top of the face (beanie, sunglasses)
 */
export type CompanionAccessory = 'umbrella' | 'winter' | 'scarf' | 'sunglasses';

export interface AccessoryLayers {
  back: Shape[];
  neck: Shape[];
  front: Shape[];
  head: Shape[];
}

export function accessoryForWeather(temp: number | null, main: string | null): CompanionAccessory | null {
  if (main === 'Rain' || main === 'Drizzle' || main === 'Thunderstorm') return 'umbrella';
  if (main === 'Snow' || (temp !== null && temp <= 8)) return 'winter';
  if (temp !== null && temp <= 13) return 'scarf';
  if (main === 'Clear' && temp !== null && temp >= 22) return 'sunglasses';
  return null;
}

/** Face landmarks each accessory is fitted to. */
const FIT: Record<CompanionKind, { eyeY: number; eyeL: number; eyeR: number; headTop: number; chin: number; sideL: number; sideR: number; paw: [number, number] }> = {
  dylan: { eyeY: 79, eyeL: 83, eyeR: 117, headTop: 40, chin: 126, sideL: 52, sideR: 148, paw: [87, 183] },
  miso: { eyeY: 78, eyeL: 82, eyeR: 118, headTop: 44, chin: 122, sideL: 54, sideR: 146, paw: [88, 183] },
  noisette: { eyeY: 82, eyeL: 82, eyeR: 118, headTop: 46, chin: 125, sideL: 55, sideR: 145, paw: [89, 180] },
};

const KNIT = { main: '#C0463C', dark: '#98332B', cream: '#F3E6D2' };
const UMBRELLA = { main: '#F2C14E', dark: '#D89B2B', shaft: '#3A3230' };
const SHADES = '#1C1C22';

const r1 = (n: number) => Math.round(n * 10) / 10;

function beanie(kind: CompanionKind): Shape[] {
  const f = FIT[kind];
  const brimBottom = f.eyeY - 12;
  const brimTop = brimBottom - 11;
  const top = f.headTop - 8;
  const half = 44;
  const L = 100 - half;
  const R = 100 + half;
  const ribs = [78, 89, 100, 111, 122]
    .map((x) => `M${x} ${brimTop + 1} Q${x + (x - 100) * 0.08} ${r1((brimTop + top) / 2)} ${x + (x - 100) * 0.25} ${top + 8}`)
    .join(' ');
  return [
    // knitted dome
    { t: 'path', d: `M${L + 3} ${brimTop + 4} C ${L + 2} ${top - 2}, ${R - 2} ${top - 2}, ${R - 3} ${brimTop + 4} Z`, fill: KNIT.main },
    { t: 'path', d: ribs, stroke: KNIT.dark, strokeWidth: 1.6, opacity: 0.45 },
    // folded cuff
    { t: 'path', d: `M${L} ${brimTop + 2} Q100 ${brimTop - 5} ${R} ${brimTop + 2} L${R + 1} ${brimBottom - 1} Q100 ${brimBottom - 7} ${L - 1} ${brimBottom - 1} Z`, fill: KNIT.dark },
    {
      t: 'path',
      d: [66, 76, 86, 96, 104, 114, 124, 134].map((x) => `M${x} ${brimTop + 1} L${x} ${brimBottom - 4}`).join(' '),
      stroke: KNIT.main,
      strokeWidth: 1.4,
      opacity: 0.5,
    },
    // pompom
    { t: 'circle', cx: 100, cy: top - 3, r: 9.5, fill: KNIT.cream },
    { t: 'circle', cx: 97, cy: top - 6, r: 3.5, fill: '#FFFFFF', opacity: 0.7 },
  ];
}

function scarf(kind: CompanionKind): Shape[] {
  const c = FIT[kind].chin;
  return [
    // band wrapped round the neck, peeking out under the chin
    { t: 'path', d: `M64 ${c - 10} Q100 ${c + 4} 136 ${c - 10} L138 ${c + 4} Q100 ${c + 20} 62 ${c + 4} Z`, fill: KNIT.main },
    { t: 'path', d: `M63 ${c - 2} Q100 ${c + 12} 137 ${c - 2}`, stroke: KNIT.cream, strokeWidth: 3, opacity: 0.9 },
    // hanging end on the chest
    { t: 'path', d: `M74 ${c + 4} L90 ${c + 8} L86 ${c + 44} L70 ${c + 41} Z`, fill: KNIT.main },
    { t: 'path', d: `M73 ${c + 18} L88.5 ${c + 21} M72 ${c + 30} L87.5 ${c + 33}`, stroke: KNIT.cream, strokeWidth: 3 },
    { t: 'path', d: `M71 ${c + 42} L70 ${c + 49} M76 ${c + 43} L75.5 ${c + 50} M81 ${c + 44} L81 ${c + 51} M85.5 ${c + 44.5} L86 ${c + 51}`, stroke: KNIT.dark, strokeWidth: 2 },
    // knot
    { t: 'ellipse', cx: 82, cy: c + 7, rx: 9, ry: 7, fill: KNIT.dark },
  ];
}

function sunglasses(kind: CompanionKind): Shape[] {
  const f = FIT[kind];
  const y = f.eyeY;
  // Dark fur hides a black frame: Dylan gets a bright one.
  const frame = kind === 'dylan' ? UMBRELLA.main : SHADES;
  const lens = (x: number): Shape[] => [
    {
      t: 'path',
      d: `M${x - 13} ${y - 7} Q${x} ${y - 10} ${x + 13} ${y - 7} Q${x + 13} ${y + 10} ${x} ${y + 10} Q${x - 13} ${y + 10} ${x - 13} ${y - 7} Z`,
      fill: SHADES,
      stroke: frame,
      strokeWidth: 2.4,
    },
    { t: 'path', d: `M${x - 8} ${y - 3} Q${x - 4} ${y - 6} ${x + 1} ${y - 5}`, stroke: '#FFFFFF', strokeWidth: 2, opacity: 0.35 },
  ];
  return [
    // arms back to the temples
    { t: 'path', d: `M${f.eyeL - 12} ${y - 5} L${f.sideL + 3} ${y - 9} M${f.eyeR + 12} ${y - 5} L${f.sideR - 3} ${y - 9}`, stroke: frame, strokeWidth: 3 },
    ...lens(f.eyeL),
    ...lens(f.eyeR),
    // bridge
    { t: 'path', d: `M${f.eyeL + 12} ${y - 6} Q100 ${y - 11} ${f.eyeR - 12} ${y - 6}`, stroke: frame, strokeWidth: 3 },
  ];
}

/** Umbrella tilted over the left shoulder; canopy maths done once in local coords. */
function umbrella(kind: CompanionKind): { back: Shape[]; front: Shape[] } {
  const f = FIT[kind];
  const cx = 46;
  const cy = 52;
  const a = (-22 * Math.PI) / 180;
  const p = (x: number, y: number) => `${r1(cx + x * Math.cos(a) - y * Math.sin(a))} ${r1(cy + x * Math.sin(a) + y * Math.cos(a))}`;
  // dome with a scalloped rim
  const canopy = `M${p(-44, 0)} C ${p(-44, -26)} ${p(-24, -36)} ${p(0, -36)} C ${p(24, -36)} ${p(44, -26)} ${p(44, 0)} Q ${p(33, -8)} ${p(22, 0)} Q ${p(11, -8)} ${p(0, 0)} Q ${p(-11, -8)} ${p(-22, 0)} Q ${p(-33, -8)} ${p(-44, 0)} Z`;
  const panels = `M${p(0, -36)} Q ${p(-12, -18)} ${p(-22, 0)} M${p(0, -36)} Q ${p(12, -18)} ${p(22, 0)}`;
  const [px, py] = f.paw;
  return {
    back: [
      { t: 'path', d: canopy, fill: UMBRELLA.main },
      { t: 'path', d: panels, stroke: UMBRELLA.dark, strokeWidth: 2 },
      { t: 'path', d: `M${p(0, -36)} L${p(0, -43)}`, stroke: UMBRELLA.shaft, strokeWidth: 3 },
    ],
    front: [
      { t: 'path', d: `M${p(0, -2)} L${px} ${py - 4} Q${px + 1} ${py + 6} ${px - 7} ${py + 4}`, stroke: UMBRELLA.shaft, strokeWidth: 3 },
    ],
  };
}

export function accessoryLayers(kind: CompanionKind, accessory: CompanionAccessory | null | undefined): AccessoryLayers {
  const none: AccessoryLayers = { back: [], neck: [], front: [], head: [] };
  if (!accessory) return none;
  if (accessory === 'umbrella') return { ...none, ...umbrella(kind) };
  if (accessory === 'winter') return { ...none, neck: scarf(kind), head: beanie(kind) };
  if (accessory === 'scarf') return { ...none, neck: scarf(kind) };
  return { ...none, head: sunglasses(kind) };
}
