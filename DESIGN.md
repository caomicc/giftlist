---
name: Meep Family Wishlist
description: Share gift ideas with your family and quietly coordinate who's getting what.
colors:
  primary: "oklch(54.1% 0.281 293.009)"
  primary-foreground: "oklch(0.969 0.016 293.756)"
  secondary: "oklch(87% 0.065 274.039)"
  secondary-foreground: "oklch(0.21 0.006 285.885)"
  success: "oklch(52.7% 0.154 150.069)"
  success-foreground: "oklch(0.985 0 0)"
  success-soft: "oklch(98.2% 0.018 155.826)"
  success-soft-foreground: "oklch(44.8% 0.119 151.328)"
  group-gift: "oklch(49.1% 0.27 292.581)"
  group-gift-soft: "oklch(96.9% 0.016 293.756)"
  suggestion: "oklch(55.5% 0.163 48.998)"
  suggestion-soft: "oklch(98.7% 0.022 95.277)"
  destructive: "oklch(0.577 0.245 27.325)"
  destructive-foreground: "oklch(0.985 0 0)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.141 0.005 285.823)"
  card: "oklch(1 0 0)"
  muted: "oklch(0.967 0.001 286.375)"
  muted-foreground: "oklch(0.552 0.016 285.938)"
  accent: "oklch(0.967 0.001 286.375)"
  border: "oklch(0.92 0.004 286.32)"
  backdrop-from: "oklch(93.6% 0.032 17.717)"
  backdrop-to: "oklch(81.1% 0.111 293.571)"
typography:
  headline:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.333
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.556
  item-title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.429
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.333
rounded:
  sm: "calc(0.65rem - 4px)"
  md: "calc(0.65rem - 2px)"
  lg: "0.65rem"
  xl: "calc(0.65rem + 4px)"
  sheet: "1.5rem"
  full: "9999px"
spacing:
  row-y: "12px"
  row-x: "8px"
  card-x-phone: "24px"
  card-x-desktop: "12px"
  card-y: "24px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  claim-open:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    height: "32px"
  claim-mine:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
    rounded: "{rounded.md}"
    height: "32px"
  claim-others:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  badge-purchased:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-soft-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  list-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "24px 12px"
  list-card-phone:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.sheet}"
    padding: "24px"
---

# Design System: Meep Family Wishlist

## Overview

**Creative North Star: "The Quiet Coordinator"**

A private family utility that sits on a warm red-to-violet wash and keeps the real work on one white card. The system is shadcn/ui on Radix, re-pointed at a single token set: violet is the brand, and every gifting state (claimed, group gift, suggestion, destructive) has its own semantic colour pair so state reads at a glance without the interface getting loud. The name comes from the app's own metadata line, "quietly coordinate who's getting what": the design's job is to let relatives claim, contribute and suggest without spoiling the surprise.

Density is app-like and calm. Lists are rows, not tiles: a small thumbnail, a medium-weight title, a wrap of small outlined badges, and one action on the right. Desktop is a centred narrow column (max 36rem) inside a card; on phones that card becomes a bottom sheet with a 24px top radius that runs to the bottom of the screen. Controls grow to 44px on phones and stay at their compact shadcn sizes on desktop.

Feedback is non-modal by default. Successes and failures arrive as toasts at the bottom centre; only destructive actions interrupt, and they use an in-app alert dialog. Privacy is stated inline in plain words with an eye or crossed-eye icon, never hidden behind a tooltip.

**Key Characteristics:**
- One token set in `styles/tailwind.css`; components use semantic token utilities, not palette steps.
- Violet primary, periwinkle secondary, green for "claimed / purchased / complete", amber for suggestions, deep violet for group gifts.
- White card on a diagonal red-100 to violet-300 page gradient.
- Geist Sans at medium weight for every heading; small (14px) body and 12px labels.
- Phone-first ergonomics: 44px controls below 768px, bottom-sheet card, owner actions moved into a drawer.
- Light only in practice: a `.dark` set exists but nothing applies the `.dark` class yet.

## Colors

A restrained neutral zinc base carrying one violet brand voice, with three small, purpose-bound state hues.

### Primary
- **Brand Violet** (primary): the default button fill, focus ring colour, text-selection tint (22% mix) and text caret. It is the colour of "do the main thing" and of keyboard focus.

### Secondary
- **Soft Periwinkle** (secondary): the resting fill of the buyer's "I'll get this" claim button, gift-card badges and other secondary buttons. Quieter than violet, so a list full of unclaimed gifts doesn't shout.

### Tertiary (state colours)
- **Claimed Green** (success / success-foreground): the "You're getting this" claim state and the completed gift-card button. Solid fill, white text.
- **Mint Wash** (success-soft / success-soft-foreground): the "Purchased" and "Complete" badges. Pale fill, deep green text.
- **Group Violet** (group-gift, group-gift-soft): group-gift badges (violet text, 40% violet outline) and group-gift accents. Same family as the brand, one step deeper.
- **Suggestion Amber** (suggestion, suggestion-soft): "Suggested by" badges and suggestion actions (amber text, 40% amber outline, soft amber hover).
- **Alert Red** (destructive): delete confirmations, error icons and error text, the pending-suggestions count.

