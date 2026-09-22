const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function load(relative, mocks = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, (name) => mocks[name] ?? {});
  return exports;
}

const color = load('lib/color.ts');
const meta = load('lib/garmentMeta.ts', { '@/lib/color': color });
const outfits = load('lib/outfits.ts');

function photo(parts) {
  const width = 40;
  const height = 40;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const rgb = x < 5 || x >= 35 || y < 5 || y >= 35
      ? [255, 255, 255] : parts(x, y);
    const i = (y * width + x) * 4;
    data.set([...rgb, 255], i);
  }
  return color.paletteFromPixels(data, width, height).map((hex) => color.colorName(hex, 'fr'));
}

const shoe = photo((x) => x < 19 ? [30, 30, 30] : x < 27 ? [112, 30, 48] : [34, 105, 62]);
assert(shoe.includes('bordeaux'), `Burgundy must survive the black sole: ${shoe}`);
assert(shoe.some((name) => name === 'vert' || name === 'vert foncé'), `Green must survive: ${shoe}`);

const jacket = photo((x) => x < 20 ? [65, 65, 68] : [230, 196, 35]);
assert(jacket.includes('anthracite'), `Charcoal missing: ${jacket}`);
assert(jacket.includes('jaune'), `Yellow missing: ${jacket}`);

const tags = meta.writeGarmentMeta(['casual', 'couleurs:noir'], ['bordeaux', 'noir'], 'Cuir lisse, semelle sombre');
assert.deepEqual(tags, ['casual', 'couleurs:bordeaux + noir', 'description:Cuir lisse, semelle sombre']);
assert.deepEqual(meta.readGarmentMeta({ style_tags: tags, dominant_color: '#111111' }), {
  colors: ['bordeaux', 'noir'], description: 'Cuir lisse, semelle sombre',
});

const clothes = ['top', 'bottom', 'shoes', 'jacket'].map((category) => ({ id: category, category, dirty: false }));
assert(outfits.validLook(['top', 'bottom', 'shoes'], clothes));
assert(outfits.validLook(['top', 'bottom', 'shoes', 'cap', 'glasses'], [
  ...clothes,
  { id: 'cap', category: 'accessory', dirty: false },
  { id: 'glasses', category: 'accessory', dirty: false },
]));
assert(!outfits.validLook(['top', 'bottom'], clothes));
assert(!outfits.validLook(['top', 'bottom', 'shoes', 'shoes'], clothes));
assert(!outfits.validLook(['top', 'bottom', 'shoes', 'jacket'], clothes.map((c) =>
  c.category === 'jacket' ? { ...c, dirty: true } : c)));

process.stdout.write('Stylist palette, metadata and look validation: OK\n');
