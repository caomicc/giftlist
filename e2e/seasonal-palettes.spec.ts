import { test, expect, type Page } from '@playwright/test'
import { SEASONS } from '../lib/seasons.ts'

const ACCENTS = ['--primary', '--ring', '--secondary', '--group-gift', '--backdrop-from', '--backdrop-to']

/** Loads the sign-in page under `theme` and returns a reader for tokens under a given data-season. */
async function paletteReader(page: Page, theme: string) {
  await page.addInitScript(t => localStorage.setItem('theme', t), theme)
  await page.goto('/en/auth/signin')
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  return (season: string | null, names: string[] = ACCENTS) =>
    page.evaluate(([s, ns]) => {
      const root = document.documentElement
      if (s === null) delete root.dataset.season
      else root.dataset.season = s
      const cs = getComputedStyle(root)
      return Object.fromEntries(ns.map(n => [n, cs.getPropertyValue(n).trim()]))
    }, [season, names] as const)
}

/** WCAG contrast ratio between two CSS colours, resolved to sRGB by a canvas. */
const contrast = (page: Page, a: string, b: string) =>
  page.evaluate(([fg, bg]) => {
    const ctx = document.createElement('canvas').getContext('2d')!
    const lum = (c: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(v => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const [l1, l2] = [lum(fg), lum(bg)].sort((x, y) => y - x)
    return (l1 + 0.05) / (l2 + 0.05)
  }, [a, b] as const)

for (const [theme, base] of [['seasonal-light', 'light'], ['seasonal-dark', 'dark']] as const) {
  test(`${theme}: each season has its own accents`, async ({ page }) => {
    const read = await paletteReader(page, theme)
    const plain = await read(null)
    const primaries = new Set<string>()
    for (const { name } of SEASONS) {
      const p = await read(name)
      expect(p['--primary'], `${name} --primary`).not.toBe(plain['--primary'])
      expect(p['--backdrop-to'], `${name} --backdrop-to`).not.toBe(plain['--backdrop-to'])
      primaries.add(p['--primary'])
    }
    expect(primaries.size).toBe(SEASONS.length)
  })

  test(`${theme}: without data-season falls back to the ${base} palette`, async ({ browser }) => {
    const seasonal = await paletteReader(await browser.newPage(), theme)
    const plain = await paletteReader(await browser.newPage(), base)
    expect(await seasonal(null)).toEqual(await plain(null))
  })

  test(`${theme}: text on primary meets WCAG AA in every season`, async ({ page }) => {
    const read = await paletteReader(page, theme)
    for (const { name } of SEASONS) {
      const p = await read(name, ['--primary', '--primary-foreground'])
      const ratio = await contrast(page, p['--primary-foreground'], p['--primary'])
      expect(ratio, `${theme}/${name}`).toBeGreaterThanOrEqual(4.5)
    }
  })
}

test('semantic state colours do not change with the season', async ({ browser }) => {
  const SEMANTIC = ['--success', '--suggestion', '--destructive']
  const seasonal = await paletteReader(await browser.newPage(), 'seasonal-light')
  const plain = await paletteReader(await browser.newPage(), 'light')
  const base = await plain(null, SEMANTIC)
  for (const { name } of SEASONS) expect(await seasonal(name, SEMANTIC)).toEqual(base)
})
