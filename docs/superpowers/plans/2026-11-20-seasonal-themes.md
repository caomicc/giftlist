# Seasonal Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Users pick light, dark, seasonal light or seasonal dark. The seasonal themes recolour accents by calendar season.

**Architecture:** `next-themes` writes the chosen theme to `data-theme` on `<html>`. An inline head script writes
`data-season` from the visitor's local month before first paint. CSS selects tokens from those two attributes;
components don't change.

**Tech Stack:** Next.js 16 App Router, `next-themes` 0.4, Tailwind v4 CSS variables, Node 24 built-in test runner
(it runs `.ts` natively).

**Spec:** `docs/superpowers/specs/2026-11-20-seasonal-themes-design.md`

## Global Constraints

- Theme names, exactly: `light`, `dark`, `seasonal-light`, `seasonal-dark`. Default `light`. No system option.
- Seasons: northern hemisphere, meteorological. winter = Dec–Feb, spring = Mar–May, summer = Jun–Aug, fall = Sep–Nov.
- `lib/seasons.ts` is the single source of season data. The head script is generated from it, never hand-copied.
- Seasons override accent tokens only: `--primary`, `--primary-foreground`, `--ring`, `--secondary`,
  `--group-gift`, `--group-gift-soft`, `--backdrop-from`, `--backdrop-to`. Success, suggestion and destructive stay unchanged.
- Text on `--primary` must reach WCAG AA (4.5:1) in every season, light and dark.
- No new runtime dependencies.

## Review Focus

- **Stale or unknown stored theme** (for example an old `"system"` value in localStorage) → renders exactly like `light`. This is
  pinned by CSS: every non-light selector names an exact theme value. Check in Task 2 Step 4.
- **Year boundary:** December and January both → winter. Pinned by the 12-month table test in Task 1.
- **Script blocked, or `data-season` missing** → seasonal themes fall back to the plain light/dark palette, not
  broken colours. Seasonal selectors require `[data-season=…]`. Check in Task 3 Step 3.
- **Existing `dark:` utility classes (22 uses)** must apply under both `dark` and `seasonal-dark`. Check in Task 2 Step 4.
- **Toasts under `seasonal-dark`** must render dark, not light. Check in Task 4 Step 4.

---

### Task 1: Season data and head script

