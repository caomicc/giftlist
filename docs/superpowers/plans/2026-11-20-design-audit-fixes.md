# Design Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the usability and design problems found in the 2026-11-20 audit of the signed-in screens. The audit was run at 390px and 1280px, signed in as the seed family.

**Architecture:** Most fixes are local to existing client components. Two need data changes:
- comment visibility becomes "owner reads only once archived", enforced in the API's SQL;
- prices gain a per-item `currency` column (default `USD`), validated on the server and shown in the item's currency.

**Tech Stack:** Next.js 16.4 (App Router; read `node_modules/next/dist/docs/` before using router APIs), React, Tailwind 4, shadcn/ui + Radix, vaul drawer, sonner toasts, next-themes, Neon serverless driver, node:test, Playwright.

**Spec:** The findings checklist below, which is the audit plus two decisions from the user (2026-11-20):
1. Gift owners can read comments only once the gift is archived.
2. Every existing value is in dollars, but it must be possible to add items in other currencies.

## Findings checklist

Each line maps to the task that closes it.

### Highest impact
- [ ] Lists start collapsed. Your own gifts are hidden on load, family gifts need two clicks, and a new gift lands in a closed list with no toast. **Tasks 4, 9**
- [ ] Comments don't say who can read them. Decision: the owner reads others' comments only after archiving. **Task 1**
- [ ] Prices show in the viewer's browser currency, not the item's. Decision: per-item currency, default USD. **Tasks 2, 3, 15**
- [ ] The price badge is the same raw green as "Purchased" (breaks the Semantic-Only and State Owns The Hue rules). **Task 2**
- [ ] Phone family rows cut titles to about 12 characters, and the "Purchased" badge repeats the "Claimed by" chip. **Task 5**
- [ ] The gift drawer slides in from the right on phones. It shows "Purchased by" and "Claimed by" together and strikes through the title. **Task 6**

### Medium
- [ ] Group gifts have two competing calls to action ("Interested" and "I'll get this"), and pledges end up in comments. **Task 13**
- [ ] No undo for releasing a claim or archiving. "Tap to unmark" is a tooltip, which touch screens never show. **Task 7**
- [ ] The open tab isn't in the URL, so refresh and Back lose it. **Task 8**
- [ ] First run: the default list is "{Full Name}'s List" with a hardcoded English "Default wishlist" description, and its empty state is hidden in a closed list. **Tasks 4, 9**
- [ ] Repeated chrome: "Welcome back 😊", headings that repeat the tab names, "Click on…" on phones, the suggestion count shown three times, and "Suggesti…" truncated. **Task 9**
- [ ] The top bar isn't a real row. The locale switcher nearly touches the greeting, the avatar overlaps the profile card, English shows a 🇺🇸 flag, and on desktop both controls sit at the window edges. **Task 10**
- [ ] List management is separate from the lists (gear, then a modal, then a dialog) and uses its own "Tracked/Surprise" words. **Task 12**
- [ ] Saving who can see a list fails silently, and creating or updating a list gives no success toast. **Task 11**
- [ ] The add form always shows "Image URL" and the price field gives no hint of currency. **Tasks 3, 14**
- [ ] Suggestions:
  - The suggest dialog repeats each label as its placeholder.
  - The card shows a raw "199.00".
  - A "Pending" badge sits under "Pending Review".
  - "Add to List" is green.

  **Tasks 2, 15**
- [ ] The theme ignores the device's dark mode. **Task 16**
- [ ] Claimed and available gifts are mixed together. **Task 17**

### Polish
- [ ] Sign-in:
  - The button says "Login" and the headline is just "Hi 😊".
  - There's no "Forgot password?" link.
  - The photo takes half the phone screen.

  **Task 18**
