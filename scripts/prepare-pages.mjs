import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const indexPath = resolve(root, 'dist', 'index.html');
const fallbackPath = resolve(root, 'dist', '404.html');
const sourceFallbackPath = resolve(root, 'public', '404.html');

const restore = `<script>(function(l){if(l.search.slice(0,2)!=='?/')return;var p=l.search.slice(1).split('&').map(function(v){return v.replace(/~and~/g,'&')});history.replaceState(null,'',l.pathname.slice(0,-1)+p.shift()+(p.length?'?'+p.join('&'):'')+l.hash)})(window.location);</script>`;

const html = await readFile(indexPath, 'utf8');
if (!html.includes("l.search.slice(0,2)!=='?/'")) {
  await writeFile(indexPath, html.replace('</head>', `  ${restore}\n</head>`));
}

// Expo copies public assets in current releases, but keep the fallback
// explicit so a CLI upgrade cannot silently reintroduce direct-route 404s.
await copyFile(sourceFallbackPath, fallbackPath);
