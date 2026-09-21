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
// Miso — a ginger tabby cat, sitting.
// ---------------------------------------------------------------------------
const C = {
  orange: '#E0914A',
  stripe: '#B5632A',
  cream: '#F6E3C7',
  pink: '#EFA39B',
  green: '#8FCB78',
  pupil: '#141110',
  whisker: '#FFF7EC',
  earInner: '#F2B7A8',
};

const miso: CompanionArt = {
  tailPivot: [128, 182],
  tail: [
    // long tail curling round on the floor, tabby banded
    { t: 'path', d: 'M126 190 C 164 192, 184 172, 176 144 C 172 128, 158 128, 160 142 C 166 164, 152 178, 124 178 Z', fill: C.orange },
    { t: 'path', d: 'M176 144 C 172 128, 158 128, 160 142 C 164 136, 170 136, 176 146 Z', fill: C.cream },
  ],
  body: [
    SHADOW,
    // haunches and hind paws
    { t: 'ellipse', cx: 71, cy: 171, rx: 23, ry: 19, fill: C.orange },
    { t: 'ellipse', cx: 129, cy: 171, rx: 23, ry: 19, fill: C.orange },
    { t: 'path', d: 'M58 162 Q66 158 74 162 M60 172 Q68 168 76 172', stroke: C.stripe, strokeWidth: 3.5 },
    { t: 'path', d: 'M142 162 Q134 158 126 162 M140 172 Q132 168 124 172', stroke: C.stripe, strokeWidth: 3.5 },
    { t: 'ellipse', cx: 58, cy: 188, rx: 12, ry: 6, fill: C.cream },
    { t: 'ellipse', cx: 142, cy: 188, rx: 12, ry: 6, fill: C.cream },
    // torso
    { t: 'path', d: 'M74 116 Q66 150 76 187 L124 187 Q134 150 126 116 Q100 102 74 116 Z', fill: C.orange },
    // front legs from the shoulders, cream socks
    { t: 'path', d: 'M76 130 Q72 164 78 184 Q88 193 98 185 Q100 160 99 136 Z', fill: C.orange },
    { t: 'path', d: 'M101 136 Q100 160 102 185 Q112 193 122 184 Q128 164 124 130 Z', fill: C.orange },
    { t: 'path', d: 'M78 158 Q76 172 78 184 Q88 193 98 185 Q99 170 98 158 Q88 162 78 158 Z', fill: C.cream },
    { t: 'path', d: 'M102 158 Q101 170 102 185 Q112 193 122 184 Q124 172 122 158 Q112 162 102 158 Z', fill: C.cream },
    { t: 'path', d: 'M100 142 L100 186', stroke: C.stripe, strokeWidth: 1.4, opacity: 0.6 },
    // white bib
    { t: 'path', d: 'M86 118 Q100 128 114 118 Q116 146 100 156 Q84 146 86 118 Z', fill: C.cream },
    // paws with toe lobes
    { t: 'path', d: 'M75 189 Q75 182 81 182 Q84.5 179 88 182 Q91.5 179 95 182 Q100 182 100 189 Q100 194 87.5 194 Q75 194 75 189 Z', fill: C.cream },
    { t: 'path', d: 'M100 189 Q100 182 105 182 Q108.5 179 112 182 Q115.5 179 119 182 Q125 182 125 189 Q125 194 112.5 194 Q100 194 100 189 Z', fill: C.cream },
  ],
  neck: [100, 116],
  head: [
    // ears with pink insides
    { t: 'path', d: 'M58 74 Q56 44 66 26 Q84 36 92 52 Z', fill: C.orange },
    { t: 'path', d: 'M64 66 Q63 46 69 34 Q80 42 86 53 Z', fill: C.earInner },
    { t: 'path', d: 'M142 74 Q144 44 134 26 Q116 36 108 52 Z', fill: C.orange },
    { t: 'path', d: 'M136 66 Q137 46 131 34 Q120 42 114 53 Z', fill: C.earInner },
    // head
    { t: 'path', d: 'M100 44 C 128 44 146 60 146 82 C 146 104 126 122 100 122 C 74 122 54 104 54 82 C 54 60 72 44 100 44 Z', fill: C.orange },
    // tabby "M" on the forehead and cheek stripes
    { t: 'path', d: 'M86 50 L90 62 M100 47 L100 62 M114 50 L110 62', stroke: C.stripe, strokeWidth: 3.5 },
    { t: 'path', d: 'M55 88 L67 90 M57 98 L68 97 M145 88 L133 90 M143 98 L132 97', stroke: C.stripe, strokeWidth: 3 },
    // cream muzzle and chin
    { t: 'path', d: 'M80 98 Q84 88 100 90 Q116 88 120 98 Q120 114 100 118 Q80 114 80 98 Z', fill: C.cream },
    // nose
    { t: 'path', d: 'M94 93 L106 93 L100 100 Z', fill: C.pink },
    // whiskers
    { t: 'path', d: 'M82 101 L58 97 M82 106 L58 108 M118 101 L142 97 M118 106 L142 108', stroke: C.whisker, strokeWidth: 1.4, opacity: 0.9 },
  ],
  eyes: [
    { t: 'ellipse', cx: 82, cy: 78, rx: 8.5, ry: 9, fill: C.green },
    { t: 'ellipse', cx: 82, cy: 78, rx: 2.4, ry: 7, fill: C.pupil },
    { t: 'circle', cx: 79.5, cy: 74.5, r: 2.2, fill: '#FFFFFF' },
    { t: 'ellipse', cx: 118, cy: 78, rx: 8.5, ry: 9, fill: C.green },
    { t: 'ellipse', cx: 118, cy: 78, rx: 2.4, ry: 7, fill: C.pupil },
    { t: 'circle', cx: 115.5, cy: 74.5, r: 2.2, fill: '#FFFFFF' },
  ],
  lidTop: 68,
  lids: [
    { t: 'ellipse', cx: 82, cy: 78, rx: 10.5, ry: 11, fill: C.orange },
    { t: 'ellipse', cx: 118, cy: 78, rx: 10.5, ry: 11, fill: C.orange },
  ],
  mouthIdle: [
    { t: 'path', d: 'M100 100 Q100 106 94 107 M100 100 Q100 106 106 107', stroke: C.stripe, strokeWidth: 1.8 },
  ],
  mouthHappy: [
    { t: 'path', d: 'M93 104 Q100 116 107 104 Q100 107 93 104 Z', fill: '#6B2A22' },
    { t: 'ellipse', cx: 100, cy: 110, rx: 3.5, ry: 3, fill: '#E98686' },
  ],
};