- [ ] The bookmarklet card shows on phones. **Task 19**
- [ ] There's no web app manifest or home-screen icon. **Task 20**
- [ ] Rows and pages:
  - Drop the "Created …" line on lists.
  - Make the comment delete icon grey until hovered (it's red at rest).
  - Collapse the Archived section by default.
  - Enable Edit on archived items (it's disabled with no explanation).
  - Give rows without a thumbnail a placeholder tile.
  - Use weight 500 for the auth and profile titles (they're bold).

  **Task 19**

## Global Constraints

- Work on branch `fix/design-audit`, never on `main`.
- Every new user-facing string goes in `dictionaries/en/*.json` with a matching `dictionaries/ru/*.json` entry, and is read through the existing `t.…?.key || 'English fallback'` pattern. Keys that no longer have a user get deleted from both.
- Copy is sentence case, uses plain verbs and has no exclamation marks. Exact strings are given in each task.
- Components use semantic token utilities only (`bg-success`, `text-muted-foreground`, …), never raw palette classes (DESIGN.md "Semantic-Only Rule").
- Purchase status, purchasers, contributions and (after Task 1) other people's comments must never reach the owner from the API. Hiding them in the UI is not enough (DESIGN.md Don'ts, `lib/gift-privacy.ts`).
- Phone touch targets stay at 44px or more below 768px.
- `npm run lint` and `npm test` pass before every commit (pre-commit hook). `npm run test:e2e` passes before pushing; it needs `npm run db:up`.
- After you change `db/schema.sql` or `db/seed.sql`, run `npm run db:reset`.
- **Production:** apply `scripts/neon/14-add-currency.sql` with `psql "$NEON_DATABASE_URL" -f …` before deploying Task 2. The user runs this; agents never connect to production.
- Update DESIGN.md wherever a task changes a documented rule. Each task names the section.

## Review Focus

1. **A malformed currency code reaching `Intl.NumberFormat`** throws a RangeError and would crash every row. The server rejects unknown codes (Task 2 e2e) and `formatCurrency` falls back to a plain number (Task 2 unit test).
2. **Legacy price strings** such as `"$1,299.99"`, `"29.99 GBP"` or `"around 40"` must display sensibly. Unreadable text is shown as entered (Task 2 unit tests); prices from link previews are split into amount and currency (Task 3 unit tests).
3. **Comments after unarchiving:** they are hidden from the owner again. The owner always sees their own comments, and the row's comment count never reveals other people's comments (Task 1 e2e, using the API count).
4. **Lists that load after the gifts** must still open by default (Task 4 extends the slow-lists e2e).
5. **Undo after someone else acted:** if another member claims the gift during the undo window, the undo gets the existing "Someone else already claimed this" toast, not a silent failure (Task 7 routes undo through `handleTogglePurchase`).

---

### Task 1: Owners read comments only once the gift is archived

**Files:**
- Modify: `app/api/gift-item-comments/route.ts:19-89` (GET)
- Modify: `app/api/gift-items/route.ts` (the three `comment_count` CASE expressions, around lines 31-38, 77-85 and 107-115)
- Modify: `components/gift-item-drawer.tsx` (comments section, around lines 286-340)
- Modify: `e2e/fixtures.ts`, `e2e/gifts.spec.ts` (move helpers)
- Create: `e2e/comments.spec.ts`
- Modify: `dictionaries/{en,ru}/gifts.json` (`drawer` block), DESIGN.md "Privacy Lines"

**Interfaces:**
- Produces, in `e2e/fixtures.ts`:
  - `expand(page, label)` and `myGiftRow(page, name)`, moved verbatim from `gifts.spec.ts` and exported;
  - `SEED_GIFTS.twoPersonTent = { id: id(205), name: 'Two-person tent' }`;
  - `SEED_GIFTS.bookshopGiftCard = { id: id(204), name: 'Bookshop gift card' }`.

**The rule:** a viewer sees all of a gift's comments unless they are the gift's owner (`gi.owner_id = viewer`) and the gift is not archived. In that case they see only their own. List privacy (`is_public`) no longer matters for comments.

- [ ] **Step 1: Move `expand` and `myGiftRow` into `e2e/fixtures.ts`, add the two `SEED_GIFTS` entries, and import them in `gifts.spec.ts`**

- [ ] **Step 2: Write the failing tests in `e2e/comments.spec.ts`** (`mode: 'serial'`; they archive a shared seed gift)

```ts
const TENT = SEED_GIFTS.twoPersonTent
const SAMS_COMMENT = 'I can chip in $80.'
// ?user_id= is the owner's own query, which includes archived items
const tentCount = async (page: Page) =>
  (await (await page.request.get(`/api/gift-items?user_id=${SEED.alex.id}`)).json())
    .find((g: { id: string }) => g.id === TENT.id)?.comment_count

test('the owner reads family comments only once the gift is archived', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await expand(page, "Alex's wishlist")
  expect(Number(await tentCount(page))).toBe(0)
  await page.getByRole('button', { name: TENT.name }).click()
  const drawer = page.getByRole('dialog', { name: TENT.name })
  await expect(drawer.getByText('Family comments stay hidden until you archive this gift.')).toBeVisible()
  await expect(drawer.getByText(SAMS_COMMENT)).toHaveCount(0)
  await page.keyboard.press('Escape')
  await myGiftRow(page, TENT.name).getByRole('button', { name: 'Archive item' }).click()
  try {
    expect(Number(await tentCount(page))).toBe(1)
    await page.getByRole('button', { name: TENT.name }).click()
    await expect(page.getByRole('dialog', { name: TENT.name }).getByText(SAMS_COMMENT)).toBeVisible()
    await page.keyboard.press('Escape')
  } finally {
    await myGiftRow(page, TENT.name).getByRole('button', { name: 'Unarchive item' }).click()
  }
  expect(Number(await tentCount(page))).toBe(0) // hidden again once unarchived
})

test('family members are told the owner can’t read comments yet', async ({ page }) => {
  await signInAs(page, SEED.sam.email)
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await expand(page, `${SEED.alex.name}'s Gift Lists`)
  await expand(page, "Alex's wishlist")
  await page.getByRole('button', { name: TENT.name }).click()
  const drawer = page.getByRole('dialog', { name: TENT.name })
  await expect(drawer.getByText(SAMS_COMMENT)).toBeVisible()
  await expect(drawer.getByText(`${SEED.alex.name} can’t read comments until they archive this gift.`)).toBeVisible()
})
```

If the response is wrapped (for example `{ giftItems }`), unwrap it in `tentCount`.

- [ ] **Step 3: Run `npx playwright test e2e/comments.spec.ts` and confirm it fails.** Expected: FAIL on the missing privacy line and on count 1 for Alex (Alex's list is tracked, so today Alex sees everything).

- [ ] **Step 4: Implement the rule**
  - GET in the comments route: select `gi.archived`. The own-comments-only branch becomes `giftItem.owner_id === currentUser.id && !giftItem.archived`.
  - All three `comment_count` CASEs become `WHEN gi.owner_id = ${currentUser.id} AND gi.archived = FALSE THEN <own count> ELSE <all>`.
  - Drawer: under the comment composer, add a 12px `text-muted-foreground` line with an `EyeOff` icon, matching the existing privacy lines:
    - owner, not archived: `gifts.drawer.commentsHiddenFromYou` = "Family comments stay hidden until you archive this gift.";
    - everyone else: `gifts.drawer.commentsHiddenFromOwner` = "{{name}} can’t read comments until they archive this gift." with `name = item.owner_name`;
    - owner, archived: no line.

- [ ] **Step 5: Run `npx playwright test e2e/comments.spec.ts e2e/gifts.spec.ts` and confirm both pass.**

- [ ] **Step 6: Add a "Comments" bullet to DESIGN.md "Privacy Lines" stating the rule, then commit**

```bash
git add app/api/gift-item-comments/route.ts app/api/gift-items/route.ts components/gift-item-drawer.tsx e2e/ dictionaries/ DESIGN.md
git commit -m "fix: gift owners read comments only once the gift is archived"
```

### Task 2: Per-item currency: data, API and display

**Files:**
- Create: `scripts/neon/14-add-currency.sql`
- Modify: `db/schema.sql` (the `gift_items` and `gift_suggestions` CREATE TABLE blocks)
- Modify: `lib/currency.ts`, `lib/neon.ts` (`GiftItem`, `GiftSuggestion`), `hooks/useGiftData.ts` (`NewGiftItem`)
- Modify: `app/api/gift-items/route.ts` (POST, PUT), `app/api/gift-suggestions/route.ts` (POST around line 147, approve around lines 258-273)
- Modify: `components/price-tag.tsx`, `components/ui/badge.tsx:22-25` (delete the `price` variant)
- Modify: `components/gift-card-details.tsx`, `components/gift-card-contributions.tsx`, `components/gift-card-purchase-dialog.tsx`, `components/suggestions-view.tsx:216`
- Create: `lib/currency.test.ts`, `e2e/currency.spec.ts`

**Interfaces:**
- Produces, in `lib/currency.ts`:
  - `export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'RUB'] as const`
  - `export type Currency = (typeof CURRENCIES)[number]`
  - `export function isCurrency(value: unknown): value is Currency`
  - `formatCurrency(amount, currency, locale)` and `formatPrice(price, currency, locale)`, signatures unchanged. Delete `getUserCurrency`; nothing will use it.
- Produces: `GiftItem.currency: string`, `GiftSuggestion.currency: string`, `NewGiftItem.currency?: string`.
- Produces: `<PriceTag price: string currency?: string />`. `currency` defaults to `'USD'`. It renders plain `text-xs text-muted-foreground tabular-nums` text, not a badge.

- [ ] **Step 1: Write failing unit tests in `lib/currency.test.ts`.** Intl uses non-breaking spaces, so normalise them first: `const n = (s: string) => s.replace(/\s/g, ' ')`.

```ts
test('prices use the item’s currency, whatever the viewer’s locale', () => {
  assert.equal(n(formatPrice('65.00', 'USD', 'ru-RU')), '65,00 $')
  assert.equal(formatPrice('40', 'GBP', 'en-US'), '£40.00')
})
test('text that isn’t a number is shown as entered', () => {
  assert.equal(formatPrice('around 40', 'USD', 'en-US'), 'around 40')
})
test('a malformed currency code never throws', () => {
  assert.equal(formatCurrency(10, 'bad', 'en-US'), '10.00')
})
test('isCurrency accepts only the supported codes', () => {
  assert.equal(isCurrency('EUR'), true)
  assert.equal(isCurrency('eur'), false)
  assert.equal(isCurrency('XYZ'), false)
})
```

- [ ] **Step 2: Run `npm test` and confirm it fails.** Expected: FAIL (`isCurrency` is not exported, and `formatCurrency` throws on `'bad'`).

- [ ] **Step 3: Implement it in `lib/currency.ts`.** `formatCurrency` catches the RangeError and returns `numericAmount.toFixed(2)`.

- [ ] **Step 4: Run `npm test` and confirm it passes.**

- [ ] **Step 5: Add the migration and schema change**
  - `14-add-currency.sql`, in one `BEGIN; … COMMIT;`:
    - `ALTER TABLE gift_items ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';`
    - the same for `gift_suggestions`.
  - Add `currency text DEFAULT 'USD'::text NOT NULL` to both tables in `db/schema.sql`.
  - Run `npm run db:reset`.

