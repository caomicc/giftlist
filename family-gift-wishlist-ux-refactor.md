# Family Gift Wishlist App — UX Refactor Workflow

## Executive Summary

This document provides a comprehensive UX audit and redesign workflow for your family gift wishlist application. Based on current mobile UX best practices, the recommendations prioritize thumb-zone accessibility, reduced cognitive load, and progressive disclosure while maintaining technical compatibility with Next.js 15, Tailwind CSS, and shadcn/ui.

---

## Part 1: Current Pattern Audit

### 1.1 Nested Accordions Assessment

**Verdict: Replace nested accordions with alternative patterns.**

Nested accordions present several UX problems that make them unsuitable for this application:

**Cognitive Load Issues**
- Users must maintain mental models of multiple hierarchy levels
- Each expansion requires remembering context from parent levels
- Information architecture becomes opaque — users can't see the full structure

**Mobile-Specific Problems**
- Each accordion tap moves content vertically, disorienting users
- Nested structures increase tap depth (3+ taps to reach content)
- Small screens exacerbate the "lost in navigation" problem
- Scroll position shifts unpredictably with each expansion

**Accessibility Concerns**
- Screen readers must announce multiple nested levels
- Focus management becomes complex with nested collapsibles
- ARIA relationships (`aria-controls`, `aria-expanded`) multiply in complexity

**When Accordions ARE Appropriate**
- Single-level FAQs where scanning headers is the primary use case
- Settings panels with logical groupings
- Content users rarely need to see in full simultaneously

---

### 1.2 Touch Target Audit Checklist

Review all interactive elements against these minimum standards:

| Element Type | Minimum Size | Current Status |
|-------------|--------------|----------------|
| Buttons | 44×44px (iOS) / 48×48dp (Android) | [ ] Audit needed |
| Icon buttons | 44×44px touch area (icon can be smaller) | [ ] Audit needed |
| List item tap areas | Full row height, min 48px | [ ] Audit needed |
| Accordion headers | Full width, min 48px height | [ ] Audit needed |
| Checkbox/radio inputs | 44×44px touch area | [ ] Audit needed |
| Links in text | Add padding or convert to buttons | [ ] Audit needed |

**Spacing Requirements**
- Minimum 8px between adjacent interactive elements
- 16px recommended for destructive or important actions

---

## Part 2: Recommended Information Architecture

### 2.1 Navigation Structure: Bottom Tab Bar

Replace any hidden navigation with a persistent bottom tab bar containing 4 primary destinations:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Main Content Area]                │
│                                                 │
├─────────────────────────────────────────────────┤
│  🏠 Home   👥 Browse   ✓ Claimed   📋 My Lists │
└─────────────────────────────────────────────────┘
```

**Tab Definitions**

| Tab | Icon | Purpose | Primary Actions |
|-----|------|---------|-----------------|
| Home | House | Dashboard overview | Quick stats, recent activity, suggestions to review |
| Browse | People | Browse family wishlists | View members' lists you have access to |
| Claimed | Checkmark | Items you've claimed | Track what you're getting for others |
| My Lists | Clipboard | Your wishlists & settings | Manage multiple lists, visibility permissions |

**Design Specifications**
- Tab bar height: 56-64px (includes safe area padding on iOS)
- Icon size: 24×24px
- Label text: 10-12px
- Active state: Filled icon + color change + bolder label
- Touch target: Each tab spans full 1/4 width, full height

**Why Bottom Navigation**
- Thumb-zone optimized: Primary actions in natural thumb arc
- Always visible: No hunting for hamburger menus
- Instant context: Users always know where they are
- Proven pattern: Matches Instagram, Spotify, YouTube mental models

---

### 2.2 Browse Tab: Person → List → Items (Three-Level Drill-Down)

**Replace nested accordions with a drill-down navigation pattern:**

Since users can have multiple lists with different visibility permissions, we need three levels:

```
Level 1: Person Selector (who are you browsing?)
Level 2: List Selector (which of their lists? — only shows lists you can see)
Level 3: Flat list of items
```

**Browse Tab — Person Selection (Level 1)**

```
┌─────────────────────────────────────────────────┐
│ Browse Wishlists                           🔍   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 👤 Mom                                  │   │
│  │    3 lists · 12 items total         →  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 👤 Dad                                  │   │
│  │    2 lists · 8 items total          →  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 👤 Sarah                                │   │
│  │    1 list · 5 items total           →  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ... (scrollable list of family members)       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Browse Tab — List Selection (Level 2)**

