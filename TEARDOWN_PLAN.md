# Teardown fix plan

From the impeccable critique and audit plus the taste lens, run on 2026-11-10.
Critique snapshot: `.impeccable/critique/2026-11-11T00-19-05Z__app-lang-page-tsx.md`.
Baseline: critique 20/40, audit 7/20.

The scope decisions:
- Both P0s go first.
- Violet stays as the brand colour and gets tidied.
- Every P1 and P2 is in scope.

Branch: `fix/teardown-p0-p2`.

## Phase 1: P0 security, debug routes ✅
- [x] Add `lib/debug-guard.ts`. The guard returns 404 unless `NODE_ENV !== 'production'` and `ENABLE_DEBUG_ROUTES=true`.
- [x] Apply the guard to `manual-magic-link`, `test-user`, `database-sync`, `fix-data-types`, `auth-diagnostic`, `diagnostic`, `email-diagnostic` and `token-diagnostic`.

## Phase 2: P0 surprise-list leak ✅
- [x] `/api/gift-items` GET: on surprise lists the user owns, null out `purchased_by` and `purchaser_name` and zero `gift_card_total_purchased`.
- [x] `/api/gift-items?user_id=` returns another user's items without any permission check, so refuse it for anyone but the signed-in user.
- [x] `/api/gift-card-purchases`: require a session for every method.
  - GET returns nothing to the owner of a surprise list.
  - POST always uses the session user as the purchaser.
  - PUT and DELETE only touch the caller's own contributions.
- [x] `GiftCardDetails`: take an `isPublic` prop. On a surprise list the owner sees only "Gift card", with no amounts and no contributors.
- [x] Server fixes found in the audit:
  - `proxy.ts` throws a 500 when `Accept-Language` is missing.
  - `/favicon.ico` is routed as a locale.