- [ ] **Step 6: Write failing e2e tests in `e2e/currency.spec.ts`**

```ts
test('the server rejects an unknown currency', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const res = await page.request.post('/api/gift-items', { data: {
    name: 'Bad currency', price: '10', currency: 'bad', owner_id: SEED.alex.id, list_id: ALEX_LIST_ID } })
  expect(res.status()).toBe(400)
})

test('a euro item shows in euros', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const res = await page.request.post('/api/gift-items', { data: {
    name: 'Euro item', price: '12', currency: 'EUR', owner_id: SEED.alex.id, list_id: ALEX_LIST_ID } })
  const { giftItem: item } = await res.json()
  try {
    expect(item.currency).toBe('EUR')
    await page.reload()
    await expand(page, "Alex's wishlist")
    await expect(myGiftRow(page, 'Euro item').getByText('€12.00')).toBeVisible()
  } finally {
    await page.request.delete(`/api/gift-items?id=${item.id}`)
  }
})
```

`ALEX_LIST_ID = '00000000-0000-4000-8000-000000000101'`. POST returns `{ giftItem }`, and DELETE takes `?id=`.

- [ ] **Step 7: Run `npx playwright test e2e/currency.spec.ts` and confirm it fails.**

- [ ] **Step 8: Implement**
  - POST and PUT in gift-items and the suggestions POST: if `currency` is present and `!isCurrency(currency)`, return 400 `{ error: 'Unsupported currency' }`. Otherwise store it (default `'USD'`).
  - Suggestion approve copies `suggestion.currency` into the new gift item.
  - `PriceTag` takes `currency`.
  - Every caller passes the item's currency: `gift-item.tsx:134` and `gift-item-drawer.tsx:171` pass `item.currency`.
  - The gift-card components format amounts with the gift item's currency (thread a `currency` prop from the drawer and row).
  - `suggestions-view.tsx:216` renders `<PriceTag price={suggestion.price} currency={suggestion.currency} />`.
  - Delete the badge `price` variant.

- [ ] **Step 9: Run `npm test && npx playwright test` and confirm everything passes.**

- [ ] **Step 10: Update DESIGN.md.** Under Colors and Chips, say the price is muted text in the item's currency, not a green badge. Commit.

```bash
git add scripts/neon/14-add-currency.sql db/schema.sql lib/ hooks/useGiftData.ts app/api/ components/ e2e/currency.spec.ts DESIGN.md
git commit -m "feat: per-item currency; prices show in the item's currency"
```

### Task 3: Choosing a currency when adding or editing

**Files:**
- Create: `components/currency-select.tsx`
- Modify: `lib/currency.ts`, `lib/currency.test.ts`
- Modify: `components/add-gift-form.tsx`, `components/edit-gift-dialog.tsx`, `components/suggest-gift-dialog.tsx`, `hooks/useSuggestionData.ts:54-58` (add `currency?: string` to the `createSuggestion` payload)
- Modify: `app/api/og-data/route.ts` (return `currency`), `hooks/useGiftData.ts` (`OGData.currency?: string | null`)
- Modify: `e2e/currency.spec.ts`

**Interfaces:**
- Consumes: `CURRENCIES`, `isCurrency` from Task 2.
- Produces: `parsePrice(text: string): { amount: string; currency: Currency | null }` in `lib/currency.ts`.
- Produces: `<CurrencySelect id: string value: string onChange(value: string) disabled?: boolean />`. It's a shadcn `Select` listing `CURRENCIES` by code, with an `aria-label` from `gifts.addForm.labels.currency` = "Currency".
- localStorage key `meep:lastCurrency`, read and written exactly like `meep:lastListId` in `add-gift-form.tsx:50-57`.

