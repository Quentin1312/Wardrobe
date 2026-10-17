import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const indexPath = resolve(root, 'dist', 'index.html');
const fallbackPath = resolve(root, 'dist', '404.html');
const sourceFallbackPath = resolve(root, 'public', '404.html');

const restore = `<script>(function(l){if(l.search.slice(0,2)!=='?/')return;var p=l.search.slice(1).split('&').map(function(v){return v.replace(/~and~/g,'&')});history.replaceState(null,'',l.pathname.slice(0,-1)+p.shift()+(p.length?'?'+p.join('&'):'')+l.hash)})(window.location);</script>`;
const appleTouchIcon = `<link rel="apple-touch-icon" sizes="180x180" href="/Wardrobe/wardrobe-apple-touch-icon-v2.png?v=aeb3d65">`;

/**
 * Added to the home screen, iOS only drops Safari's chrome when the page it
 * launches says so. Expo's single-page export writes its own <head> and drops
 * what app/+html.tsx declares, so the tags are injected here instead — on the
 * index AND on the 404 fallback, which is what a deep link actually opens.
 */
const pwaTags = [
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="Wardrobe">',
  '<link rel="manifest" href="/Wardrobe/manifest.webmanifest">',
].join('\n  ');

const manifest = {
  name: 'Wardrobe',
  short_name: 'Wardrobe',
  lang: 'fr',
  start_url: '/Wardrobe/',
  scope: '/Wardrobe/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0B0B0C',
  theme_color: '#0B0B0C',
  icons: [
    { src: '/Wardrobe/wardrobe-apple-touch-icon-v2.png', sizes: '180x180', type: 'image/png' },
    { src: '/Wardrobe/wardrobe-icon-v2.png', sizes: '1024x1024', type: 'image/png' },
    { src: '/Wardrobe/wardrobe-icon-v2.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
  ],
};

/** Adds the PWA head tags (and a full-bleed viewport) to a built page. */
function withPwaTags(html) {
  let out = html;
  // viewport-fit=cover lets the app paint under the notch once standalone.
  out = out.replace(
    /<meta name="viewport" content="([^"]*)"/,
    (match, content) => (content.includes('viewport-fit') ? match : `<meta name="viewport" content="${content}, viewport-fit=cover"`)
  );
  if (!out.includes('apple-mobile-web-app-capable')) {
    out = out.replace('</head>', `  ${pwaTags}\n</head>`);
  }
  return out;
}

const html = await readFile(indexPath, 'utf8');
let prepared = html;
prepared = prepared.replace('/Wardrobe/favicon.ico"', '/Wardrobe/favicon.ico?v=aeb3d65"');
if (!prepared.includes("l.search.slice(0,2)!=='?/'")) {
  prepared = prepared.replace('</head>', `  ${restore}\n</head>`);
}
if (!prepared.includes('rel="apple-touch-icon"')) {
  prepared = prepared.replace('</head>', `  ${appleTouchIcon}\n</head>`);
}
prepared = withPwaTags(prepared);
if (prepared !== html) await writeFile(indexPath, prepared);

// Expo copies public assets in current releases, but keep the fallback
// explicit so a CLI upgrade cannot silently reintroduce direct-route 404s.
await copyFile(sourceFallbackPath, fallbackPath);
// A shortcut saved on a sub-route launches through this page: it needs the
// same tags, or iOS opens it in Safari with the address bar.
await writeFile(fallbackPath, withPwaTags(await readFile(fallbackPath, 'utf8')));

await writeFile(resolve(root, 'dist', 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

for (const icon of ['wardrobe-apple-touch-icon-v2.png', 'wardrobe-icon-v2.png']) {
  await copyFile(resolve(root, 'assets', 'branding', icon), resolve(root, 'dist', icon));
}
