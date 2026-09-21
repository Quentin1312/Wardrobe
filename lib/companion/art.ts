// Vector art for the companions, as plain shape data on a 200×200 canvas.
// Split into layers so each part (tail, body, head, eyelids, mouth) can be
// animated independently by CompanionAvatar.

export type Shape =
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; opacity?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string; opacity?: number }
  | {
      t: 'path';
      d: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    };

export interface CompanionArt {
  tail: Shape[];
  /** Point the tail swings around. */
  tailPivot: [number, number];
  body: Shape[];
  head: Shape[];
  eyes: Shape[];
  lids: Shape[];
  /** Top of the eyes — lids close downward from here. */
  lidTop: number;
  mouthIdle: Shape[];
  mouthHappy: Shape[];
  /** Where the head pivots when it tilts. */
  neck: [number, number];
}

const SHADOW: Shape = { t: 'ellipse', cx: 100, cy: 194, rx: 50, ry: 5, fill: '#000000', opacity: 0.14 };

/** Soft fur outline: rounded tufts (quadratic curves) around a centre. */
function fur(cx: number, cy: number, rx: number, ry: number, len: number, count: number, fill: string): Shape {
  const at = (a: number, extra: number) =>
    `${(cx + Math.cos(a) * (rx + extra)).toFixed(1)} ${(cy + Math.sin(a) * (ry + extra)).toFixed(1)}`;
  const step = (Math.PI * 2) / count;
  let d = `M${at(-Math.PI / 2, 0)}`;
  for (let i = 0; i < count; i++) {
    const a0 = -Math.PI / 2 + i * step;
    // tuft tip slightly off-centre for a brushed, hand-drawn feel
    d += ` Q${at(a0 + step * 0.55, len)} ${at(a0 + step, 0)}`;
  }
  return { t: 'path', d: d + ' Z', fill };
}

// ---------------------------------------------------------------------------
// Dylan — black & tan merle Pomeranian with one ice-blue eye.
// ---------------------------------------------------------------------------
const D = {
  black: '#26211E',
  dark: '#3A322D',
  grey: '#8E8882',
  silver: '#BDB7AE',
  tan: '#C47A38',
  tanLight: '#DFA361',
  blue: '#8CC6EC',
  brown: '#4B2A16',
  pupil: '#141110',
};

