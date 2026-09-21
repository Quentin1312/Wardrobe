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
  tanLight: '#DB9C58',
  muzzle: '#48423E',
  earInner: '#58524E',
  blue: '#9CCEF0',
  brown: '#3A2216',
  pupil: '#110E0D',
};

const dylan: CompanionArt = {
  tailPivot: [128, 150],
  tail: [
    // soft plume curling up behind the back
    { t: 'path', d: 'M124 156 C 158 158, 178 128, 170 100 C 166 86, 152 84, 148 96 C 158 108, 154 134, 122 140 Z', fill: D.charcoal },
    { t: 'path', d: 'M150 98 C 160 110, 160 128, 144 140 C 156 126, 156 112, 150 98 Z', fill: D.merleLight, opacity: 0.75 },
    { t: 'path', d: 'M170 100 C 166 88, 156 86, 150 94 C 160 94, 166 100, 170 108 Z', fill: D.merle },
  ],
  body: [
    SHADOW,
    // upright, slim torso
    { t: 'path', d: 'M60 128 Q52 164 68 189 L132 189 Q148 164 140 128 Q100 112 60 128 Z', fill: D.charcoal },
    // merle mottling on the flanks
    { t: 'ellipse', cx: 74, cy: 160, rx: 8, ry: 12, fill: D.merle, opacity: 0.9 },
    { t: 'ellipse', cx: 127, cy: 156, rx: 7, ry: 11, fill: D.merle, opacity: 0.8 },
    { t: 'ellipse', cx: 124, cy: 178, rx: 6, ry: 5, fill: D.merleLight, opacity: 0.7 },
    // big soft neck ruff — one shape, gently lobed, the Pomeranian mane
    { t: 'path', d: 'M46 96 C 38 118 50 140 66 150 C 74 158 88 160 100 160 C 112 160 126 158 134 150 C 150 140 162 118 154 96 C 142 116 58 116 46 96 Z', fill: D.charcoal },
    { t: 'path', d: 'M56 118 C 54 132 62 144 72 150 C 66 140 62 130 64 120 Z', fill: D.merle, opacity: 0.8 },
    { t: 'path', d: 'M144 118 C 146 132 138 144 128 150 C 134 140 138 130 136 120 Z', fill: D.merle, opacity: 0.8 },
    // wide tan bib under the chin
    { t: 'path', d: 'M66 114 Q100 146 134 114 Q132 142 100 156 Q68 142 66 114 Z', fill: D.tan },
    // short tan front legs
    { t: 'path', d: 'M80 160 L79 184 Q85 190 91 184 L92 160 Z', fill: D.tan },
    { t: 'path', d: 'M108 160 L109 184 Q115 190 121 184 L120 160 Z', fill: D.tan },
    // chest fluff falling over the top of the legs
    { t: 'ellipse', cx: 85, cy: 188, rx: 9, ry: 4, fill: D.tanLight },
    { t: 'ellipse', cx: 115, cy: 188, rx: 9, ry: 4, fill: D.tanLight },
  ],
  neck: [100, 124],
  head: [
    // small rounded ears, fluffy dark with a greyish inside
    { t: 'path', d: 'M60 64 Q56 40 69 30 Q84 36 88 54 Z', fill: D.black },
    { t: 'path', d: 'M65 58 Q63 43 70 37 Q79 42 82 53 Z', fill: D.earInner },
    { t: 'path', d: 'M140 64 Q144 40 131 30 Q116 36 112 54 Z', fill: D.black },
    { t: 'path', d: 'M135 58 Q137 43 130 37 Q121 42 118 53 Z', fill: D.earInner },
    // head with a few cheek tufts (no scalloped outline)
    {
      t: 'path',
      d: 'M100 40 C 112 38 120 43 127 46 C 141 52 147 65 148 80 C 156 88 157 101 148 108 C 152 116 143 123 132 120 C 124 129 111 134 100 134 C 89 134 76 129 68 120 C 57 123 48 116 52 108 C 43 101 44 88 52 80 C 53 65 59 52 73 46 C 80 43 88 38 100 40 Z',
      fill: D.black,
    },
    // grey merle on the forehead
    { t: 'path', d: 'M104 45 Q122 44 132 56 Q118 58 107 53 Z', fill: D.merle, opacity: 0.75 },
    { t: 'path', d: 'M74 50 Q84 45 92 47 Q84 52 76 56 Z', fill: D.merle, opacity: 0.5 },
    // fur wisps breaking up the outline
    { t: 'path', d: 'M91 43 Q94 34 99 41 M102 41 Q107 33 110 43', stroke: D.black, strokeWidth: 3.2 },
    // tan eyebrow spots
    { t: 'ellipse', cx: 82, cy: 65, rx: 6.5, ry: 4, fill: D.tanLight },
    { t: 'ellipse', cx: 118, cy: 65, rx: 6.5, ry: 4, fill: D.tanLight },
    // tan cheeks sweeping down to the chin
    { t: 'path', d: 'M60 92 Q68 118 92 120 Q84 106 86 95 Q73 99 60 92 Z', fill: D.tan },
    { t: 'path', d: 'M140 92 Q132 118 108 120 Q116 106 114 95 Q127 99 140 92 Z', fill: D.tan },
    { t: 'path', d: 'M62 97 Q100 103 138 97 Q134 138 100 146 Q66 138 62 97 Z', fill: D.tan },
    // dark grey muzzle with tan lips
    { t: 'ellipse', cx: 100, cy: 101, rx: 13.5, ry: 10.5, fill: D.muzzle },
    { t: 'path', d: 'M88 104 Q92 116 100 116 Q108 116 112 104 Q107 110 100 110 Q93 110 88 104 Z', fill: D.tanLight },
    // nose
    { t: 'path', d: 'M91 95 Q100 90 109 95 Q107 102 100 103 Q93 102 91 95 Z', fill: D.black },
    { t: 'ellipse', cx: 96.5, cy: 94.5, rx: 3, ry: 1.5, fill: '#FFFFFF', opacity: 0.4 },
  ],
  // one ice-blue eye, one dark brown — like the real Dylan
  eyes: [
    { t: 'ellipse', cx: 83, cy: 79, rx: 8.5, ry: 8, fill: D.blue },
    { t: 'circle', cx: 83.5, cy: 79.5, r: 4.3, fill: D.pupil },
    { t: 'circle', cx: 80.5, cy: 76.5, r: 2.2, fill: '#FFFFFF' },
    { t: 'ellipse', cx: 117, cy: 79, rx: 8.5, ry: 8, fill: D.brown },
    { t: 'circle', cx: 116.5, cy: 79.5, r: 4.3, fill: D.pupil },
    { t: 'circle', cx: 114, cy: 76.5, r: 2.2, fill: '#FFFFFF' },
  ],
  lidTop: 70,
  lids: [
    { t: 'ellipse', cx: 83, cy: 79, rx: 10.5, ry: 10, fill: D.black },
    { t: 'ellipse', cx: 117, cy: 79, rx: 10.5, ry: 10, fill: D.black },
  ],
  mouthIdle: [
    { t: 'path', d: 'M100 104 Q100 110 94 111 M100 104 Q100 110 106 111', stroke: D.black, strokeWidth: 2 },
  ],
  // open, tongue out — the photo pose
  mouthHappy: [
    { t: 'path', d: 'M91 107 Q100 124 109 107 Q100 111 91 107 Z', fill: '#2E1210' },
    { t: 'ellipse', cx: 100, cy: 116, rx: 5.5, ry: 4.5, fill: '#E98686' },
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
