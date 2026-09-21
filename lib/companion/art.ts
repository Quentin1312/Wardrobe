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

// ---------------------------------------------------------------------------
// Dylan — black & tan merle Pomeranian with one ice-blue eye.
// ---------------------------------------------------------------------------
const D = {
  black: '#1E1A18',
  charcoal: '#2C2724',
  merle: '#6E6964',
  merleLight: '#9A948E',
  tan: '#C4783A',
  tanLight: '#E0A566',
  earInner: '#5A5450',
  blue: '#9CCEF0',
  brown: '#3A2216',
  pupil: '#110E0D',
};

// A sitting puppy seen from the front: round head resting on a pear-shaped
// body, a proper snout, haunches and hind paws, plume tail.
const dylan: CompanionArt = {
  tailPivot: [140, 168],
  tail: [
    { t: 'path', d: 'M138 178 C 184 178, 196 132, 172 104 C 160 92, 142 100, 148 116 C 160 132, 158 154, 132 160 Z', fill: D.charcoal },
    { t: 'path', d: 'M154 116 C 168 128, 170 150, 154 164 C 162 148, 162 132, 154 116 Z', fill: D.merleLight, opacity: 0.7 },
    { t: 'path', d: 'M172 104 C 162 94, 148 98, 148 108 C 158 104, 168 108, 176 116 Z', fill: D.merle },
  ],
  body: [
    SHADOW,
    // haunches and hind paws
    { t: 'ellipse', cx: 70, cy: 170, rx: 25, ry: 20, fill: D.charcoal },
    { t: 'ellipse', cx: 130, cy: 170, rx: 25, ry: 20, fill: D.charcoal },
    { t: 'ellipse', cx: 57, cy: 188, rx: 13, ry: 6, fill: D.tan },
    { t: 'ellipse', cx: 143, cy: 188, rx: 13, ry: 6, fill: D.tan },
    // pear-shaped torso
    { t: 'path', d: 'M72 116 Q64 150 74 187 L126 187 Q136 150 128 116 Q100 102 72 116 Z', fill: D.charcoal },
    // front legs and paws
    // legs grow out of the shoulders in the body colour…
    { t: 'path', d: 'M75 130 Q71 164 77 184 Q87 193 98 185 Q100 160 99 136 Z', fill: D.charcoal },
    { t: 'path', d: 'M101 136 Q100 160 102 185 Q113 193 123 184 Q129 164 125 130 Z', fill: D.charcoal },
    // …and turn tan lower down, like socks
    { t: 'path', d: 'M76 160 Q75 176 77 184 Q87 193 98 185 Q99 171 98 160 Q87 165 76 160 Z', fill: D.tan },
    { t: 'path', d: 'M102 160 Q101 171 102 185 Q113 193 123 184 Q125 176 124 160 Q113 165 102 160 Z', fill: D.tan },
    { t: 'path', d: 'M100 142 L100 186', stroke: D.black, strokeWidth: 1.6, opacity: 0.6 },
    // small tan chest patch
    { t: 'path', d: 'M86 120 Q100 132 114 120 Q116 144 100 154 Q84 144 86 120 Z', fill: D.tan },

    { t: 'path', d: 'M74 189 Q74 181 80.5 181 Q84 178 87 181 Q90 178 93.5 181 Q100 181 100 189 Q100 195 87 195 Q74 195 74 189 Z', fill: D.tanLight },
    { t: 'path', d: 'M100 189 Q100 181 106.5 181 Q110 178 113 181 Q116 178 119.5 181 Q126 181 126 189 Q126 195 113 195 Q100 195 100 189 Z', fill: D.tanLight },
  ],
  neck: [100, 118],
  head: [
    // upright ears
    { t: 'path', d: 'M58 70 Q55 42 64 24 Q80 32 92 52 Z', fill: D.black },
    { t: 'path', d: 'M64 62 Q62 44 68 33 Q78 41 85 53 Z', fill: D.earInner },
    { t: 'path', d: 'M142 70 Q145 42 136 24 Q120 32 108 52 Z', fill: D.black },
    { t: 'path', d: 'M136 62 Q138 44 132 33 Q122 41 115 53 Z', fill: D.earInner },
    // round head with small cheek fluff
    { t: 'path', d: 'M100 40 C 130 40 148 60 148 84 C 148 107 126 126 100 126 C 74 126 52 107 52 84 C 52 60 70 40 100 40 Z', fill: D.black },
    { t: 'path', d: 'M104 44 Q124 46 134 60 Q120 60 108 54 Z', fill: D.merle, opacity: 0.7 },
    // tan brows and cheeks
    { t: 'ellipse', cx: 82, cy: 66, rx: 6.5, ry: 4, fill: D.tanLight },
    { t: 'ellipse', cx: 118, cy: 66, rx: 6.5, ry: 4, fill: D.tanLight },
    { t: 'path', d: 'M62 94 Q66 121 100 125 Q134 121 138 94 Q120 103 100 101 Q80 103 62 94 Z', fill: D.tan },
    // the snout
    { t: 'path', d: 'M80 98 Q100 86 120 98 Q124 116 100 121 Q76 116 80 98 Z', fill: D.tanLight },
    { t: 'path', d: 'M91 95 Q100 89 109 95 Q107 103 100 104 Q93 103 91 95 Z', fill: D.black },
    { t: 'ellipse', cx: 96.5, cy: 94, rx: 3, ry: 1.5, fill: '#FFFFFF', opacity: 0.45 },
  ],
  // one ice-blue eye, one dark brown — like the real Dylan
  eyes: [
    { t: 'circle', cx: 83, cy: 79, r: 8.5, fill: D.blue },
    { t: 'circle', cx: 83.5, cy: 79.5, r: 4.4, fill: D.pupil },
    { t: 'circle', cx: 80.5, cy: 76.5, r: 2.2, fill: '#FFFFFF' },
    { t: 'circle', cx: 117, cy: 79, r: 8.5, fill: D.brown },
    { t: 'circle', cx: 116.5, cy: 79.5, r: 4.4, fill: D.pupil },
    { t: 'circle', cx: 114, cy: 76.5, r: 2.2, fill: '#FFFFFF' },
  ],
  lidTop: 70,
  lids: [
    { t: 'ellipse', cx: 83, cy: 79, rx: 10.5, ry: 10, fill: D.black },
    { t: 'ellipse', cx: 117, cy: 79, rx: 10.5, ry: 10, fill: D.black },
  ],
  mouthIdle: [
    { t: 'path', d: 'M100 104 Q100 110 94 112 M100 104 Q100 110 106 112', stroke: D.black, strokeWidth: 2 },
  ],
  mouthHappy: [
    { t: 'path', d: 'M90 108 Q100 124 110 108 Q100 112 90 108 Z', fill: '#2E1210' },
    { t: 'ellipse', cx: 100, cy: 117, rx: 5, ry: 4.5, fill: '#E98686' },
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