const dylan: CompanionArt = {
  tailPivot: [134, 130],
  tail: [
    { t: 'path', d: 'M130 134 C 168 132, 190 100, 176 70 C 168 54, 150 54, 146 68 C 160 80, 160 106, 126 120 Z', fill: D.grey },
    { t: 'path', d: 'M150 70 C 164 78, 168 98, 150 114 C 162 96, 160 84, 150 70 Z', fill: D.silver, opacity: 0.8 },
    { t: 'path', d: 'M176 70 C 168 56, 154 56, 148 66 C 160 64, 170 70, 176 80 Z', fill: D.dark },
  ],
  body: [
    SHADOW,
    fur(100, 150, 44, 36, 9, 20, D.dark),
    { t: 'ellipse', cx: 100, cy: 150, rx: 48, ry: 40, fill: D.dark },
    { t: 'ellipse', cx: 74, cy: 152, rx: 17, ry: 13, fill: D.grey },
    { t: 'ellipse', cx: 127, cy: 160, rx: 15, ry: 10, fill: D.silver, opacity: 0.85 },
    { t: 'ellipse', cx: 120, cy: 136, rx: 10, ry: 7, fill: D.grey },
    { t: 'path', d: 'M76 118 Q100 152 124 118 Q120 150 100 160 Q80 150 76 118 Z', fill: D.silver },
    { t: 'ellipse', cx: 86, cy: 176, rx: 10, ry: 15, fill: D.tan },
    { t: 'ellipse', cx: 114, cy: 176, rx: 10, ry: 15, fill: D.tan },
    { t: 'ellipse', cx: 86, cy: 189, rx: 13, ry: 6, fill: D.tanLight },
    { t: 'ellipse', cx: 114, cy: 189, rx: 13, ry: 6, fill: D.tanLight },
  ],
  neck: [100, 118],
  head: [
    // ears
    { t: 'path', d: 'M64 60 L56 20 L90 44 Z', fill: D.black },
    { t: 'path', d: 'M67 53 L62 31 L82 46 Z', fill: D.tan },
    { t: 'path', d: 'M136 60 L144 20 L110 44 Z', fill: D.black },
    { t: 'path', d: 'M133 53 L138 31 L118 46 Z', fill: D.tan },
    // fluffy mane
    fur(100, 82, 40, 36, 11, 22, D.black),
    { t: 'ellipse', cx: 100, cy: 82, rx: 42, ry: 38, fill: D.black },
    // tan eyebrows, cheeks and muzzle
    { t: 'ellipse', cx: 83, cy: 64, rx: 6, ry: 4, fill: D.tanLight },
    { t: 'ellipse', cx: 117, cy: 64, rx: 6, ry: 4, fill: D.tanLight },
    { t: 'ellipse', cx: 76, cy: 96, rx: 13, ry: 10, fill: D.tan },
    { t: 'ellipse', cx: 124, cy: 96, rx: 13, ry: 10, fill: D.tan },
    { t: 'ellipse', cx: 100, cy: 100, rx: 18, ry: 13, fill: D.tanLight },
    // nose
    { t: 'path', d: 'M91 92 Q100 87 109 92 Q107 100 100 101 Q93 100 91 92 Z', fill: D.black },
    { t: 'ellipse', cx: 96.5, cy: 91.5, rx: 3, ry: 1.6, fill: '#FFFFFF', opacity: 0.45 },
  ],
  // one ice-blue eye, one brown — like the real Dylan
  eyes: [
    { t: 'circle', cx: 83, cy: 79, r: 8.5, fill: D.blue },
    { t: 'circle', cx: 83, cy: 79, r: 4.6, fill: D.pupil },
    { t: 'circle', cx: 80.5, cy: 76, r: 2.2, fill: '#FFFFFF' },
    { t: 'circle', cx: 117, cy: 79, r: 8.5, fill: D.brown },
    { t: 'circle', cx: 117, cy: 79, r: 4.6, fill: D.pupil },
    { t: 'circle', cx: 114.5, cy: 76, r: 2.2, fill: '#FFFFFF' },
  ],
  lidTop: 69,
  lids: [
    { t: 'ellipse', cx: 83, cy: 79, rx: 11, ry: 10.5, fill: D.black },
    { t: 'ellipse', cx: 117, cy: 79, rx: 11, ry: 10.5, fill: D.black },
  ],
  mouthIdle: [
    { t: 'path', d: 'M100 101 Q100 107 93 108 M100 101 Q100 107 107 108', stroke: D.black, strokeWidth: 2.2 },
  ],
  mouthHappy: [
    { t: 'path', d: 'M90 104 Q100 122 110 104 Z', fill: '#3A1712' },
    { t: 'ellipse', cx: 100, cy: 114, rx: 5.5, ry: 5, fill: '#E27B7B' },
  ],
};

// ---------------------------------------------------------------------------
// Miso — a creamy ginger cat.
// ---------------------------------------------------------------------------
const C = {
  orange: '#E4A35E',
  stripe: '#C27B3B',
  cream: '#F5E0BD',
  pink: '#EFA99A',
  green: '#86C58A',
  pupil: '#161211',
  whisker: '#6B4B33',
};

