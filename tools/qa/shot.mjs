// Prove mobile headless del redesign TuffRat con Edge di sistema (playwright-core, nessun browser scaricato).
// Uso (dalla radice del repo, con `npm run dev` acceso):
//   node tools/qa/shot.mjs --url serie --device phone --out ./qa-out --steps "wait:1500;shot:serie;tap:195,400;wait:900;shot:dopo"
// Dispositivi: phone (390x844 touch), landscape (844x390 touch), desktop (1440x900 mouse).
// Passi (separati da ;):
//   wait:ms                      attende
//   shot:nome                    screenshot in <out>/<nome>.png
//   tap:x,y                      tocco (touch) o click (desktop)
//   drag:x1,y1,x2,y2[,ms[,hold]] trascinamento con un dito (ms = durata, hold = ms di pressione ferma prima di muovere)
//   pinch:cx,cy,d1,d2[,ms]       due dita attorno a (cx,cy): distanza da d1 a d2 px
//   key:Escape                   tasto
//   eval:espressione             valuta JS nella pagina e stampa il risultato (JSON)
//   goto:/percorso               naviga (ricarica)
//   click:selettore              click su un elemento DOM (CSS)
// Stampa su stdout errori di console e di pagina. Base URL: --base (default http://127.0.0.1:5173).
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true'])
    return acc
  }, []),
)
const base = args.base ?? 'http://127.0.0.1:5173'
const out = resolve(args.out ?? './out')
mkdirSync(out, { recursive: true })
const device = args.device ?? 'phone'
const UA_PHONE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const profili = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA_PHONE },
  landscape: { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA_PHONE },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
}
const touch = device !== 'desktop'

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=document-user-activation-required'],
})
const context = await browser.newContext(profili[device])
// L'intro con la tag non parte (una volta per sessione): `--intro true` la lascia partire.
if (args.intro !== 'true') await context.addInitScript(() => sessionStorage.setItem('tuffrat.intro.v1', '1'))
const page = await context.newPage()
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') console.log(`[console.${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => console.log(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ''}`))
const cdp = await context.newCDPSession(page)

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const tocco = (type, punti) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: punti.map(([x, y], id) => ({ x, y, id, radiusX: 4, radiusY: 4, force: 1 })) })

async function drag(x1, y1, x2, y2, ms = 400, hold = 0) {
  if (!touch) {
    await page.mouse.move(x1, y1)
    await page.mouse.down()
    if (hold) await pausa(hold)
    await page.mouse.move(x2, y2, { steps: 16 })
    await pausa(ms / 4)
    await page.mouse.up()
    return
  }
  await tocco('touchStart', [[x1, y1]])
  if (hold) await pausa(hold)
  const n = 16
  for (let i = 1; i <= n; i++) {
    await tocco('touchMove', [[x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]])
    await pausa(ms / n)
  }
  await tocco('touchEnd', [])
}

async function pinch(cx, cy, d1, d2, ms = 500) {
  const pt = (d) => [
    [cx - d / 2, cy],
    [cx + d / 2, cy],
  ]
  await tocco('touchStart', pt(d1))
  const n = 16
  for (let i = 1; i <= n; i++) {
    await tocco('touchMove', pt(d1 + ((d2 - d1) * i) / n))
    await pausa(ms / n)
  }
  await tocco('touchEnd', [])
}

// Git Bash trasforma un argomento che inizia per «/» in un percorso Windows: lo si rimette a posto.
const percorso = (p) => {
  const pulito = String(p ?? '/').replace(/^[A-Za-z]:[\\/]Program Files[\\/]Git/i, '').replace(/\\/g, '/')
  return pulito.startsWith('/') ? pulito : `/${pulito}`
}
await page.goto(base + percorso(args.url), { waitUntil: 'load' })
const passi = (args.steps ?? 'wait:2000;shot:pagina').split(';').map((s) => s.trim()).filter(Boolean)
for (const passo of passi) {
  const i = passo.indexOf(':')
  const nome = i < 0 ? passo : passo.slice(0, i)
  const arg = i < 0 ? '' : passo.slice(i + 1)
  const n = arg.split(',').map(Number)
  if (nome === 'wait') await pausa(Number(arg))
  else if (nome === 'shot') {
    const file = resolve(out, `${arg}.png`)
    await page.screenshot({ path: file })
    console.log(`shot ${file}`)
  } else if (nome === 'tap') {
    if (touch) await page.touchscreen.tap(n[0], n[1])
    else await page.mouse.click(n[0], n[1])
  } else if (nome === 'drag') await drag(n[0], n[1], n[2], n[3], n[4], n[5])
  else if (nome === 'pinch') await pinch(n[0], n[1], n[2], n[3], n[4])
  else if (nome === 'key') await page.keyboard.press(arg)
  else if (nome === 'eval') console.log(`eval ${JSON.stringify(await page.evaluate(arg))}`)
  else if (nome === 'goto') await page.goto(base + percorso(arg), { waitUntil: 'load' })
  else if (nome === 'click') {
    if (touch) await page.locator(arg).first().tap()
    else await page.locator(arg).first().click()
  } else console.log(`passo sconosciuto: ${passo}`)
}
await browser.close()