// ---------------------------------------------------------------------------
// Noisette — a soft brown rabbit, sitting.
// ---------------------------------------------------------------------------
const R = {
  fur: '#C99E77',
  furDark: '#AE8260',
  furLight: '#DDBB96',
  cream: '#F5E8D6',
  pink: '#F0ADA9',
  nose: '#E58C92',
  eye: '#2A1811',
  line: '#8A6246',
  whisker: '#FFF8EE',
};

const noisette: CompanionArt = {
  // cotton-ball tail peeking out at the side, it wiggles
  tailPivot: [140, 176],
  tail: [
    { t: 'circle', cx: 154, cy: 166, r: 13, fill: R.cream },
    { t: 'circle', cx: 158, cy: 162, r: 6, fill: '#FFFFFF', opacity: 0.7 },
  ],
  body: [
    SHADOW,
    // round haunches and long hind feet
    { t: 'ellipse', cx: 72, cy: 167, rx: 25, ry: 22, fill: R.fur },
    { t: 'ellipse', cx: 128, cy: 167, rx: 25, ry: 22, fill: R.fur },
    { t: 'ellipse', cx: 56, cy: 188, rx: 22, ry: 7.5, fill: R.furLight },
    { t: 'ellipse', cx: 144, cy: 188, rx: 22, ry: 7.5, fill: R.furLight },
    // torso and soft belly
    { t: 'path', d: 'M76 118 Q68 152 78 187 L122 187 Q132 152 124 118 Q100 104 76 118 Z', fill: R.fur },
    { t: 'path', d: 'M84 124 Q100 134 116 124 Q121 160 100 178 Q79 160 84 124 Z', fill: R.cream },
    // front legs down from the chest to small rounded paws
    { t: 'path', d: 'M83 144 Q80 168 82 184 Q90 191 98 184 Q100 164 98 146 Z', fill: R.furLight },
    { t: 'path', d: 'M117 144 Q120 168 118 184 Q110 191 102 184 Q100 164 102 146 Z', fill: R.furLight },
    { t: 'path', d: 'M100 150 L100 186', stroke: R.furDark, strokeWidth: 1.4, opacity: 0.5 },
    { t: 'path', d: 'M80 185 Q80 178 86 178 Q90 176 94 178 Q99 179 99 185 Q99 191 89.5 191 Q80 191 80 185 Z', fill: R.cream },
    { t: 'path', d: 'M120 185 Q120 178 114 178 Q110 176 106 178 Q101 179 101 185 Q101 191 110.5 191 Q120 191 120 185 Z', fill: R.cream },
  ],
  neck: [100, 118],
  head: [
    // long ears with pink insides
    { t: 'path', d: 'M74 66 C 56 42 52 8 69 1 C 88 3 97 34 96 62 Z', fill: R.fur },
    { t: 'path', d: 'M78 59 C 64 40 62 14 70 9 C 83 12 89 35 89 58 Z', fill: R.pink },
    { t: 'path', d: 'M126 66 C 144 42 148 8 131 1 C 112 3 103 34 104 62 Z', fill: R.fur },
    { t: 'path', d: 'M122 59 C 136 40 138 14 130 9 C 117 12 111 35 111 58 Z', fill: R.pink },
    // head
    { t: 'path', d: 'M100 46 C 128 46 145 64 145 86 C 145 109 125 125 100 125 C 75 125 55 109 55 86 C 55 64 72 46 100 46 Z', fill: R.fur },
    { t: 'path', d: 'M92 50 Q100 46 108 50 Q104 58 100 60 Q96 58 92 50 Z', fill: R.furDark, opacity: 0.35 },
    // puffy cheeks
    { t: 'ellipse', cx: 86, cy: 104, rx: 15, ry: 11.5, fill: R.cream },
    { t: 'ellipse', cx: 114, cy: 104, rx: 15, ry: 11.5, fill: R.cream },
    // blush
    { t: 'ellipse', cx: 69, cy: 99, rx: 6.5, ry: 3.8, fill: R.pink, opacity: 0.55 },
    { t: 'ellipse', cx: 131, cy: 99, rx: 6.5, ry: 3.8, fill: R.pink, opacity: 0.55 },
    // nose
    { t: 'path', d: 'M95.5 96 Q100 92.5 104.5 96 Q102.5 100.5 100 101 Q97.5 100.5 95.5 96 Z', fill: R.nose },
    // whiskers
    { t: 'path', d: 'M84 104 L62 100 M84 108 L62 111 M116 104 L138 100 M116 108 L138 111', stroke: R.whisker, strokeWidth: 1.3, opacity: 0.95 },
  ],
  // big glossy eyes
  eyes: [
    { t: 'circle', cx: 82, cy: 82, r: 8.5, fill: R.eye },
    { t: 'circle', cx: 79, cy: 78.5, r: 2.8, fill: '#FFFFFF' },
    { t: 'circle', cx: 85, cy: 85.5, r: 1.3, fill: '#FFFFFF', opacity: 0.8 },
    { t: 'circle', cx: 118, cy: 82, r: 8.5, fill: R.eye },
    { t: 'circle', cx: 115, cy: 78.5, r: 2.8, fill: '#FFFFFF' },
    { t: 'circle', cx: 121, cy: 85.5, r: 1.3, fill: '#FFFFFF', opacity: 0.8 },
  ],
  lidTop: 72,
  lids: [
    { t: 'ellipse', cx: 82, cy: 82, rx: 10.5, ry: 10.5, fill: R.fur },
    { t: 'ellipse', cx: 118, cy: 82, rx: 10.5, ry: 10.5, fill: R.fur },
  ],
  mouthIdle: [
    { t: 'path', d: 'M100 101 L100 106 M100 106 Q96.5 109.5 93 107.5 M100 106 Q103.5 109.5 107 107.5', stroke: R.line, strokeWidth: 1.8 },
  ],
  // open smile with two little buck teeth
  mouthHappy: [
    { t: 'path', d: 'M100 101 L100 105', stroke: R.line, strokeWidth: 1.8 },
    { t: 'path', d: 'M92.5 105 Q100 118 107.5 105 Q100 107.5 92.5 105 Z', fill: '#6B2E2A' },
    { t: 'path', d: 'M96.8 106 L96.8 111.5 Q98.4 112.5 99.8 111.5 L99.8 106.6 Z', fill: '#FFFFFF' },
    { t: 'path', d: 'M100.2 106.6 L100.2 111.5 Q101.6 112.5 103.2 111.5 L103.2 106 Z', fill: '#FFFFFF' },
  ],
};

export type CompanionKind = 'dylan' | 'miso' | 'noisette';

export const COMPANION_ART: Record<CompanionKind, CompanionArt> = { dylan, miso, noisette };