const miso: CompanionArt = {
  tailPivot: [128, 162],
  tail: [
    { t: 'path', d: 'M126 168 C 172 168, 184 124, 160 102 C 150 94, 142 104, 150 112 C 164 128, 150 152, 124 154 Z', fill: C.orange },
    { t: 'path', d: 'M156 114 C 162 122, 162 130, 158 138 L 152 134 C 156 128, 156 122, 152 118 Z', fill: C.stripe },
    { t: 'path', d: 'M160 102 C 150 94, 142 104, 150 112 C 152 106, 156 104, 162 106 Z', fill: C.cream },
  ],
  body: [
    SHADOW,
    { t: 'ellipse', cx: 100, cy: 154, rx: 42, ry: 38, fill: C.orange },
    { t: 'path', d: 'M64 146 Q70 140 76 148', stroke: C.stripe, strokeWidth: 5 },
    { t: 'path', d: 'M136 146 Q130 140 124 148', stroke: C.stripe, strokeWidth: 5 },
    { t: 'ellipse', cx: 100, cy: 162, rx: 22, ry: 25, fill: C.cream },
    { t: 'ellipse', cx: 86, cy: 188, rx: 12, ry: 7, fill: C.cream },
    { t: 'ellipse', cx: 114, cy: 188, rx: 12, ry: 7, fill: C.cream },
  ],
  neck: [100, 116],
  head: [
    { t: 'path', d: 'M66 66 L62 24 L94 50 Z', fill: C.orange },
    { t: 'path', d: 'M70 59 L67 35 L87 52 Z', fill: C.pink },
    { t: 'path', d: 'M134 66 L138 24 L106 50 Z', fill: C.orange },
    { t: 'path', d: 'M130 59 L133 35 L113 52 Z', fill: C.pink },
    { t: 'ellipse', cx: 100, cy: 84, rx: 40, ry: 35, fill: C.orange },
    // forehead stripes
    { t: 'path', d: 'M100 52 L100 64', stroke: C.stripe, strokeWidth: 4 },
    { t: 'path', d: 'M90 54 L92 64', stroke: C.stripe, strokeWidth: 3.5 },
    { t: 'path', d: 'M110 54 L108 64', stroke: C.stripe, strokeWidth: 3.5 },
    // muzzle
    { t: 'ellipse', cx: 92, cy: 100, rx: 10, ry: 8, fill: C.cream },
    { t: 'ellipse', cx: 108, cy: 100, rx: 10, ry: 8, fill: C.cream },
    { t: 'path', d: 'M95 93 L105 93 L100 99 Z', fill: C.pink },
    // whiskers
    { t: 'path', d: 'M84 100 L60 96 M84 104 L60 106', stroke: C.whisker, strokeWidth: 1.4, opacity: 0.6 },
    { t: 'path', d: 'M116 100 L140 96 M116 104 L140 106', stroke: C.whisker, strokeWidth: 1.4, opacity: 0.6 },
  ],
  eyes: [
    { t: 'ellipse', cx: 84, cy: 82, rx: 8, ry: 9, fill: C.green },
    { t: 'ellipse', cx: 84, cy: 82, rx: 2.4, ry: 7, fill: C.pupil },
    { t: 'circle', cx: 81.5, cy: 78.5, r: 2, fill: '#FFFFFF' },
    { t: 'ellipse', cx: 116, cy: 82, rx: 8, ry: 9, fill: C.green },
    { t: 'ellipse', cx: 116, cy: 82, rx: 2.4, ry: 7, fill: C.pupil },
    { t: 'circle', cx: 113.5, cy: 78.5, r: 2, fill: '#FFFFFF' },
  ],
  lidTop: 72,
  lids: [
    { t: 'ellipse', cx: 84, cy: 82, rx: 10, ry: 11, fill: C.orange },
    { t: 'ellipse', cx: 116, cy: 82, rx: 10, ry: 11, fill: C.orange },
  ],
  mouthIdle: [
    { t: 'path', d: 'M100 99 Q96 105 91 102 M100 99 Q104 105 109 102', stroke: C.whisker, strokeWidth: 2 },
  ],
  mouthHappy: [{ t: 'path', d: 'M93 102 Q100 113 107 102 Z', fill: '#6B2A22' }],
};

// ---------------------------------------------------------------------------
// Roux — a fox with a big white-tipped tail.
// ---------------------------------------------------------------------------
const F = {
  orange: '#DA6A2E',
  deep: '#B9521F',
  white: '#F7F0E6',
  dark: '#3A2820',
  amber: '#E3A83C',
  pupil: '#161110',
};

