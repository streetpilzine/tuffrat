import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { SITE_URL, staticRoutes } from '../src/routes.meta.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * Dopo `vite build` scrive una index.html per ogni route statica con title, description,
 * Open Graph e canonical propri, più sitemap.xml. La SPA resta una sola: cambia solo l'head.
 */
export function prerenderMeta(): Plugin {
  let outDir = 'dist'
  return {
    name: 'tuffrat:prerender-meta',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir
    },
    closeBundle() {
      const template = readFileSync(join(outDir, 'index.html'), 'utf8')
      const routes = staticRoutes()
      for (const r of routes) {
        const url = SITE_URL + (r.path === '/' ? '/' : r.path)
        const head = [
          `<meta name="description" content="${esc(r.description)}" />`,
          `<link rel="canonical" href="${url}" />`,
          `<meta property="og:type" content="website" />`,
          `<meta property="og:site_name" content="TuffRat" />`,
          `<meta property="og:title" content="${esc(r.title)}" />`,
          `<meta property="og:description" content="${esc(r.description)}" />`,
          `<meta property="og:url" content="${url}" />`,
          `<meta property="og:image" content="${SITE_URL}${r.image}" />`,
          `<meta name="twitter:card" content="summary_large_image" />`,
        ].join('\n    ')
        const html = template
          .replace(/<title>[^<]*<\/title>/, `<title>${esc(r.title)}</title>`)
          .replace('<!--meta-->', head)
        const dir = r.path === '/' ? outDir : join(outDir, r.path)
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, 'index.html'), html)
      }
      const sitemap =
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        routes.map((r) => `  <url><loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc></url>`).join('\n') +
        `\n</urlset>\n`
      writeFileSync(join(outDir, 'sitemap.xml'), sitemap)
      writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`)
      this.info(`prerender: ${routes.length} route, sitemap.xml, robots.txt`)
    },
  }
}