### Neutral
- **Paper White** (background, card): page surfaces inside the card, inputs, dialogs.
- **Ink** (foreground): all primary text.
- **Mist** (muted, accent): ghost/hover fills, the tabs track, the "Claimed by" chip, archived rows.
- **Slate Grey** (muted-foreground): descriptions, counts, privacy lines, placeholder text.
- **Hairline** (border): card borders at md+, input strokes, outline badges.
- **Blush to Lavender backdrop** (backdrop-from to backdrop-to): a bottom-right diagonal gradient on `body`, the only decorative colour in the app.

### Named Rules
**The Semantic-Only Rule.** Components never use raw Tailwind palette classes (`bg-green-600`, `text-violet-700`). A new state gets a new token pair in `styles/tailwind.css` (solid plus soft) and is consumed by name.

**The State Owns The Hue Rule.** Green means claimed, purchased or complete; amber means suggestion; deep violet means group gift; red means destructive or error. Don't reuse a state hue for decoration.

## Typography

**Display Font:** none (the app has no display tier)
**Body Font:** Geist Sans (with the system sans stack)

**Character:** One neutral grotesque at two weights. Hierarchy comes from size and medium weight, not from heavy bold.

### Hierarchy
- **Headline** (500, 1.5rem, tracking -0.025em): the page greeting ("Hi, {name}!").
- **Title** (500, 1.125rem): list names in the accordion headers.
- **Item title** (500, 1rem at md+, 0.875rem on phones): gift row titles, truncated to one line; the title itself is the button that opens the gift drawer.
- **Body** (400, 0.875rem): descriptions, form text, dialog copy. Inputs use 1rem on phones (prevents iOS zoom) and 0.875rem at md+.
- **Label** (500, 0.75rem): badges, the "Claimed by" chip, counts, and inline privacy lines.

Money uses `tabular-nums` in Geist Sans (gift-card purchase dialog). Geist Mono is loaded in the layout but not used by any surface.

### Named Rules
**The Medium Weight Rule.** App headings are medium (500), not bold. The greeting, list titles and section headers all use 500.

## Layout

A single centred column: the list card is `max-width: 36rem` within a `max-w-7xl` main area. The breakpoint that matters is md (768px); sm (640px) and lg (1024px) only adjust outer padding and top offset.

- **Phones (below 768px):** the card loses its border and shadow, takes a 24px top radius and sits flush to the screen edges as a bottom sheet; a fixed card-coloured fill (`bg-card`, bottom 50vh) behind it hides the gradient under short lists. Card padding is 24px horizontal. Buttons, inputs, selects and quick-add toggle items reach a 44px minimum; the tabs track grows to 44px (its triggers sit inside 3px padding, so about 37px).
- **Desktop (768px and up):** the card is fully rounded with a hairline border and a small shadow; horizontal padding tightens to 12px. Owner row actions (edit, archive, delete) appear inline as 32px ghost icon buttons.
- **Rhythm:** tab panels stack at 24px (`space-y-6`); rows are 12px vertical by 8px horizontal with 12px gaps; badges wrap with 4px gaps.
- **Overlays:** the gift detail uses a drawer (vaul) and all confirmations use a centred alert dialog.

## Elevation & Depth

Mostly flat, with shadcn's small ambient shadows. Depth comes from the white card lifting off the gradient, not from stacked shadows.

### Shadow Vocabulary
- **Control** (`shadow-xs`): buttons (except ghost/link), inputs, selects.
- **Card** (`shadow-sm`): the list card at md+ only; phones use no shadow.
- **Overlay** (`shadow-lg`): dialogs, drawers, popovers, as shipped by the shadcn primitives.

### Named Rules
**The Flat Phone Rule.** On phones the sheet card has no border and no shadow; edges and radius alone separate it from the backdrop.

## Shapes

Gently rounded, from one radius variable (`--radius: 0.65rem`, about 10px). Controls and badges use md (about 8px), the tabs track uses lg, the desktop card uses xl (about 14px), and the phone bottom sheet uses 24px on its top corners only with square bottom corners. Thumbnails are small 48px squares with a 4px radius. Pills (`rounded-full`) are reserved for avatars, switches and count badges.

## Components

### Buttons
Compact shadcn buttons, re-coloured by token.
- **Shape:** gently rounded (md radius).
- **Primary:** violet fill, near-white text, 36px tall (32px for sm), 16px horizontal padding; hover drops to 90% opacity.
- **Secondary:** periwinkle fill, dark text; hover 80%.
- **Destructive:** red fill, white text; used for the confirm action in delete dialogs.
- **Ghost / Outline / Link:** ghost for icon actions and quiet controls (Mist hover), outline for neutral secondary actions, link in violet with underline on hover.
- **Focus:** 3px ring in the ring colour at 50% plus a ring-coloured border.
- **Touch:** default, sm and icon sizes carry a 44px minimum below 768px (icon buttons are 44px square); desktop sizes don't change.