After tapping a person, show their lists you have permission to view:

```
┌─────────────────────────────────────────────────┐
│ ← Mom's Lists                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🎄 Christmas 2024                       │   │
│  │    8 items · 2 claimed              →  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🎂 Birthday                             │   │
│  │    4 items · 0 claimed              →  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 📚 Books I Want                         │   │
│  │    6 items · 1 claimed              →  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Browse Tab — Item List (Level 3)**

```
┌─────────────────────────────────────────────────┐
│ ← Mom · Christmas 2024                     🔍   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🖼️  Kindle Paperwhite                   │   │
│  │     ~$140 · Amazon                      │   │
│  │     ░░░░░░░░░░ Claimed by you ✓         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🖼️  Wool Blanket                        │   │
│  │     ~$60 · Etsy                         │   │
│  │     Available                           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🖼️  Cooking Class Gift Card             │   │
│  │     ~$100 · Sur La Table               │   │
│  │     Claimed by Sarah                    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Alternative: Inline List Expansion (Fewer Taps)**

If most users have only 1-2 lists, consider an inline expansion pattern instead:

```
┌─────────────────────────────────────────────────┐
│ Browse Wishlists                           🔍   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ▼ Mom                                         │
│    ┌───────────────────────────────────────┐   │
│    │ 🎄 Christmas 2024 (8)             →  │   │
│    ├───────────────────────────────────────┤   │
│    │ 🎂 Birthday (4)                   →  │   │
│    └───────────────────────────────────────┘   │
│                                                 │
│  ▶ Dad (2 lists)                               │
│                                                 │
│  ▶ Sarah (1 list)                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

This is a **single-level accordion** (not nested) — tapping a person expands to show their lists inline, then tapping a list navigates to the items screen. This reduces tap depth while keeping the hierarchy clear.

**Recommendation**: Use the inline expansion for Browse tab since it's only one level of accordion (person → lists visible), with the actual items on a separate screen.

---

### 2.3 My Lists Tab: Managing Your Own Lists

**My Lists Overview**

```
┌─────────────────────────────────────────────────┐
│ My Lists                                   ⚙️   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🎄 Christmas 2024                   ✏️  │   │
│  │    8 items                              │   │
│  │    👁️ Visible to: Everyone except me    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🎂 My Birthday                      ✏️  │   │
│  │    4 items                              │   │
│  │    👁️ Visible to: Family only           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🤫 Secret Santa for Dad             ✏️  │   │
│  │    2 items                              │   │
│  │    👁️ Visible to: Only Mom, Sarah       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│    + Create New List                           │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**List Visibility Settings (Bottom Sheet)**

When creating or editing a list, visibility is set via bottom sheet:

```
┌─────────────────────────────────────────────────┐
│ ─────                                           │
│                                                 │
│ Who can see this list?                          │
│                                                 │
│ ○ Everyone (except me)                          │
│   Standard wishlist — you won't see claims      │
│                                                 │
│ ○ Everyone (including me)                       │
│   You'll see who claimed what                   │
│                                                 │
│ ○ Only specific people                          │
│   ┌─────────────────────────────────────────┐  │
│   │ ☑️ Mom        ☑️ Dad        ☐ Sarah     │  │
│   │ ☐ Tom        ☐ Amy        ☐ Jake      │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│ ○ Hidden from specific people                   │
│   ┌─────────────────────────────────────────┐  │
│   │ ☐ Mom        ☑️ Dad        ☐ Sarah     │  │
│   │ (List visible to everyone except Dad)   │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │              Save Visibility                │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 2.4 Item Card Design

**Scannable Card Layout**

```
┌──────────────────────────────────────────────────────┐
│ ┌────────┐                                           │
│ │        │  Item Title (truncate at 2 lines)         │
│ │  IMG   │  Price · Store                            │
│ │ 64×64  │  [Status Badge]                           │
│ └────────┘                                           │
└──────────────────────────────────────────────────────┘
```

**Visual Hierarchy**
1. **Item thumbnail**: 64×64px, rounded corners, placeholder on load
2. **Title**: 16px, font-weight 500, max 2 lines with ellipsis
3. **Meta line**: 14px, muted color, price + store
4. **Status badge**: Small pill indicating availability

**Status States**
| Status | Visual Treatment | Visible To |
|--------|------------------|------------|
| Available | Green "Available" or no badge | Everyone |
| Claimed | Yellow "Claimed" or "Claimed by [Name]" | All except list owner (recipient) |
| Suggested | Blue "Suggested for you" | List owner only |

---

## Part 3: Interaction Pattern Recommendations

### 3.1 Claim Item: Swipe-to-Reveal

**Primary Pattern: Swipe left to reveal action**

```
Normal state:
┌─────────────────────────────────────────┐
│ 🖼️  Kindle Paperwhite                   │
│     ~$140 · Amazon                      │
└─────────────────────────────────────────┘