- [ ] **Step 1: Write the failing unit test**

```ts
test('parsePrice splits a preview price into amount and currency', () => {
  assert.deepEqual(parsePrice('29.99 GBP'), { amount: '29.99', currency: 'GBP' })
  assert.deepEqual(parsePrice('£1,299.99'), { amount: '1299.99', currency: 'GBP' })
  assert.deepEqual(parsePrice('$65'), { amount: '65', currency: 'USD' })
  assert.deepEqual(parsePrice('€12,50'), { amount: '12,50', currency: 'EUR' })
  assert.deepEqual(parsePrice('80'), { amount: '80', currency: null })
  assert.deepEqual(parsePrice('around 40'), { amount: 'around 40', currency: null })
})
```

Symbols map as `$`→USD, `£`→GBP, `€`→EUR, `₽`→RUB. Any 3-letter code that passes `isCurrency` is also accepted. Strip thousands commas only when a `.` decimal is present. Otherwise leave the amount text as is.

- [ ] **Step 2: Run `npm test` and confirm it fails. Then implement `parsePrice` and confirm it passes.**

- [ ] **Step 3: Write the failing e2e test**

```ts
test('adding a gift in pounds shows pounds, and the next gift defaults to pounds', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const name = `E2E pounds ${Date.now()}`
  await page.getByPlaceholder('Paste a link or type a gift').fill(name)
  await page.getByLabel('Price').fill('25')
  await page.getByRole('combobox', { name: 'Currency' }).click()
  await page.getByRole('option', { name: 'GBP' }).click()
  await page.getByRole('button', { name: 'Add Gift Idea' }).click()
  await expand(page, "Alex's wishlist")
  try {
    await expect(myGiftRow(page, name).getByText('£25.00')).toBeVisible()
    await page.reload()
    await page.getByPlaceholder('Paste a link or type a gift').fill('x')
    await expect(page.getByRole('combobox', { name: 'Currency' })).toHaveText('GBP')
  } finally {
    await myGiftRow(page, name).getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  }
})
```

- [ ] **Step 4: Run it and confirm it fails. Then implement:**
  - `CurrencySelect` sits to the left of the price input on one row, in the add form, the edit dialog and the suggest dialog. For gift cards it sits beside the target amount.
  - The add form's default currency is `meep:lastCurrency` if it passes `isCurrency`, otherwise `'USD'`. It's written on successful save.
  - The edit dialog starts from `item.currency`.
  - og-data returns `currency`: `getMetaContent('product:price:currency')`, or `amazonData.currency`, or `null`.
  - On preview, the form sets `price` from `parsePrice(data.price).amount`, and sets currency from `data.currency ?? parsePrice(data.price).currency` when that passes `isCurrency`. As with the name, it never overwrites a value the user typed.
  - The price input gets `placeholder="0.00"`.

- [ ] **Step 5: Run `npm test && npx playwright test e2e/currency.spec.ts e2e/gifts.spec.ts` and confirm both pass. Commit:** `feat: choose a currency when adding, editing or suggesting a gift`

### Task 4: Lists open by default; adding a gift confirms where it went

**Files:**
- Modify: `components/my-gifts-list.tsx:85`, `components/family-gifts-list.tsx:129-176`, `components/family-gift-app.tsx:121-133`
- Modify: `e2e/gifts.spec.ts`, `e2e/lists.spec.ts`, `e2e/comments.spec.ts`
- Modify: `dictionaries/{en,ru}/gifts.json` (`toasts.added`)

- [ ] **Step 1: Write the failing tests**

In `gifts.spec.ts`, inside `my list`:

```ts
test('my lists are open when the page loads', async ({ page }) => {
  await expect(page.getByText(SEED_GIFTS.chefsKnife.name, { exact: true })).toBeVisible()
})
test('adding a gift says which list it went to', async ({ page }) => {
  const name = uniqueName()
  await page.getByPlaceholder('Paste a link or type a gift').fill(name)
  await page.getByRole('button', { name: 'Add Gift Idea' }).click()
  await expect(page.getByText(`Added to ${ALEX_LIST}`)).toBeVisible()
  await deleteGift(page, name)
})
```

In `claiming`:

