import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const indexPath = resolve(root, 'dist', 'index.html');
const fallbackPath = resolve(root, 'dist', '404.html');
const sourceFallbackPath = resolve(root, 'public', '404.html');

const restore = `<script>(function(l){if(l.search.slice(0,2)!=='?/')return;var p=l.search.slice(1).split('&').map(function(v){return v.replace(/~and~/g,'&')});history.replaceState(null,'',l.pathname.slice(0,-1)+p.shift()+(p.length?'?'+p.join('&'):'')+l.hash)})(window.location);</script>`;
const appleTouchIcon = `<link rel="apple-touch-icon" sizes="180x180" href="/Wardrobe/wardrobe-apple-touch-icon-v2.png?v=aeb3d65">`;

const html = await readFile(indexPath, 'utf8');
let prepared = html;
prepared = prepared.replace('/Wardrobe/favicon.ico"', '/Wardrobe/favicon.ico?v=aeb3d65"');
if (!prepared.includes("l.search.slice(0,2)!=='?/'")) {
  prepared = prepared.replace('</head>', `  ${restore}\n</head>`);
}
if (!prepared.includes('rel="apple-touch-icon"')) {
  prepared = prepared.replace('</head>', `  ${appleTouchIcon}\n</head>`);
}
if (prepared !== html) await writeFile(indexPath, prepared);

// Expo copies public assets in current releases, but keep the fallback
// explicit so a CLI upgrade cannot silently reintroduce direct-route 404s.
await copyFile(sourceFallbackPath, fallbackPath);
await copyFile(
  resolve(root, 'assets', 'branding', 'wardrobe-apple-touch-icon-v2.png'),
  resolve(root, 'dist', 'wardrobe-apple-touch-icon-v2.png')
);