After swipe left:
┌──────────────────────────────┬──────────┐
│ 🖼️  Kindle Paperwhite        │    ✓     │
│     ~$140 · Amazon           │  CLAIM   │
└──────────────────────────────┴──────────┘
```

**Implementation Details**
- Swipe threshold: 80px to reveal, 160px for full swipe
- Action button: 80px wide, full item height
- Color: Green background for "Claim"
- Haptic feedback on action trigger
- Undo toast appears for 5 seconds after action

**Fallback: Visible Button**
For users unfamiliar with swipe gestures, provide a secondary path:
1. Tap item to expand inline detail view
2. Explicit "Claim This" button in expanded state

**Accessibility**
- Provide context menu (long-press) with same actions
- Screen reader: "Swipe left for actions" hint
- Keyboard: Enter to expand, then tab to action buttons

---

### 3.2 Suggestion Approval/Denial: Inline Actions

**Pattern: Tinder-style inline actions for suggestions**

```
┌─────────────────────────────────────────────────┐
│ 💡 Suggested by: Sarah                          │
├─────────────────────────────────────────────────┤
│ 🖼️  Noise-Canceling Headphones                  │
│     ~$250 · Best Buy                           │
│     "Dad mentioned wanting these for flights"   │
│                                                 │
│    ┌─────────────┐      ┌─────────────┐        │
│    │   ✕ Skip    │      │  ✓ Add to   │        │
│    │             │      │  My List    │        │
│    └─────────────┘      └─────────────┘        │
└─────────────────────────────────────────────────┘
```

**Design Specifications**
- Button height: 48px minimum
- Button width: ~40% of container each
- Skip: Secondary/outline style
- Add: Primary filled style
- No confirmation dialog needed (provide undo)

**After Action**
- Card animates out (slide + fade)
- Success toast: "Added to your wishlist" / "Suggestion skipped"
- Undo available for 5 seconds

---

### 3.3 Adding New Items: Bottom Sheet

**Trigger: Floating Action Button (FAB)**

```
                                    ┌─────┐
                                    │  +  │
                                    └─────┘
```

**FAB Specifications**
- Position: Bottom right, 16px from edges, above tab bar
- Size: 56×56px
- Always visible on "My Wishlist" screen
- Hide when scrolling down, reveal when scrolling up

**Add Item Bottom Sheet**

```
┌─────────────────────────────────────────────────┐
│ ─────                                           │
│                                                 │
│ Add to Wishlist                                 │
│                                                 │
│ [Add to which list?]                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🎄 Christmas 2024                        ▼  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔗 Paste a link                              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Item name]                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Price (optional)]      [Store (optional)]      │
│ ┌──────────────────┐   ┌──────────────────────┐ │
│ │ $                │   │                      │ │
│ └──────────────────┘   └──────────────────────┘ │
│                                                 │
│ [Notes for family]                              │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │                 Add Item                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 3.4 Claimed Tab: Tracking Your Claims

The Claimed tab shows all items you've claimed across all family members' lists, grouped by recipient:

```
┌─────────────────────────────────────────────────┐
│ Claimed Items                              ⚙️   │
├─────────────────────────────────────────────────┤
│                                                 │
│  For Mom (3 items)                              │
│  ┌─────────────────────────────────────────┐   │
│  │ 🖼️  Kindle Paperwhite                   │   │
│  │     ~$140 · Amazon                      │   │
│  │     from: Christmas 2024                │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 🖼️  Wool Blanket                        │   │
│  │     ~$60 · Etsy                         │   │
│  │     from: Birthday                      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  For Dad (1 item)                               │
│  ┌─────────────────────────────────────────┐   │
│  │ 🖼️  Noise-Canceling Headphones          │   │
│  │     ~$250 · Best Buy                    │   │
│  │     from: Christmas 2024                │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  No items claimed yet?                         │
│  Browse family lists to claim gifts →          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Swipe Actions on Claimed Tab**
- Swipe left to **Unclaim** an item (returns it to available)
- Provides quick way to manage what you're getting

**Empty State**
When no items are claimed, show a helpful prompt directing to the Browse tab.

---

## Part 4: Mobile Layout Specifications

### 4.1 Spacing System

Use a consistent 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing, icon-to-text |
| `space-2` | 8px | Related elements |
| `space-3` | 12px | Card internal padding |
| `space-4` | 16px | Section gaps, card margins |
| `space-5` | 20px | Major section dividers |
| `space-6` | 24px | Screen edge padding |

**Tailwind Classes**
```css
/* Recommended spacing scale */
gap-1 /* 4px */
gap-2 /* 8px */
p-3   /* 12px */
mx-4  /* 16px */
my-5  /* 20px */
px-6  /* 24px */
```

---

### 4.2 Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Screen title | 24px | 600 | 1.2 |
| Section header | 18px | 600 | 1.3 |
| Card title | 16px | 500 | 1.4 |
| Body text | 14px | 400 | 1.5 |
| Caption/meta | 12px | 400 | 1.4 |
| Badge text | 11px | 500 | 1.0 |

**Tailwind Classes**
```css
text-2xl font-semibold leading-tight   /* Screen title */
text-lg font-semibold                   /* Section header */
text-base font-medium                   /* Card title */
text-sm                                 /* Body */
text-xs text-muted-foreground          /* Caption */
```

---

### 4.3 Touch Target Implementation

**Button Minimum Sizes**

```tsx
// Primary action button
<Button className="min-h-[48px] px-6">
  Add to Wishlist
</Button>

// Icon button with adequate touch target
<Button variant="ghost" size="icon" className="h-11 w-11">
  <MoreVertical className="h-5 w-5" />
</Button>

// List item as touch target
<div className="min-h-[64px] py-3 px-4 active:bg-accent">
  {/* Card content */}
</div>
```

**shadcn/ui Customizations**

```tsx
// In your tailwind.config or component overrides
const buttonVariants = cva(
  "min-h-[44px] ...", // Add minimum height
  // ... rest of variants
)
```

---

## Part 5: Component Migration Guide

### 5.1 From Nested Accordions to Flat Lists

**Before (Anti-pattern)**
```tsx
// ❌ Nested accordions
<Accordion>
  <AccordionItem value="mom">
    <AccordionTrigger>Mom's Wishlist</AccordionTrigger>
    <AccordionContent>
      <Accordion>
        <AccordionItem value="category-1">
          <AccordionTrigger>Electronics</AccordionTrigger>
          <AccordionContent>
            {/* Items */}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**After (Recommended): Single-Level Accordion + Drill-Down**