```ts
test('one click on a family member shows their gifts', async ({ page }) => {
  await signInAs(page, SEED.riley.email)
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await page.getByRole('button', { name: `${SEED.sam.name}'s Gift Lists` }).click()
  await expect(page.getByText(SEED_GIFTS.castIronSkillet.name, { exact: true })).toBeVisible()
})
```

In the `lists.spec.ts` slow-lists test, after its `toBeVisible`, add `await expect(page.getByText('Board game: Wingspan', { exact: true })).toBeVisible()`. That's Jordan's own seed gift; the list it sits in loaded late and must still be open.

- [ ] **Step 2: Run `npx playwright test e2e/gifts.spec.ts e2e/lists.spec.ts` and confirm the new tests fail.**

- [ ] **Step 3: Implement**
  - `MyGiftsList`: `Accordion type="multiple"`, controlled by recording the lists the user *closed*: `const [closed, setClosed] = useState<string[]>([])`, `value = listIds.filter(id => !closed.includes(id))`, and `onValueChange = open => setClosed(listIds.filter(id => !open.includes(id)))`. Lists that arrive late, and newly created lists, start open.
  - `FamilyGiftsList`: delete the inner per-list `Accordion`. Each list becomes a plain block: an `h4` list name, then the existing privacy line and count, then the rows.
  - `handleAddGiftItem`: after a successful `addGiftItem`, show `toast.success(formatMessage(tGifts.toasts?.added || 'Added to {{list}}', { list }))`, where the list name comes from `userLists` by `itemData.list_id`.
  - Remove the `expand(page, "Sam's wishlist")` and `expand(sam, "Sam's wishlist")` calls from `gifts.spec.ts`, and `expand(page, "Alex's wishlist")` from `comments.spec.ts`, because those triggers no longer exist. `expand` already does nothing on an open accordion.

- [ ] **Step 4: Run `npx playwright test` and confirm everything passes.**

- [ ] **Step 5: Update DESIGN.md "Gift Rows"/"Layout": lists are open by default, and a family member is one level deep. Commit:** `fix: lists open by default; adding a gift confirms the list`

### Task 5: Phone family rows: readable titles, no duplicate status

**Files:**
- Modify: `components/gift-item.tsx` (title around line 96, badges around line 150, quick actions)
- Modify: `components/claim-button.tsx:39-50`
- Modify: `e2e/gifts.spec.ts`

- [ ] **Step 1: Write the failing test** (at phone width; `test.use({ viewport: { width: 390, height: 844 } })` in its own `describe`)

```ts
test('a claimed gift shows its full name and one status', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await page.getByRole('button', { name: `${SEED.jordan.name}'s Gift Lists` }).click()
  const title = page.getByRole('button', { name: 'Board game: Wingspan' })
  expect(await title.evaluate(el => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight)).toBe(true)
  await expect(page.getByText(`Claimed by ${SEED.riley.name}`)).toBeVisible()
  await expect(page.getByText('Purchased', { exact: true })).toHaveCount(0)
})
```

- [ ] **Step 2: Run it and confirm it fails.**

- [ ] **Step 3: Implement**
  - The title uses `line-clamp-2` instead of `truncate`, on both the `h3` and its button.
  - The "Purchased"/"Complete" badge renders only when `isMyGift && item.is_public`. In the family view the claim chip and the gift-card button already say it.
  - The claim chip ("Claimed by …") gets `max-w-36 truncate` below md, with the full text in `title`.

- [ ] **Step 4: Run `npx playwright test e2e/gifts.spec.ts` and confirm it passes. Commit:** `fix: phone rows show full titles and a single claim status`

### Task 6: Gift drawer is a bottom sheet on phones, without repeats

**Files:**
- Create: `hooks/useIsDesktop.ts`
- Modify: `components/gift-item-drawer.tsx:136-180, 255-285`
- Modify: `e2e/gifts.spec.ts`

**Interfaces:**
- Produces: `useIsDesktop(): boolean`. It uses `useSyncExternalStore` over `matchMedia('(min-width: 768px)')` and returns `false` on the server.

- [ ] **Step 1: Write the failing test** (phone `describe`)

```ts
test('the gift drawer opens from the bottom on phones, without repeating the claim', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await page.getByRole('button', { name: `${SEED.jordan.name}'s Gift Lists` }).click()
  await page.getByRole('button', { name: 'Board game: Wingspan' }).click()
  const drawer = page.getByRole('dialog', { name: 'Board game: Wingspan' })
  await expect(drawer).toHaveAttribute('data-vaul-drawer-direction', 'bottom')
  await expect(drawer.getByText(`Purchased by ${SEED.riley.name}`)).toHaveCount(0)
  await expect(drawer.getByText(`Claimed by ${SEED.riley.name}`)).toBeVisible()
})
```

- [ ] **Step 2: Run it and confirm it fails. Then implement:**
  - `direction={isDesktop ? 'right' : 'bottom'}`;
  - on phones, the content is `max-h-[85vh]` with the 24px top radius (`rounded-t-3xl`);
  - remove the "Purchased by" badges (lines 255-285) wherever the footer `ClaimButton` shows the claim;
  - remove `line-through` from the drawer title.

- [ ] **Step 3: Run `npx playwright test` and confirm everything passes. Update DESIGN.md "Overlays". Commit:** `fix: gift drawer is a bottom sheet on phones`

### Task 7: Undo for releasing a claim and for archiving

**Files:**
- Modify: `components/family-gift-app.tsx` (`handleTogglePurchase` around line 166, `handleArchiveItem` around line 210)
- Modify: `components/claim-button.tsx:59` (delete the `title`)
- Modify: `dictionaries/{en,ru}/common.json` (`undo`: "Undo"), `dictionaries/{en,ru}/gifts.json` (`toasts.archived`: 'Archived "{{name}}"', `toasts.unarchived`: 'Restored "{{name}}"'), and delete `claim.releaseHint`
- Modify: `e2e/gifts.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test('releasing a claim can be undone', async ({ page }) => {
  await signInAs(page, SEED.riley.email)
  await openSkillet(page)
  await page.getByRole('button', { name: 'I’ll get this' }).click()
  await page.getByRole('button', { name: 'You’re getting this' }).click()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('button', { name: 'You’re getting this' })).toBeVisible()
  await page.getByRole('button', { name: 'You’re getting this' }).click() // cleanup
})

test('archiving can be undone', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const knife = SEED_GIFTS.chefsKnife.name
  await myGiftRow(page, knife).getByRole('button', { name: 'Archive item' }).click()
  await expect(page.getByText(`Archived "${knife}"`)).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(myGiftRow(page, knife).getByRole('button', { name: 'Archive item' })).toBeVisible()
})

