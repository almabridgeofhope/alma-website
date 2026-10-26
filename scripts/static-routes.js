#!/usr/bin/env node

// GitHub Pages kennt nur Dateien. Jede Unterseite der App lief deshalb über
// 404.html und kam bei Google mit Status 404 an, obwohl sie im Browser lud.
// Dieses Skript legt nach dem Build je öffentlicher Route eine Kopie von
// index.html als <route>.html ab (GitHub Pages liefert /projects aus
// projects.html mit 200, ohne Weiterleitung auf /projects/), setzt darin den
// Canonical auf die Route und schreibt die sitemap.xml.

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(rootDir, 'dist');
const SITE = 'https://almabridgeofhope.org';

// Öffentliche Routen aus src/App.tsx; Erfolgsseiten, /admin und /dev bleiben draußen.
const PAGE_ROUTES = [
  '/about',
  '/projects',
  '/news',
  '/contact',
  '/membership',
  '/donation',
  '/spenden-statt-geschenke',
  '/impressum',
  '/privacy',
];

// Die Artikeldaten importieren Bilder und lassen sich in Node nicht laden,
// daher werden die Datumsangaben (= /news/:date) aus dem Quelltext gelesen.
const readArticleRoutes = async () => {
  const source = await readFile(join(rootDir, 'src/data/newsArticles.ts'), 'utf8');
  const dates = [...source.matchAll(/^\s*date: "(\d{4}-\d{2}-\d{2})"/gm)].map((m) => m[1]);
  return [...new Set(dates)].sort().map((date) => `/news/${date}`);
};

const withRouteUrls = (html, route) => {
  const url = `${SITE}${route}`;
  return html
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<link rel="alternate" hreflang="(?:en|x-default)" href=")[^"]*(")/g, `$1${url}$2`)
    .replace(/(<link rel="alternate" hreflang="de" href=")[^"]*(")/, `$1${url}?lang=de$2`);
};

const sitemap = (routes) => {
  const entries = routes.map((route) => `  <url><loc>${SITE}${route}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
};

const main = async () => {
  const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8');
  const routes = [...PAGE_ROUTES, ...(await readArticleRoutes())];

  for (const route of routes) {
    const target = join(distDir, `${route.slice(1)}.html`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, withRouteUrls(indexHtml, route));
  }

  await writeFile(join(distDir, 'sitemap.xml'), sitemap(['/', ...routes]));
  console.log(`static-routes: ${routes.length} Routen + sitemap.xml geschrieben`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