```tsx
// ✅ Browse page with single-level person expansion
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export function BrowseWishlists({ familyMembers }: { familyMembers: FamilyMember[] }) {
  const router = useRouter();
  
  return (
    <Accordion type="multiple" className="space-y-2 px-4">
      {familyMembers.map(member => (
        <AccordionItem key={member.id} value={member.id} className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 min-h-[56px]">
            <div className="flex items-center gap-3">
              <span className="text-base font-medium">{member.name}</span>
              <span className="text-sm text-muted-foreground">
                {member.lists.length} {member.lists.length === 1 ? 'list' : 'lists'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="space-y-1">
              {member.lists.map(list => (
                <button
                  key={list.id}
                  onClick={() => router.push(`/browse/${member.id}/${list.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 
                             hover:bg-muted rounded-md min-h-[48px] text-left"
                >
                  <div>
                    <span className="font-medium">{list.icon} {list.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {list.itemCount} items · {list.claimedCount} claimed
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

---

### 5.2 Family Member Row Component

```tsx
// components/family-member-row.tsx
interface FamilyMemberRowProps {
  member: FamilyMember;
  onClick: () => void;
}

export function FamilyMemberRow({ member, onClick }: FamilyMemberRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between",
        "px-4 py-4 rounded-lg border bg-card",
        "min-h-[64px] text-left",
        "hover:bg-accent transition-colors"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-lg">{member.name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-muted-foreground">
            {member.listCount} {member.listCount === 1 ? 'list' : 'lists'} · {member.totalItems} items
          </p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
```

---

### 5.3 Swipeable Item Card

```tsx
// components/wishlist-item-card.tsx
"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface WishlistItemCardProps {
  item: WishlistItem;
  onClaim: (id: string) => void;
  onUnclaim?: (id: string) => void;
  showStatus?: boolean;
  isOwnList?: boolean; // If viewing your own list, no swipe actions
}

export function WishlistItemCard({
  item,
  onClaim,
  onUnclaim,
  showStatus = true,
  isOwnList = false,
}: WishlistItemCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = useRef(0);
  const ACTION_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOwnList) return;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isOwnList) return;
    const diff = startX.current - e.touches[0].clientX;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 160));
    }
  };

  const handleTouchEnd = () => {
    if (isOwnList) return;
    if (swipeOffset > ACTION_THRESHOLD) {
      if (item.claimedByMe) {
        onUnclaim?.(item.id);
      } else {
        onClaim(item.id);
      }
    }
    setSwipeOffset(0);
  };

  const swipeActionLabel = item.claimedByMe ? "Unclaim" : "Claim";
  const swipeActionColor = item.claimedByMe ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action revealed on swipe */}
      {!isOwnList && (
        <div 
          className={cn(
            "absolute inset-y-0 right-0 w-20",
            "flex items-center justify-center",
            "text-white font-medium",
            swipeActionColor
          )}
        >
          {item.claimedByMe ? "✕" : "✓"} {swipeActionLabel}
        </div>
      )}

      {/* Card content */}
      <div
        className={cn(
          "relative bg-card border rounded-lg p-3",
          "flex gap-3 items-start",
          "transition-transform duration-150 ease-out",
          "active:bg-accent"
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
          {item.imageUrl && (
            <img 
              src={item.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base line-clamp-2">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {item.price && `~$${item.price}`}
            {item.price && item.store && " · "}
            {item.store}
          </p>
          {showStatus && item.status !== 'available' && (
            <StatusBadge status={item.status} claimedBy={item.claimedBy} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Part 6: Accessibility Requirements

### 6.1 ARIA Implementation

**Bottom Tab Bar**
```tsx
<nav role="tablist" aria-label="Main navigation">
  <button 
    role="tab"
    aria-selected={isActive}
    aria-controls="home-panel"
  >
    Home
  </button>
</nav>
```

**Swipe Actions**
```tsx
<div
  role="listitem"
  aria-label={`${item.title}, ${item.price}. Swipe left for actions`}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') setExpanded(true);
  }}