test('undoing a release after someone else claimed it says so', async ({ page }) => {
  await signInAs(page, SEED.riley.email)
  await openSkillet(page)
  await page.getByRole('button', { name: 'I’ll get this' }).click()
  await page.getByRole('button', { name: 'You’re getting this' }).click()
  await page.route('**/api/gift-items*', route =>
    route.request().method() === 'PUT' ? route.fulfill({ status: 403, json: {} }) : route.fallback())
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('Someone else already claimed this')).toBeVisible()
})
```

- [ ] **Step 2: Run them and confirm they fail. Then implement:**
  - The release toast gets `{ action: { label: t.undo || 'Undo', onClick: () => handleTogglePurchase(itemId, null) } }`. That goes through the same handler, so a 403 shows "Someone else already claimed this".
  - `handleArchiveItem` shows `toast(archived|unarchived, { action: { label: 'Undo', onClick: () => handleArchiveItem(itemId) } })`.

- [ ] **Step 3: Run `npx playwright test e2e/gifts.spec.ts` and confirm it passes. Commit:** `feat: undo for releasing a claim and archiving`

### Task 8: The open tab lives in the URL

**Files:**
- Modify: `components/family-gift-app.tsx:47` and the `Tabs` props
- Create: `e2e/tabs.spec.ts`

Read `node_modules/next/dist/docs/01-app` on `useSearchParams`/`useRouter` first. Next 16 may differ from what you know, including whether a `Suspense` boundary is required.

- [ ] **Step 1: Write the failing tests**

```ts
test('the tab survives a reload and can be linked to', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.getByRole('tab', { name: /Suggestions/ }).click()
  await expect(page).toHaveURL(/\?tab=suggestions$/)
  await page.reload()
  await expect(page.getByRole('tab', { name: /Suggestions/ })).toHaveAttribute('aria-selected', 'true')
  await page.goto('/en?tab=family-lists')
  await expect(page.getByRole('tab', { name: 'Family Lists' })).toHaveAttribute('aria-selected', 'true')
})
test('an unknown tab falls back to my list', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.goto('/en?tab=nope')
  await expect(page.getByRole('tab', { name: 'My Gift List' })).toHaveAttribute('aria-selected', 'true')
})
```

- [ ] **Step 2: Run them and confirm they fail. Then implement.** Tabs are `'my-list' | 'family-lists' | 'suggestions'`. Anything else (or nothing) means `'my-list'`. Changing tab calls `router.replace('?tab=…', { scroll: false })`. `my-list` removes the parameter.

- [ ] **Step 3: Run `npx playwright test e2e/tabs.spec.ts` and confirm it passes. Commit:** `feat: keep the open tab in the URL`

### Task 9: First run and repeated chrome

**Files:**
- Modify: `components/family-gift-app.tsx:100-112` (default list), `:436-443` (greeting), `:446-458` (tabs), `:461-481` and `:497-507` (tab headings)
- Modify: `components/suggestions-view.tsx` (heading count)
- Modify: `dictionaries/{en,ru}/lists.json` (`defaultName`: "{{name}}'s list", `defaultNameNoName`: "My list"), `dictionaries/{en,ru}/common.json` (delete `welcomeBack`), `dictionaries/{en,ru}/gifts.json` (delete `myGifts.title`, `myGifts.description`, `familyGifts.title`, `familyGifts.description` if nothing else reads them)
- Modify: `e2e/lists.spec.ts:29`

- [ ] **Step 1: Write the failing test.** In `lists.spec.ts` replace the description assertion with `expect(JSON.parse(created[0])).toMatchObject({ name: `${SEED.jordan.name}'s list`, description: null })`. Add to `tabs.spec.ts`:

```ts
test('the greeting and tabs don’t repeat themselves', async ({ page }) => {
  await signInAs(page, SEED.jordan.email) // has one pending suggestion
  await expect(page.getByText('Welcome back')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'My Gift Ideas' })).toHaveCount(0)
  await page.getByRole('tab', { name: /Suggestions/ }).click()
  await expect(page.getByText('1', { exact: true })).toHaveCount(2) // tab badge + Incoming badge only
})
```

- [ ] **Step 2: Run `npx playwright test e2e/lists.spec.ts e2e/tabs.spec.ts` and confirm they fail.**

- [ ] **Step 3: Implement**
  - The default list is `{ name: formatMessage(tLists.defaultName, { name: currentUser.name }) or defaultNameNoName, description: null }`.
  - Delete the "Welcome back" paragraph.
  - Delete the My Gift List and Family Lists `h2` rows and description paragraphs. Radix already labels each tab panel by its tab. Task 12 moves the list buttons that lived in that header row; until then, keep `<ListManagement>` above the add form, right-aligned.
  - Delete the count badge beside the "Gift Suggestions" heading.
  - `TabsList`: `flex w-full` instead of `grid grid-cols-3`. Triggers get `flex-auto`. Delete `truncate` on the suggestions label.
  - Check at 390px with a screenshot that "Suggestions 1" fits.

- [ ] **Step 4: Run `npx playwright test` and confirm everything passes. Commit:** `fix: first-run list name and less repeated chrome`

### Task 10: A real header row

**Files:**
- Modify: `app/[lang]/layout.tsx:56-62`, `components/user-menu-wrapper.tsx:42`, `components/locale-switcher.tsx` (delete the flags)
- Create or modify: `e2e/tabs.spec.ts`

- [ ] **Step 1: Write the failing test** (phone viewport)

```ts
test('header controls sit above the greeting', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  const header = await page.getByRole('banner').boundingBox()
  const greeting = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(header!.y + header!.height).toBeLessThanOrEqual(greeting!.y)
})
```

- [ ] **Step 2: Run it and confirm it fails. Then implement.**
  - Wrap `LocaleSwitcher` and `UserMenuWrapper` in `<header className="relative z-50 mx-auto flex max-w-xl items-center justify-between px-4 py-3 md:px-0">`, in normal flow.
  - Delete the `absolute`/`fixed` positioning from both.
  - Pages under it lose any top offset that only made room for the old absolute controls. Check `/en`, `/en/profile`, `/en/add` and `/en/auth/signin` with phone and desktop screenshots, and confirm the avatar no longer overlaps the profile card.

- [ ] **Step 3: Run `npx playwright test` and confirm everything passes. Update DESIGN.md "Navigation". Commit:** `fix: header is one row aligned with the content column`

### Task 11: Saving list privacy never fails silently

**Files:**
- Modify: `components/family-gift-app.tsx:254-345` (`handleCreateList`, `handleUpdateList`)
- Modify: `components/list-management.tsx:45-47, 100-106, 180-187`
- Modify: `dictionaries/{en,ru}/lists.json` (`toasts.permissionsFailed`: "Couldn’t save who can see this list. Try again.", `toasts.created`: "List created", `toasts.saved`: "List saved")
- Create: `e2e/list-privacy.spec.ts`

**Interfaces:**
- Produces: `onCreateList: (data: NewListData) => Promise<boolean>` and `onUpdateList: (id, fields, permissions) => Promise<boolean>`. They return `true` only when the list *and* its permissions saved. `ListManagement` closes and resets the dialog only on `true`.

- [ ] **Step 1: Write the failing test**

```ts
test('a failed privacy save says so and keeps the dialog open', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.route('**/api/lists/*/permissions', route =>
    route.request().method() === 'PUT' ? route.fulfill({ status: 500, json: {} }) : route.fallback())
  // Before Task 12: Manage Lists → edit. After Task 12: the list's own edit button.
  await page.getByRole('button', { name: 'Manage Lists' }).click()
  await page.getByRole('button', { name: /Edit/ }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Hidden from specific members').check()
  await dialog.getByLabel(SEED.sam.name).check()
  await dialog.getByRole('button', { name: 'Update List' }).click()
  await expect(page.getByText('Couldn’t save who can see this list. Try again.')).toBeVisible()
  await expect(dialog).toBeVisible()
})
```

- [ ] **Step 2: Run it and confirm it fails. Then implement:**
  - check `response.ok` on both permissions PUTs;
  - on failure, show `toast.error(permissionsFailed)` and return `false`;
  - on success, show `toast.success(created|saved)` and return `true`.

- [ ] **Step 3: Run `npx playwright test e2e/list-privacy.spec.ts` and confirm it passes. Commit:** `fix: list privacy saves report failure and success`

### Task 12: Edit a list from the list itself

**Files:**
- Modify: `components/list-management.tsx` (delete the Manage dialog at lines 199-275, make the edit dialog controlled, add Delete to it, make create a text button)
- Modify: `components/my-gifts-list.tsx` (an edit button per list header), `components/family-gift-app.tsx` (state, placement)
- Modify: `dictionaries/{en,ru}/lists.json` (`editList`: "Edit {{name}}", `newList`: "New list", `deleteList`: "Delete list"). Delete the `management.*` keys and the `listItem.badges` "Tracked/Surprise" keys if nothing else reads them.
- Modify: `e2e/list-privacy.spec.ts`

**Interfaces:**
- Consumes: the Task 11 `Promise<boolean>` handlers.
- Produces: `ListManagement` props `editingListId: string | null` and `onEditingListIdChange(id: string | null): void` (new); the gear trigger is deleted. `MyGiftsList` gets an `onEditList(listId: string): void` prop.

- [ ] **Step 1: Change the Task 11 test to open the dialog with `page.getByRole('button', { name: "Edit Alex's wishlist" })`, then add:**

```ts
test('lists are created and edited where they are shown', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await expect(page.getByRole('button', { name: 'Manage Lists' })).toHaveCount(0)
  await page.getByRole('button', { name: "Edit Alex's wishlist" }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Delete list' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'New list' }).click()
  await expect(page.getByRole('dialog', { name: 'Create New List' })).toBeVisible()
})
```

- [ ] **Step 2: Run it and confirm it fails. Then implement:**
  - Each `AccordionItem` in `MyGiftsList` gets a `flex items-start` wrapper holding the `AccordionTrigger` (`flex-1`) and a ghost icon button (`Pencil`, `aria-label` = `editList`). Never nest the button inside the trigger.
  - The "New list" button is `variant="outline" size="sm"` with a `Plus` icon, below the lists.
  - The edit dialog footer gets "Delete list" (`variant="outline"`, destructive text) on the left, calling `onDeleteList`. It closes on success.

- [ ] **Step 3: Run `npx playwright test` and confirm everything passes. Update DESIGN.md "Navigation"/"Gift Rows". Commit:** `feat: edit and create lists in place`

### Task 13: Group gifts: one clear way in

**Decision to confirm with the user before starting.** The default below is a copy and labelling change. It doesn't add a pledge model. Pledges stay in comments, which Task 1 now hides from the owner.

**Files:**
- Modify: `components/claim-button.tsx` (`isGroupGift?: boolean` prop), `components/gift-item.tsx`, `components/gift-item-drawer.tsx` (pass it), `components/group-gift-interest.tsx`
- Modify: `dictionaries/{en,ru}/gifts.json`:
  - `claim.organize`: "I’ll organize it"
  - `claim.organizing`: "You’re organizing this"
  - `claim.organizedBy`: "Organized by {{name}}"
  - the interest button: "I’m in" / pressed "You’re in"
  - the count: "{{count}} people are in"
- Modify: `e2e/gifts.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('a group gift offers “I’m in” and “I’ll organize it”', async ({ page }) => {
  await signInAs(page, SEED.riley.email)
  await page.getByRole('tab', { name: 'Family Lists' }).click()
  await page.getByRole('button', { name: `${SEED.alex.name}'s Gift Lists` }).click()
  await page.getByRole('button', { name: SEED_GIFTS.twoPersonTent.name }).click()
  const drawer = page.getByRole('dialog', { name: SEED_GIFTS.twoPersonTent.name })
  await expect(drawer.getByRole('button', { name: 'I’m in' })).toBeVisible()
  await expect(drawer.getByRole('button', { name: 'I’ll organize it' })).toBeVisible()
  await expect(drawer.getByText('2 people are in')).toBeVisible()
})
```

- [ ] **Step 2: Run it and confirm it fails. Implement the labels. Run it again and confirm it passes. Commit:** `fix: clearer group gift actions`

### Task 14: Lighter add form

**Files:**
- Modify: `components/add-gift-form.tsx` (description and image fields, around lines 280-320)
- Modify: `dictionaries/{en,ru}/gifts.json` (`addForm.quick.moreDetails`: "More details")
- Modify: `e2e/gifts.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('description and image wait behind “More details”', async ({ page }) => {
  await page.getByPlaceholder('Paste a link or type a gift').fill('Anything')
  await expect(page.getByLabel(/Image URL/)).toBeHidden()
  await page.getByText('More details').click()
  await expect(page.getByLabel(/Image URL/)).toBeVisible()
  await expect(page.getByLabel(/Description/)).toBeVisible()
})
```

- [ ] **Step 2: Run it and confirm it fails. Then implement.** Wrap Description and Image URL in a native `<details>`; its `<summary>` is "More details", styled as a muted text button with a 44px minimum height on phones. Pass it the `open` attribute when either field already has a value.

- [ ] **Step 3: Run it again and confirm it passes. Commit:** `fix: add form keeps optional details folded`

### Task 15: Suggestions match the rest of the app

**Files:**
- Modify: `components/suggest-gift-dialog.tsx` (delete placeholders that repeat labels), `components/suggestions-view.tsx` (delete the "Pending" badge on pending cards, make "Add to List" `variant="default"` instead of the success fill)
- Modify: `e2e/gifts.spec.ts` (or a new `e2e/suggestions.spec.ts`)

- [ ] **Step 1: Write the failing test**

```ts
test('a pending suggestion shows a formatted price and no repeated status', async ({ page }) => {
  await signInAs(page, SEED.jordan.email)
  await page.getByRole('tab', { name: /Suggestions/ }).click()
  await expect(page.getByText('$199.00')).toBeVisible()
  await expect(page.getByText('Pending', { exact: true })).toHaveCount(0)
})
```

- [ ] **Step 2: Run it and confirm it fails.** The price part passes after Task 2; the badge part fails. **Implement, then run it and confirm it passes. Commit:** `fix: tidy suggestion dialog and cards`

### Task 16: Theme follows the device by default

**Files:**
- Modify: `app/[lang]/layout.tsx:49-58` (`enableSystem`, `defaultTheme="system"`), `components/user-menu.tsx:35-40` (add `['system', t.theme?.system || 'Match my device']` first)
- Modify: `dictionaries/{en,ru}/common.json` (`theme.system`)
- Modify: `e2e/theme.spec.ts:19-23, 35-38`, `e2e/theme-picker.spec.ts:25` (add the ru label for "Match my device" to the translated-labels loop)

- [ ] **Step 1: Replace `defaults to light` with**

```ts
for (const scheme of ['light', 'dark'] as const) {
  test(`with no choice saved, follows a ${scheme} device`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await openWithTheme(page, null)
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
  })
}
```

Update `an unknown stored theme renders as light` to whatever next-themes does with `enableSystem` (confirm by running it). It must still render a valid theme.

- [ ] **Step 2: Run `npx playwright test e2e/theme.spec.ts e2e/theme-picker.spec.ts` and confirm it fails. Implement, then run it again and confirm it passes. Update DESIGN.md Overview ("Four themes"). Commit:** `feat: theme follows the device by default`

### Task 17: Available gifts first

**Files:**
- Modify: `components/family-gifts-list.tsx` (where items are grouped per list)

- [ ] **Step 1: Implement:** inside each list, stable-sort items so open ones come first. An item is taken when `purchased_by` is set, or it's a gift card that has reached its target. `Array.prototype.sort` is stable. No test: it's one line, and Task 5's row tests cover rendering.
- [ ] **Step 2: Run `npx playwright test e2e/gifts.spec.ts` and confirm it passes. Commit:** `fix: show open gifts before claimed ones`

### Task 18: Sign-in polish

**Files:**
- Modify: `components/login-form.tsx` (button, headline, forgot link, photo `hidden md:block`)
- Modify: `dictionaries/{en,ru}/auth.json`:
  - button: "Sign in"
  - headline: "Sign in to Meep"
  - delete the "Login to your Meep Giftlist account" subtitle
  - `forgotPassword`: "Forgot your password? Email me a sign-in link"
- Modify: `e2e/fixtures.ts:39` (`name: 'Sign in'`), plus any `'Login'` in `e2e/auth.spec.ts` and `e2e/real-auth.spec.ts`

- [ ] **Step 1: Write the failing test** in `e2e/auth.spec.ts`

```ts
test('forgot password switches to the sign-in link', async ({ page }) => {
  await page.goto('/en/auth/signin')
  await page.getByRole('button', { name: 'Forgot your password? Email me a sign-in link' }).click()
  await expect(page.getByRole('tab', { name: 'Magic Link' })).toHaveAttribute('aria-selected', 'true')
})
```

- [ ] **Step 2: Run it and confirm it fails. Then implement:** the forgot link is a `variant="link"` button under the password field that selects the Magic Link tab and keeps the typed email.
- [ ] **Step 3: Run `npx playwright test` and confirm everything passes. Commit:** `fix: sign-in copy, forgot-password path, no photo on phones`

### Task 19: Row and page polish

**Files:**
- Modify: `components/my-gifts-list.tsx`:
  - delete the "Created" span (around lines 108-112);
  - put the archived section in `<details>`, closed by default, with summary "Archived items ({{count}})".
- Modify: `components/gift-item.tsx`:
  - delete `disabled={isArchived}` on Edit;
  - rows without an image get a `size-12 rounded bg-muted` tile holding a `Gift` icon in `text-muted-foreground`.
- Modify: `components/gift-item-drawer.tsx` (comment delete is `text-muted-foreground hover:text-destructive`)
- Modify: `app/[lang]/profile/page.tsx` (bookmarklet card `hidden md:block`; title `font-medium`), and the auth page titles: `font-bold` → `font-medium` (`grep -rn font-bold app components`)
- Modify: `dictionaries/{en,ru}/gifts.json` (`myGifts.archivedSummary`), deleting `dates.created` if unused
- Modify: `e2e/gifts.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('archived gifts are folded away and still editable', async ({ page }) => {
  await signInAs(page, SEED.jordan.email) // seed: "Old phone case" is archived
  await expect(page.getByText('Old phone case', { exact: true })).toBeHidden()
  await page.getByText(/Archived items \(1\)/).click()
  await expect(myGiftRow(page, 'Old phone case').getByRole('button', { name: 'Edit' })).toBeEnabled()
})
```

- [ ] **Step 2: Run it and confirm it fails. Implement every item in the file list. Run `npx playwright test` and confirm everything passes.**
- [ ] **Step 3: Take phone and desktop screenshots of `/en` (all three tabs) and `/en/profile`. Check them against the findings checklist, tick the boxes in this file, and commit:** `fix: row and page polish`

### Task 20: Web app manifest and home-screen icon

**Files:**
- Create: `app/manifest.ts` (Next metadata route; read `node_modules/next/dist/docs/01-app` for the `MetadataRoute.Manifest` shape)
- Create: `app/apple-icon.tsx` (180×180 PNG via `ImageResponse` from `next/og`, drawn from the same shape as `app/icon.svg`)
- Modify: `e2e/auth.spec.ts`

Manifest values: `name: 'Meep Family Wishlist'`, `short_name: 'Meep'`, `start_url: '/'`, `display: 'standalone'`, `background_color: '#ffffff'`, `theme_color: '#7008e7'` (Brand Violet). Icons: `/icon.svg` (`sizes: 'any'`, `type: 'image/svg+xml'`). The share target is out of scope; it stays listed in TEARDOWN_PLAN.md.

- [ ] **Step 1: Write the failing test**

```ts
test('the app can be added to a home screen', async ({ page }) => {
  const manifest = await (await page.request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({ short_name: 'Meep', display: 'standalone' })
  expect((await page.request.get('/apple-icon')).headers()['content-type']).toContain('image/png')
})
```

Check the generated URLs in the Next docs (`/apple-icon` may carry a hash suffix; if so, read the `<link rel="apple-touch-icon">` href from `/en/auth/signin` instead).

- [ ] **Step 2: Run it and confirm it fails. Implement, then run it again and confirm it passes. Commit:** `feat: web app manifest and home-screen icon`