### Found while fixing (also done)
- [x] `/api/gift-items` POST, PUT and DELETE checked no session (anyone could edit or delete any gift). They now require a session and enforce ownership.
- [x] `/api/family-members` (every user's email), `/api/og-data` (server fetches any URL) and `/api/amazon` (spends the RapidAPI quota) were open to anyone. They now require a session.
- [x] Added a real favicon (`app/icon.svg`, `public/favicon.ico`).

## Phase 3: P1 purchase flow (`/impeccable harden`) ✅
Also: failed saves no longer replace the app with the full-screen "Database Connection Error". Updated rows keep their joined fields such as `is_public`. Sonner `Toaster` mounted.
- [x] Turn the purchase toggle into a labelled "I'll get this" button, visible on mobile too.
- [x] Only the buyer can un-mark. Everyone else sees "Claimed by {name}". Enforce this on the server in the gift-items PUT.
- [x] Toast on success and on failure. On a surprise list the success toast says "{Name} won't see this".
- [x] Gift-card contribution: call it "Record a contribution", say plainly that no payment happens, and cap amounts at the remaining target.

## Phase 4: P1 destructive actions and accessibility ✅
- [x] `ConfirmProvider` / `useConfirm` (AlertDialog) replaces every `window.confirm` and `alert`. Gift delete names the item and points to archiving instead. Success and failure toasts.
- [x] `aria-label` on every icon-only button: row actions, list management, drawer close, comment send and delete, contribution edit/save/cancel/delete, gift-card eye toggle, locale switcher.
- [x] The gift name in each row is a real button that opens the drawer. The user menu trigger is now a `<button>` (it was a `div` and unreachable by keyboard). The clickable "interested" badge is now a button.
- [x] Phones: owner row icons move into the drawer, which has the same actions labelled, and the chevron is visible. Comment delete is visible on touch.
- [x] Labels linked in the suggest dialog, approve dialog and add form. Register's labels were already linked; Assessment A was wrong on that.
- [x] Sign-in photo is `alt=""` (decorative). Thumbnails are `alt=""` because the name sits next to them.
- [x] Phone tap targets: `max-md:min-h-11` on button, input, select and tabs primitives (desktop sizes unchanged). "Sign up" link is 44px tall on phones.

## Phase 5: P2 add form ✅
- [x] One "Paste a link or type a gift" field. Details appear once something is typed. Enter submits. Older link previews can't overwrite newer ones. Typed input is kept if the save fails.
- [x] Item / Gift card / Group gift is one three-way toggle, in the add form and the edit dialog.
- [x] "Link::" double colons fixed (dictionaries and code).

## Phase 6: P2 copy and privacy language ✅
- [x] Inline privacy lines replace the tooltip badges: "Surprise: you won't see what's been bought" / "{Name} won't see what you buy".
- [x] The switch reads "Show me what's been bought" and states the consequence. "Who can see this list" explains how it differs from the surprise setting.
- [x] Gift-card UI, the archived label and the load error are translated. The error no longer mentions Neon. The loading skeleton mirrors the real layout. Metadata description written.
- [x] Register says "Meep Giftlist", matching sign-in. The "0 item" plural bug is fixed.

## Phase 7: P2 colour system ✅
- [x] One `:root` and one `.dark` (dark is still not switched on). The light values are unchanged.
- [x] Semantic tokens `success`, `group-gift` and `suggestion` (solid plus soft), plus `backdrop-from` / `backdrop-to`. Every raw palette class in app code has been replaced. The only ones left are in a commented-out block in `login-form.tsx`.
- [x] Every auth page shows the same backdrop. The mobile white fill moved from the layout into the main page; at phone width it was cutting the auth backdrop in half.
- [x] `::selection` and the text caret use the brand colour.

## Phase 8: Cleanup and documentation
- [x] Deleted the unused `components/navigation-bar.tsx` (it held shadcn docs demo data).
- [ ] **Left for you:** remove unused dependencies. Not done, because the repo has both `pnpm-lock.yaml` and an untracked `package-lock.json`, and the deploy's package manager is unclear.
  - Unused anywhere: `next-auth`, `@auth/neon-adapter`, `zod`, `@hookform/resolvers`, `date-fns`, `recharts`, `tailwindcss-animate`, and the placeholder `fs` / `path` packages.
  - Used only by unimported shadcn components: `cmdk`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `react-hook-form`.
- [x] DESIGN.md and `.impeccable/design.json` written from the code as it now stands (North Star: "The Quiet Coordinator").
- [x] Fixed four gaps the documenter found:
  - suggestion actions failed silently (they now show toasts)
  - tab triggers were about 37px tall on phones (now 44px)
  - a raw `text-white` on the pending badge
  - `--font-sans` / `--font-mono` held class names instead of font families
- [ ] Known drift, not fixed:
  - auth and profile card titles use `font-bold` while the app uses 500 weight
  - the old Radix toast files sit alongside sonner
  - `group-gift-soft` is defined but unused

## Phase 9: Polish and re-score
- [x] Tab section titles are now `h2`. Removed the undefined `font-heading` class.
- [x] `npm run build` passes and the type-check is clean (the 5 stale `.next/types` errors are pre-existing).
- [ ] Re-run `/impeccable critique` and the audit. This is worth doing once someone is signed in, because neither run could see the authenticated screens.

## Follow-up: quick import while browsing
- [x] `/[lang]/add?url=…&title=…`: a signed-in page that opens the quick-add form with the link filled in. It previews the link and falls back to the page title when the shop blocks previews. It defaults to the last-used list (remembered per browser). After saving it shows "Saved to {list}" and closes itself when opened as a popup. Share-style `text=` links are accepted too.
- [x] Sign-in round trip: a signed-out visit to a deep link stores it in an HttpOnly `meep_return_to` cookie (15 min). The first request after sign-in returns there. Works for both password and magic-link sign-in. Unsafe paths are ignored.
- [x] "Save to Meep" bookmarklet card on the profile page (drag to bookmarks bar). Falls back to the same tab when popups are blocked.
- [x] Fixed `UserMenuWrapper` treating `/en/auth/...` as a non-auth page; it was causing the 401 on sign-in.
- [ ] Next: PWA manifest with `share_target` → `/add` (Android share sheet), and an iOS Shortcut recipe.
