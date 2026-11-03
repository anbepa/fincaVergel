import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import {
  ROUTES, SITE_NAME, DEFAULT_SITE_URL, GOOGLE_SITE_VERIFICATION, fullTitle, structuredData,
} from './src/seo-routes.js'

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* Head tags for one route (replaces the <!--seo:start-->…<!--seo:end--> block) */
function headFor(route, siteUrl, verification) {
  const url = `${siteUrl}${route.path === '/' ? '/' : route.path}`
  const title = fullTitle(route)
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${siteUrl}/og-image.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Finca El Vergel — Specialty Coffee, Sierra Nevada de Santa Marta, Colombia" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:image" content="${siteUrl}/og-image.jpg" />`,
    verification ? `<meta name="google-site-verification" content="${esc(verification)}" />` : '',
    `<script type="application/ld+json">${JSON.stringify(structuredData(siteUrl))}</script>`,
  ].filter(Boolean).join('\n    ')
}

/* Crawlable content inside #root (React replaces it on load) */
function bodyFor(route) {
  const links = ROUTES.filter(r => r.path !== route.path)
    .map(r => `<li><a href="${r.path}">${esc(r.title === ROUTES[0].title ? 'Home' : r.title)}</a></li>`).join('')
  return `<main class="seo-fallback"><h1>${esc(route.h1)}</h1><p>${esc(route.description)}</p><nav aria-label="Pages"><ul>${links}</ul></nav></main>`
}

/**
 * - Injects per-route <head> tags in dev and build.
 * - After build, writes one HTML file per public route (served by Vercel
 *   with cleanUrls), plus sitemap.xml and robots.txt.
 */
function seoPlugin(siteUrl, verification) {
  let outDir = 'dist'
  const render = (html, route) => html
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n    ${headFor(route, siteUrl, verification)}\n    <!--seo:end-->`)
    .replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<noscript>|<script)/, `<div id="root">${bodyFor(route)}</div>\n    `)
  return {
    name: 'fincavergel-seo',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir) },
    transformIndexHtml(html) { return render(html, ROUTES[0]) },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexPath)) return
      const base = fs.readFileSync(indexPath, 'utf8')
      for (const route of ROUTES) {
        if (route.path === '/') continue
        fs.writeFileSync(path.join(outDir, `${route.path.slice(1)}.html`), render(base, route))
      }
      const today = new Date().toISOString().slice(0, 10)
      const urls = ROUTES.map(r => `  <url>\n    <loc>${siteUrl}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${r.priority.toFixed(1)}</priority>\n  </url>`).join('\n')
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
      fs.writeFileSync(path.join(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
  return {
    plugins: [react(), seoPlugin(siteUrl, env.VITE_GOOGLE_SITE_VERIFICATION || GOOGLE_SITE_VERIFICATION)],
  }
})