### Claim Button (signature)
The buyer's main action on someone else's gift, in three states:
- **Open:** secondary button with a cart icon, "I'll get this".
- **Mine:** success-green button with a check, "You're getting this", `aria-pressed="true"`; pressing again releases the claim.
- **Someone else's:** not a button. A static 32px Mist chip in label type with a check, "Claimed by {name}". Only the claimer can release it.
Gift cards replace the claim with an "Add amount" secondary button that turns success-green and disabled when the target is reached.

### Chips / Badges
- **Style:** 12px label type, md radius. State badges are outlined in the state hue at 40% with state-coloured text and icon (group gift, suggested by); "Purchased / Complete" is a solid mint wash; gift card uses the secondary fill; archived and comment counts are outlined grey.
- **Privacy:** a purchase badge is never shown to the owner of a surprise list.

### Cards / Containers
- **Corner Style:** xl on desktop; a 24px-top bottom sheet on phones.
- **Background:** card white on the gradient backdrop.
- **Shadow Strategy:** small shadow at md+, none on phones (see Elevation).
- **Border:** hairline at md+, none on phones.
- **Internal Padding:** 24px vertical; 24px horizontal on phones, 12px at md+.

### Gift Rows
Rows inside accordion lists: optional 48px thumbnail, item title as a button (opens the gift drawer), a wrap of badges, and the quick action on the right. Hover tints the row Mist at 50%. Purchased items (when the viewer may know) and archived items get a struck-through, muted title; archived rows also sit on Mist at 75% opacity. Owner actions are inline icon buttons at md+; on phones the row opens the drawer, where the same actions carry text labels.

### Inputs / Fields
- **Style:** transparent fill, hairline stroke, md radius, 36px tall (44px on phones), Slate Grey placeholder.
- **Focus:** ring-coloured border plus 3px ring at 50%; the caret is violet.
- **Error / Disabled:** `aria-invalid` turns the border red with a faint red ring; disabled is 50% opacity.

### Quick-Add Form (signature)
One field, "Paste a link or type a gift". Details (name, price, type, list) reveal as soon as the field has text; a pasted link fetches a preview and pre-fills the name. Type is a three-way segmented toggle group (Item / Gift card / Group gift) whose items are 44px on phones.

### Navigation
Three full-width tabs on a Mist track (My Gift List, Family Lists, Suggestions); the active tab turns white with a small shadow. A red count badge on Suggestions shows pending items. The locale switcher sits top-left and the user menu top-right, outside the card.

### Feedback
- **Toasts:** sonner at the bottom centre with rich colours and a close button, for save successes and failures ("Couldn't save that. Try again.", "Someone else already claimed this").
- **Confirm:** `useConfirm()` from `ConfirmProvider` opens an alert dialog with Cancel plus a destructive confirm (destructive by default).
- **Load error:** a single centred card (red alert icon, medium title, retry button), used only when the initial data load fails.

### Privacy Lines (signature)
Under each list title, a 12px Slate Grey line with an Eye icon ("You can see what's been bought") or an EyeOff icon ("Surprise: you won't see what's been bought"). On surprise lists, gift-card details show the owner only "Contributions are kept a surprise"; amounts and contributors aren't fetched. Visibility defaults to surprise when unknown.

## Do's and Don'ts

### Do:
- **Do** use semantic token utilities (`bg-primary`, `bg-success`, `text-suggestion`, `bg-success-soft`) and add a solid + soft token pair in `styles/tailwind.css` for any new state.
- **Do** give every icon-only button an `aria-label` (and a matching `title` on desktop icon actions); mark decorative icons `aria-hidden`.
- **Do** keep touch targets at 44px below 768px by putting `max-md:min-h-11` on the primitive, not on each call site.
- **Do** report mutation results through a sonner toast and leave the list on screen.
- **Do** ask for destructive confirmation with `useConfirm()`.
- **Do** state list privacy inline with Eye/EyeOff and plain words.
- **Do** keep app headings at medium weight (500).

### Don't:
- **Don't** use raw Tailwind palette classes (`text-green-700`, `bg-violet-50`) in components.
- **Don't** call `window.confirm` or `alert`.
- **Don't** set the app-level error screen from a failed mutation; it is for initial-load failure only.
- **Don't** reveal purchase status, purchaser names, contributed amounts or contributors to the owner of an `is_public = false` list. The API scrubs them (`lib/gift-privacy.ts`); the UI must not reconstruct or hint at them.
- **Don't** hide privacy or state explanations in tooltips.
- **Don't** reuse a state hue (green, amber, deep violet, red) for decoration.