**Files:**
- Create: `lib/seasons.ts`
- Test: `lib/seasons.test.ts`
- Modify: `package.json` (add `"test": "node --test lib/*.test.ts"`), `tsconfig.json` (add `"allowImportingTsExtensions": true`, so the test's `./seasons.ts` import type-checks)

**Interfaces:**
- Produces:
  - `type Season = 'winter' | 'spring' | 'summer' | 'fall'`
  - `const SEASONS: readonly { name: Season; months: readonly number[] }[]` (months are 0-based, matching `Date#getMonth()`). Adding a season or holiday = one entry here plus one CSS block.
  - `function seasonForMonth(month: number): Season`
  - `const seasonScript: string`: a self-contained JS statement that sets `document.documentElement.dataset.season` from `new Date().getMonth()`. Build it from a 12-entry month→season array derived from `SEASONS` and `JSON.stringify`.

- [ ] **Step 1: Write the failing test** (`node:test` + `node:assert/strict`, import from `'./seasons.ts'`)

```ts
test('every month maps to exactly one season', () => {
  const expected = ['winter','winter','spring','spring','spring','summer','summer','summer','fall','fall','fall','winter']
  assert.deepEqual([...Array(12).keys()].map(seasonForMonth), expected)
  assert.equal(SEASONS.flatMap(s => s.months).sort((a, b) => a - b).join(), [...Array(12).keys()].join())
})

test('seasonScript sets data-season from the current month', () => {
  const root = { dataset: {} as Record<string, string> }
  new Function('document', 'Date', seasonScript)({ documentElement: root }, class { getMonth() { return 11 } })
  assert.equal(root.dataset.season, 'winter')
})
```

- [ ] **Step 2:** `npm test` → FAIL (module not found).
- [ ] **Step 3:** Implement `lib/seasons.ts` per Interfaces. No React and no `'use client'`; the server layout imports it.
- [ ] **Step 4:** `npm test` → 2 pass. `npx tsc --noEmit` → no errors.
- [ ] **Step 5: Commit** `feat: add calendar season data and head script`

### Task 2: Theme wiring (provider, attributes, dark tokens)

**Files:**
- Modify: `app/[lang]/layout.tsx`, `styles/tailwind.css`, `DESIGN.md:144`

**Interfaces:**
- Consumes: `seasonScript` from Task 1; `ThemeProvider` from `components/theme-provider.tsx` (unchanged).
- Produces: `<html>` carries `data-theme="<theme name>"` and `data-season="<season>"`. Later tasks key CSS and
  `useTheme()` off these.

- [ ] **Step 1: Layout.** On `<html>` add `suppressHydrationWarning`. In `<head>`, add
  `<script dangerouslySetInnerHTML={{ __html: seasonScript }} />`. Wrap the body's contents in
  `<ThemeProvider attribute="data-theme" themes={['light','dark','seasonal-light','seasonal-dark']} defaultTheme="light" enableSystem={false} disableTransitionOnChange>`.
- [ ] **Step 2: CSS.**
  - Change the dark variant to `@custom-variant dark (&:is([data-theme="dark"] *, [data-theme="seasonal-dark"] *));`.
  - Change the `.dark { … }` token block's selector to `[data-theme="dark"], [data-theme="seasonal-dark"]`.
  - Replace the "Dark mode is not switched on anywhere yet" comment with one line naming the four themes.
  - Update `DESIGN.md:144` to match.
- [ ] **Step 3:** `npm run build` → succeeds.
- [ ] **Step 4: Manual check.** Run `npm run dev` and open `/en`. In devtools, set
  `localStorage.theme` to `dark`, reload, and check the page is dark. Check that a component using a `dark:` class
  (`git grep -n "dark:" -- '*.tsx'`) changes. Repeat with `seasonal-dark`, which should also be dark. Then set
  `system` and check the page renders as light. Check `<html data-season>` shows the current season (`fall` in November).
- [ ] **Step 5: Commit** `feat: mount theme provider with data-theme and season attribute`

### Task 3: Seasonal palettes

**Files:**
- Modify: `styles/tailwind.css` (new blocks after the dark token block)

**Interfaces:**
- Consumes: the `data-theme` and `data-season` attributes from Task 2.

Selectors: `[data-theme="seasonal-light"][data-season="<s>"]` and `[data-theme="seasonal-dark"][data-season="<s>"]`.
That makes 8 blocks, and they must come after the dark block so they win the cascade. Use Tailwind palette variables
(`var(--color-…)`). Light blocks keep the existing near-white `--primary-foreground`. Dark blocks set
`--primary-foreground: oklch(0.141 0.005 285.823)` and set `--backdrop-from` to the existing dark value.

| Season | light primary / ring | light secondary | light backdrop from → to | group-gift (light) | dark primary / ring | dark backdrop-to |
|---|---|---|---|---|---|---|
| winter | cyan-700 | sky-200 | sky-100 → indigo-300 | cyan-800 | cyan-400 | cyan-950 |
| spring | emerald-700 | pink-200 | pink-100 → emerald-200 | emerald-800 | emerald-400 | emerald-950 |
| summer | orange-700 | amber-200 | amber-100 → rose-300 | orange-800 | orange-400 | rose-950 |
| fall | orange-800 | orange-200 | orange-100 → red-300 | red-800 | amber-400 | orange-950 |

- `--group-gift-soft`: the same hue at `-50` in light, and the dark primary at `/ 15%` alpha in dark (the pattern the existing tokens use).
- Dark `--group-gift`: the season's `-300` shade.
- Dark `--secondary`: leave it at the dark default.

- [ ] **Step 1:** Add the 8 blocks per the table.
- [ ] **Step 2: Contrast check.** For each light `--primary` against `--primary-foreground`, and each dark `--primary`
  against its dark foreground, confirm ≥ 4.5:1. Use any WCAG checker on the computed colours from devtools. If one
  fails, step one shade darker (light) or lighter (dark) and note it in the commit message.
- [ ] **Step 3: Manual check.** For each season, set `document.documentElement.dataset.season` in devtools under
  `seasonal-light` and `seasonal-dark`, and check that the buttons and backdrop change. Then delete `data-season` and
  check the page falls back to the plain light or dark palette.
- [ ] **Step 4: Commit** `feat: add seasonal accent palettes`

### Task 4: Theme picker and toasts

**Files:**
- Modify: `components/user-menu.tsx`, `components/ui/sonner.tsx`, `dictionaries/en/common.json`, `dictionaries/ru/common.json`

**Interfaces:**
- Consumes: `useTheme()` from `next-themes` (`theme`, `setTheme`). The four theme names come from Global Constraints.

- [ ] **Step 1: Copy.** Add `common.theme` to both dictionaries:
  - en: `{ "label": "Theme", "light": "Light", "dark": "Dark", "seasonalLight": "Seasonal light", "seasonalDark": "Seasonal dark" }`
  - ru: `{ "label": "Тема", "light": "Светлая", "dark": "Тёмная", "seasonalLight": "Сезонная светлая", "seasonalDark": "Сезонная тёмная" }`
- [ ] **Step 2: Picker.** In `user-menu.tsx`, between Profile Settings and the second separator, add a
  `DropdownMenuSub`:
  - The trigger shows a `Palette` icon (lucide) and `t.theme?.label`.
  - Inside, a `DropdownMenuRadioGroup value={theme} onValueChange={setTheme}` with four `DropdownMenuRadioItem`s, one per theme name.
  - Follow the existing `t.x?.y || 'English'` fallback pattern for labels.
- [ ] **Step 3: Toasts.** In `sonner.tsx`, pass Sonner
  `theme={resolvedTheme?.endsWith('dark') ? 'dark' : 'light'}` (from `useTheme()`) instead of the current cast.
- [ ] **Step 4: Manual check.** Pick each of the four themes from the menu. Check the radio mark follows the
  choice, the choice survives a reload, and switching to `ru` shows the Russian labels. Trigger a toast (for example, save
  a gift) under `seasonal-dark` and check it renders dark.
- [ ] **Step 5:** `npm run build && npm run lint && npm test` → build passes, no new lint problems in the touched
  files, tests pass.
- [ ] **Step 6: Commit** `feat: theme picker in user menu`