const roux: CompanionArt = {
  tailPivot: [126, 148],
  tail: [
    { t: 'path', d: 'M124 154 C 176 156, 194 102, 168 76 C 154 64, 138 76, 148 90 C 160 108, 152 134, 120 140 Z', fill: F.orange },
    { t: 'path', d: 'M168 76 C 154 64, 138 76, 148 90 C 154 84, 162 82, 172 88 C 174 82, 172 78, 168 76 Z', fill: F.white },
    { t: 'path', d: 'M160 110 C 166 124, 158 138, 140 144 C 154 134, 160 124, 160 110 Z', fill: F.deep },
  ],
  body: [
    SHADOW,
    { t: 'ellipse', cx: 100, cy: 154, rx: 40, ry: 38, fill: F.orange },
    { t: 'path', d: 'M78 122 Q100 172 122 122 Q116 162 100 170 Q84 162 78 122 Z', fill: F.white },
    { t: 'ellipse', cx: 86, cy: 180, rx: 9, ry: 13, fill: F.dark },
    { t: 'ellipse', cx: 114, cy: 180, rx: 9, ry: 13, fill: F.dark },
    { t: 'ellipse', cx: 86, cy: 190, rx: 11, ry: 5, fill: F.dark },
    { t: 'ellipse', cx: 114, cy: 190, rx: 11, ry: 5, fill: F.dark },
  ],
  neck: [100, 114],
  head: [
    { t: 'path', d: 'M62 64 L54 14 L94 46 Z', fill: F.orange },
    { t: 'path', d: 'M54 14 L58 30 L68 24 Z', fill: F.dark },
    { t: 'path', d: 'M67 56 L62 30 L85 49 Z', fill: F.white },
    { t: 'path', d: 'M138 64 L146 14 L106 46 Z', fill: F.orange },
    { t: 'path', d: 'M146 14 L142 30 L132 24 Z', fill: F.dark },
    { t: 'path', d: 'M133 56 L138 30 L115 49 Z', fill: F.white },
    { t: 'path', d: 'M58 72 Q60 46 100 44 Q140 46 142 72 Q140 98 100 118 Q60 98 58 72 Z', fill: F.orange },
    { t: 'path', d: 'M60 78 Q72 106 100 118 Q86 100 84 86 Q72 88 60 78 Z', fill: F.white },
    { t: 'path', d: 'M140 78 Q128 106 100 118 Q114 100 116 86 Q128 88 140 78 Z', fill: F.white },
    { t: 'path', d: 'M94 108 Q100 103 106 108 Q100 115 94 108 Z', fill: F.dark },
  ],
  eyes: [
    { t: 'ellipse', cx: 83, cy: 78, rx: 7, ry: 8, fill: F.amber },
    { t: 'ellipse', cx: 83, cy: 78, rx: 2.3, ry: 6, fill: F.pupil },
    { t: 'circle', cx: 80.8, cy: 75, r: 1.9, fill: '#FFFFFF' },
    { t: 'ellipse', cx: 117, cy: 78, rx: 7, ry: 8, fill: F.amber },
    { t: 'ellipse', cx: 117, cy: 78, rx: 2.3, ry: 6, fill: F.pupil },
    { t: 'circle', cx: 114.8, cy: 75, r: 1.9, fill: '#FFFFFF' },
  ],
  lidTop: 69,
  lids: [
    { t: 'ellipse', cx: 83, cy: 78, rx: 9, ry: 10, fill: F.orange },
    { t: 'ellipse', cx: 117, cy: 78, rx: 9, ry: 10, fill: F.orange },
  ],
  mouthIdle: [
    { t: 'path', d: 'M100 113 Q97 117 93 116 M100 113 Q103 117 107 116', stroke: F.dark, strokeWidth: 1.8 },
  ],
  mouthHappy: [{ t: 'path', d: 'M93 114 Q100 124 107 114 Z', fill: '#5A2018' }],
};

export type CompanionKind = 'dylan' | 'miso' | 'roux';

export const COMPANION_ART: Record<CompanionKind, CompanionArt> = { dylan, miso, roux };
