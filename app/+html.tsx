import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web document shell. Without this, mobile Safari paints the status-bar area
 * and the overscroll zone white instead of the app background.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        {/* Tints the iOS status-bar area to match the app background. */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F2F2EE" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0B0B0C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Restores routes redirected by public/404.html on GitHub Pages. */}
        <script dangerouslySetInnerHTML={{ __html: spaRouteRestore }} />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: documentStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const documentStyle = `
html, body, #root {
  background-color: #0B0B0C;
  overscroll-behavior: none;
}
@media (prefers-color-scheme: light) {
  html, body, #root { background-color: #F2F2EE; }
}
`;

const spaRouteRestore = `
(function (location) {
  if (location.search.slice(0, 2) !== '?/') return;
  var parts = location.search.slice(1).split('&').map(function (part) {
    return part.replace(/~and~/g, '&');
  });
  history.replaceState(
    null,
    '',
    location.pathname.slice(0, -1) + parts.shift() +
      (parts.length ? '?' + parts.join('&') : '') + location.hash
  );
})(window.location);
`;
