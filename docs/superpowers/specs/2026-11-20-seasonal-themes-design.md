# Seasonal themes

## Intent

Let each user pick how the app looks: **light**, **dark**, **seasonal light**, or **seasonal dark**.
The seasonal themes swap the accent colours by calendar season (winter, spring, summer, fall),
so the app changes through the year. The season list should be easy to extend later,
for example with holidays.

## Goals

- Four themes, picked from the user menu, remembered per browser.
- The seasonal themes change automatically with the date. Nobody picks a season.
- No flash of the wrong theme or season on page load.
- Adding a season means one date-range entry plus one CSS block.

## Non-goals

- Saving the choice to the user's account across devices. This can be added on top later, the way
  `preferred_locale` is saved.
- A "follow my device" (system) option. It's a one-line `next-themes` change if wanted.
- Southern-hemisphere seasons. Holidays.

## Anti-goals

- Changing components, or recolouring per component. Seasons redefine CSS variables only.
- Seasonal colours that fail contrast. Text on `--primary` must stay readable, in light and dark.

## Approaches

- **A. `next-themes` + season computed in the browser (chosen).** The theme is stored by `next-themes`.
  An inline script sets the season on `<html>` before first paint. Each season is one CSS block of
  variable overrides. Pages stay static.
- **B. Theme saved on the account.** It follows the user across devices. Rejected for now: avoiding a
  flash would force per-request rendering of pages that are pre-built today, plus a DB column and an
  API change. It can be layered on top of A later.
- **C. Season computed on the server.** Rejected: pages are statically generated, so the season would
  freeze at build time.

## Design (decided)

- **Themes:** mount the existing `components/theme-provider.tsx` in `app/[lang]/layout.tsx` with
  `attribute="data-theme"`, `themes=['light','dark','seasonal-light','seasonal-dark']`, `enableSystem={false}`,
  `defaultTheme="light"`. The existing `.dark` token block and the `dark:` variant key off
  `[data-theme="dark"]` and `[data-theme="seasonal-dark"]` instead of a class. (`next-themes` can't apply two
  classes for one theme cleanly, so one attribute is simpler.) Add `suppressHydrationWarning` on `<html>`.
- **Season:** `lib/seasons.ts` exports one ordered list of `{ name, months }`, northern hemisphere,
  meteorological: winter = Dec–Feb, spring = Mar–May, summer = Jun–Aug, fall = Sep–Nov. A tiny inline
  `<script>` in the layout `<head>` sets `document.documentElement.dataset.season` from the visitor's
  local date before paint. The same list feeds the script, so there is one source of truth.
- **Colours:** `styles/tailwind.css` gets one block per season, for example
  `.seasonal[data-season="winter"]`, plus a `.dark` variant of each. Each block overrides only the
  accent tokens: `--primary`, `--primary-foreground`, `--ring`, `--secondary`, `--group-gift(-soft)`,
  `--backdrop-from`, `--backdrop-to`. The semantic states (success, suggestion, destructive) stay
  as they are.
- **Picker:** a theme submenu (or radio group) in `components/user-menu.tsx`, with labels in
  `dictionaries/{en,ru}`.
- **Toasts:** `components/ui/sonner.tsx` maps the resolved theme to `light`/`dark` for Sonner.

## Left to the builder

- The exact seasonal palettes. Proposed direction: winter = icy blue/teal, spring = fresh green/pink,
  summer = warm amber/coral, fall = rust/orange. Check each for contrast in light and dark.
- Picker markup details, within the existing dropdown-menu components.
- One small self-check that the date-to-season mapping covers all 12 months exactly once.