>
```

### 6.2 Keyboard Navigation

| Context | Key | Action |
|---------|-----|--------|
| Tab bar | Tab | Move between tabs |
| Tab bar | Enter/Space | Activate tab |
| Item list | Arrow Down/Up | Move between items |
| Item | Enter | Expand item details |
| Item expanded | Tab | Navigate to action buttons |
| Bottom sheet | Escape | Close sheet |

### 6.3 Screen Reader Announcements

- New suggestions: "3 new gift suggestions to review"
- Purchase confirmation: "Kindle Paperwhite marked as purchased for Mom"
- Undo available: "Undo available for 5 seconds"

---

## Part 7: i18n Considerations

### 7.1 Layout Adaptations

**Russian Text Expansion**
Russian text typically requires 20-30% more space than English. Plan for:

| English | Russian | Growth |
|---------|---------|--------|
| "Add" | "Добавить" | +60% |
| "Mark as purchased" | "Отметить как купленное" | +50% |
| "Wishlist" | "Список желаний" | +30% |

**Mitigation Strategies**
- Use `min-width` rather than fixed widths
- Allow button text to wrap to 2 lines
- Test all screens with Russian locale
- Use flexible layouts (flexbox gap) not pixel margins

### 7.2 RTL Considerations

If future languages include RTL, ensure:
- Swipe directions reverse (swipe right = action)
- Icon positions mirror
- Use `logical` CSS properties (`margin-inline-start` vs `margin-left`)

---

## Part 8: Implementation Priority

### Phase 1: Foundation (Week 1)
- [ ] Implement bottom tab navigation (Home, Browse, Claimed, My Lists)
- [ ] Remove nested accordions from Browse
- [ ] Create drill-down navigation: Person → Lists → Items
- [ ] Audit and fix all touch targets (44×44px minimum)

### Phase 2: Core Interactions (Week 2)
- [ ] Build swipeable item cards with Claim/Unclaim actions
- [ ] Implement Claimed tab with grouped items
- [ ] Add inline suggestion approval (Home tab)
- [ ] Create add-item bottom sheet with list selector

### Phase 3: List Management (Week 3)
- [ ] Build My Lists tab with CRUD operations
- [ ] Implement visibility settings bottom sheet (allow/deny lists)
- [ ] Add list creation flow
- [ ] Ensure visibility rules are enforced in Browse

### Phase 4: Polish (Week 4)
- [ ] Add haptic feedback on swipe actions
- [ ] Implement undo toasts (5 second window)
- [ ] Screen reader testing
- [ ] Russian localization QA

### Phase 5: Refinement (Week 5)
- [ ] User testing with family members
- [ ] Performance optimization
- [ ] Animation refinements
- [ ] Edge case handling (empty states, permissions edge cases)

---

## Appendix A: Component Checklist

| Component | Touch Target | ARIA | Keyboard | i18n |
|-----------|-------------|------|----------|------|
| Bottom Tab Bar | ✅ Full width | ✅ tablist | ✅ Tab nav | ✅ Labels |
| Person Accordion | ✅ 56px min | ✅ accordion | ✅ Enter/Space | ✅ Flex width |
| List Row | ✅ 48px min | ✅ button | ✅ Enter | ✅ Truncate |
| Item Card | ✅ Full row | ✅ listitem | ✅ Enter expand | ✅ Truncate |
| Swipe Action | ✅ 80px reveal | ✅ Hint text | ✅ Button fallback | ✅ Claim/Unclaim |
| FAB | ✅ 56×56px | ✅ aria-label | ✅ Focus visible | ✅ Add icon |
| Bottom Sheet | ✅ All inputs | ✅ dialog | ✅ Escape close | ✅ All labels |
| Visibility Picker | ✅ 44px checkboxes | ✅ checkbox group | ✅ Space toggle | ✅ Names |

---

## Appendix B: Testing Checklist

### Device Testing
- [ ] iPhone SE (smallest common iOS)
- [ ] iPhone 14 Pro Max (large iOS)
- [ ] Pixel 6a (mid Android)
- [ ] Samsung Galaxy S23 Ultra (large Android)

### Interaction Testing
- [ ] One-handed use (right hand)
- [ ] One-handed use (left hand)
- [ ] Thumb-only navigation
- [ ] All primary flows completable without precision taps
- [ ] Claim → Unclaim → Claim cycle works smoothly

### Accessibility Testing
- [ ] VoiceOver (iOS)
- [ ] TalkBack (Android)
- [ ] Keyboard-only navigation
- [ ] 200% text scaling
- [ ] Reduced motion preferences

### Permission Testing
- [ ] User A cannot see User B's list when denied
- [ ] User A can see User B's list when allowed
- [ ] Claims hidden from list owner (recipient)
- [ ] "Everyone except me" visibility works correctly

---

*Document generated based on current mobile UX best practices from Nielsen Norman Group, Google Material Design 3, Apple Human Interface Guidelines, and Smashing Magazine research.*
