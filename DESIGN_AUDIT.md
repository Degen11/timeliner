# Timeliner — Visual Design Audit

**Audited by:** Senior Product Design Review
**Date:** March 2026
**Scope:** Homepage/landing experience + main app interface

---

## Executive Summary

Timeliner has solid foundations — a thoughtful color palette, two-font type system (Inter + Plus Jakarta Sans), and consistent use of Lucide icons. But the execution has accumulated visual debt: ad-hoc spacing, inconsistent border radii, mixed font sizing patterns, and interaction affordances that vary from component to component. The result is an app that *works* but doesn't feel *designed*.

The 18 recommendations below target the highest-impact changes to make the product feel cohesive, polished, and intentional — like something from Linear or Notion's design playbook.

---

## 1. Establish a Strict Spacing Scale and Eliminate Ad-Hoc Values

**Problem:** Spacing values are scattered across the codebase with no governing scale. Cards use `px-3 py-1.5` (compact) vs `px-5 py-4` (expanded). The sidebar uses `px-3 py-3`, `px-4 py-3.5`, `px-1 pt-2 mt-2`, `px-1 pt-3`. The landing hero uses `px-6 py-8 lg:px-10 lg:py-10`. Gap values range from `gap-0.5` to `gap-8` without a clear pattern. This creates a subtle but pervasive feeling that elements are arbitrarily placed.

**Why it matters:** Notion and Linear feel precise because every spacing decision comes from a constrained scale (typically 4px increments: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64). When spacing is ad-hoc, the eye perceives misalignment even if it can't articulate why.

**Recommended change:** Adopt a strict 4px base unit spacing scale. Define semantic spacing tokens in your CSS theme: `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 12px`, `--space-lg: 16px`, `--space-xl: 24px`, `--space-2xl: 32px`, `--space-3xl: 48px`. Audit every `px-`, `py-`, `gap-`, `mt-`, `mb-` class and snap to this scale. Remove all half-unit values like `py-1.5`, `py-3.5`, `gap-2.5` — these create visual noise.

**Reference:** Linear uses a strict 4px grid. Every element aligns to it.

---

## 2. Unify Border Radius to Three Tiers Maximum

**Problem:** The codebase uses at least 6 different border-radius values: `rounded` (4px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), and `rounded-full`. The DatePicker popover uses `rounded-lg`, modals use `rounded-xl`, the landing card uses `rounded-2xl`, buttons use `rounded-lg`, badges use both `rounded-lg` and `rounded-full`, the Toast uses `rounded-xl`, day cells use `rounded-md`, inline edit fields use `rounded-md` and `rounded-lg`. There's no clear hierarchy governing which radius goes where.

**Why it matters:** Apple's design system uses exactly 3 radius tiers consistently. When border radii are inconsistent, adjacent elements look like they belong to different products.

**Recommended change:** Establish exactly 3 tiers: **Small** (6px) for inline elements like buttons, inputs, badges, tags, day cells. **Medium** (12px) for cards, modals, dropdowns, popovers, toasts. **Large** (16px) for hero sections, full-page containers. Remove `rounded` (4px) and `rounded-2xl` (16px on non-container elements). Ensure that nested elements use a *smaller* radius than their parent (the concentric radius rule).

**Reference:** Apple's HIG concentric radius principle. Linear uses 8px for most surfaces, 6px for inline elements.

---

## 3. Reduce the Font Size Fragmentation

**Problem:** Font sizes currently span: `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-3xl` (30px), `text-4xl` (36px). The sub-pixel sizes (`9px`, `10px`, `11px`) are used extensively — compact badge text, helper hints, timestamp labels, sidebar headings, sidebar footer, counter badges, tag editor buttons. This creates a cluttered type hierarchy where too many sizes compete for attention.

**Why it matters:** Professional design systems use 5–7 font sizes max. Linear uses approximately: 11px (caption), 13px (body small), 14px (body), 16px (title), 20px (heading), 28px (hero). Every additional size dilutes the hierarchy.

**Recommended change:** Consolidate to 6 sizes: **Caption** (11px), **Small** (13px), **Body** (14px), **Subtitle** (16px), **Title** (20px), **Hero** (32px). Eliminate all `text-[9px]` and `text-[10px]` usage — anything that needs to be that small should either be 11px or removed entirely. The `text-[11px]` sidebar headings, badge counters, and helper text should all use the same Caption size. Remove `text-lg` (18px) — it sits too close to 16px to create meaningful contrast.

**Reference:** Linear's type scale. Notion uses a similarly constrained scale.

---

## 4. Lighten the Sidebar's Visual Weight and Contrast Ratio

**Problem:** The sidebar uses a very dark navy (`#0f1729`) which creates a stark, high-contrast split against the light canvas (`#f8fafc`). The sidebar feels like it belongs to a different application — a dark-themed DevTools panel rather than a content-centric timeline tool. The dark sidebar also requires a parallel color system (sidebar-text, sidebar-muted, sidebar-hover, sidebar-active, sidebar-input, sidebar-border, sidebar-surface — 10 extra tokens), doubling the design surface area.

**Why it matters:** Notion uses a light sidebar (white/warm gray). Linear uses a subtle off-white or very light gray. The dark sidebar pattern works for developer tools (VS Code, terminals) but creates visual tension in a content-focused productivity app. It also makes the sidebar feel heavier than the content area, pulling attention away from the timeline.

**Recommended change:** Switch the sidebar to a light theme — either `#FAFAFA` or `#F7F8FA` with a subtle `border-right: 1px solid #E5E7EB`. This eliminates the entire `sidebar-*` color token family and unifies the app under one color system. If brand differentiation is important, consider a very subtle blue tint (`#F8FAFF`) rather than full dark mode.

**Reference:** Notion's sidebar is light gray. Linear's sidebar is light with subtle hover states.

---

## 5. Standardize Button Interaction Patterns — Remove Scale Transforms

**Problem:** The `Button.jsx` component uses `hover:scale-[1.02]` and `active:scale-[0.98]` on all variants. These scale transforms feel playful and consumer-app-oriented (like a mobile game button), not professional and tool-like. They also interact badly with adjacent layout — buttons in tight toolbar groups visually shift neighboring elements. The toolbar action buttons (Add event, Import, Photos) don't use this scale pattern, creating inconsistency between `Button` components and raw `<button>` elements.

**Why it matters:** Linear, Notion, and Apple's web interfaces never use scale transforms on buttons. They rely on subtle background color shifts and shadow changes. Scale transforms feel "bouncy" and undermine the sense of precision.

**Recommended change:** Remove all `hover:scale-[1.02]` and `active:scale-[0.98]` from the Button component. Replace with: **Primary** — darken background + add subtle shadow on hover, slight background darken on active. **Secondary** — light background tint on hover, slightly darker on active. **Ghost** — background tint on hover only. Keep `transition-colors duration-150` for the background change. This aligns every clickable element to one interaction language.

**Reference:** Linear buttons use only color/shadow transitions. Notion buttons are flat with background shifts.

---

## 6. Redesign the Vertical Timeline Spine for Visual Clarity

**Problem:** The vertical timeline uses a thin `border-l-2 border-primary/35` with small 8x8px dots (`bg-primary/35 border-2 border-white`) positioned at `-left-[27px]`. The dots are low-contrast (35% opacity primary), the line is thin, and the whole timeline spine feels like an afterthought rather than a core design element. The offset positioning (`-left-[27px]`) is pixel-level fragile.

**Why it matters:** The timeline spine is the *defining visual element* of this product. It's what distinguishes Timeliner from a list of cards. It should feel purposeful and elegant, not like a CSS border hack.

**Recommended change:** Increase the spine line to 2px with full-opacity `gray-200` (not primary-tinted). Increase dots to 10–12px with a solid `secondary` fill color (not 35% opacity). Add a subtle white ring (`ring-2 ring-white`) around each dot to create depth against the line. Consider adding a gentle gradient fade to the top and bottom of the spine. Use CSS Grid for positioning instead of absolute pixel offsets — this is more robust and alignment-proof.

**Reference:** GitHub's contribution timeline, Stripe's event timelines.

---

## 7. Increase Card Padding and Reduce Content Density

**Problem:** Compact cards use `px-3 py-1.5` — that's 12px horizontal / 6px vertical. Even expanded cards use only `px-5 py-4` (20px/16px). These are *very* tight paddings, especially when cards contain dates, titles, descriptions, people badges, tag badges, photos, and action buttons. The content feels cramped. The compact mode especially creates a wall of text where individual events are hard to distinguish.

**Why it matters:** Apple's card designs typically use 16–24px padding minimum. Notion uses generous internal padding so each block "breathes." Cards should feel like discrete, self-contained units — not rows in a spreadsheet.

**Recommended change:** Increase expanded card padding to `px-6 py-5` (24px/20px). Increase compact card padding to `px-4 py-3` (16px/12px). Add `gap-3` between badge rows and description text. Increase the gap between cards in the vertical timeline from `gap-2.5` to `gap-4` (expanded) and from `gap-1` to `gap-2` (compact). This gives each event visual breathing room.

**Reference:** Notion's database card view. Linear's issue cards.

---

## 8. Fix the Landing Page Hero Section's Visual Hierarchy

**Problem:** The split hero layout (`grid-cols-2`) has the animated demo timeline on the left and the headline/CTA on the right. This is backwards — the headline/value proposition should be the first thing a user reads (left in LTR), not a decorative animation. The "How it works" label is `text-[10px]` — nearly invisible. The three feature badges ("No account required", etc.) are placed below the demo, buried in the left panel where they compete with the animation.

**Why it matters:** The landing page has ~3 seconds to communicate the product's value. Putting decorative content before the headline forces users to scan right to understand what the product does.

**Recommended change:** Swap the column order — put the headline, value prop, and CTA on the left; move the animated demo to the right. Increase the "How it works" label to 12px. Move the three feature badges to a horizontal row below the headline (above the CTA), not below the animation. Consider removing the animated demo entirely and replacing it with a static, high-quality product screenshot or illustration — animations that play on load can feel demo-y rather than polished.

**Reference:** Linear's homepage puts the headline left, product visual right. Notion's homepage leads with the value proposition.

---

## 9. Unify All Dropdown/Popover Styling

**Problem:** The codebase has at least 4 different dropdown/popover patterns: **MultiSelect dropdown** (`rounded-lg border border-gray-200 bg-white shadow-lg`), **DatePicker popover** (`rounded-lg border border-gray-200 bg-white shadow-md p-3`), **InlineTagEditor popover** (`rounded-lg border border-gray-200 bg-white p-2 shadow-lg`), **Tooltip** (`bg-gray-900 text-white rounded-lg shadow-lg`). The shadow intensity varies (shadow-md vs shadow-lg), internal padding varies (p-2 vs p-3 vs py-1), and there's no consistent entrance animation for non-tooltip popovers.

**Why it matters:** These floating surfaces appear in the same context (over timeline cards) and should feel like siblings. Inconsistent shadows and padding make each popover feel independently authored.

**Recommended change:** Create a single `Popover` surface token: `rounded-xl border border-gray-200 bg-white shadow-lg p-3`. Apply this to every floating panel: MultiSelect dropdown, DatePicker, InlineTagEditor, Export modal grid. Use a consistent entrance animation across all of them (the `tooltip-in` scale animation at 150ms works well). The Tooltip can remain dark (`bg-gray-900`) as an intentionally distinct element.

**Reference:** Linear uses one consistent popover style throughout. Notion's dropdowns share identical shadow/radius/padding.

---

## 10. Simplify the Toolbar — Too Many Controls Visible at Once

**Problem:** The header toolbar (in app view) contains: Filters button (mobile), Timeline name (mobile), View toggles (3 icons), Compact/Expand toggle, Year/Month zoom toggle, Undo button, Redo button, Add event button, Import text button, Photo library button, Import data button — all simultaneously visible. This is 12+ interactive elements in a 56px-high strip. The action buttons are grouped in a `bg-gray-50 border border-gray-200` container, but the view toggles and zoom controls float freely, creating two different visual zones in the same bar.

**Why it matters:** Linear's header has at most 4–5 visible controls. Notion's page header has 3–4. Dense toolbars read as "power user complexity" and intimidate new users. They also make each individual control harder to find.

**Recommended change:** Group controls into clear visual zones: **Left zone** — view toggles only (already visually grouped). **Center zone** — timeline name (already exists on mobile). **Right zone** — primary action (Add event) as a prominent button, with secondary actions (Import, Photos) behind a "..." overflow menu. Move Undo/Redo to keyboard shortcuts only (they already have shortcuts), or into a subtle position that doesn't compete with primary actions. Move Compact/Expand and Year/Month into the sidebar or a view-settings dropdown.

**Reference:** Linear's header: filter icon, view toggle, one primary action. Everything else is in menus.

---

## 11. Rethink Photo Thumbnails — Current Sizing Is Too Small

**Problem:** Photo thumbnails in expanded cards are `h-12 w-12` (48x48px). Compact card thumbnails are `h-9 w-14` (36x56px). The overflow indicator (`+N`) is also 48x48px. At these sizes, photos are essentially unrecognizable — they serve as "yes, there are photos" indicators rather than meaningful previews. The expanded photo grid uses `gap-1.5` (6px), which is extremely tight between image tiles.

**Why it matters:** If photos are worth showing, they should be large enough to communicate content. At 48px, a photo of a person, a landscape, and a document all look identical. This undermines the value of the photo feature entirely.

**Recommended change:** Increase expanded card thumbnails to `h-20 w-20` (80x80px) or even `h-24 w-24` (96x96px). Increase the gap to `gap-2` (8px). For compact cards, either increase to `h-10 w-16` (40x64px) with `rounded-lg` and a subtle shadow, or remove photos from compact view entirely (they add clutter without value at such small sizes). Consider showing a maximum of 3 thumbnails instead of 5 to give each photo more visual presence.

**Reference:** Apple's Photos app grid uses generous sizing. Notion's image blocks are always large enough to be meaningful.

---

## 12. Make the Date Label a First-Class Design Element

**Problem:** Event dates are displayed as `text-xs font-medium text-secondary tracking-wide uppercase` — small, blue, all-caps. In compact mode, they're the same size as the title (`text-xs`), just in a different color. Dates are the most important metadata in a *timeline* app, yet they're styled identically to a minor label. There's no visual weight distinction between the date and other metadata (people badges, tags).

**Why it matters:** In a timeline product, the date IS the organizing principle. It should be the most scannable element on every card — the first thing the eye hits. Currently, the bold title dominates and the date is secondary.

**Recommended change:** Give dates a distinct visual treatment: increase to `text-sm` (14px), use `font-semibold`, and consider a monospaced or tabular font variant for numerical dates to ensure visual alignment across cards. Add a subtle left border accent (3px solid secondary) or a colored background pill (`bg-secondary/8 px-2 py-0.5 rounded-md`) to make dates pop. In compact mode, consider placing the date in a fixed-width left column so dates align vertically across all events.

**Reference:** GitHub's timeline view gives dates prominent, left-aligned treatment. Linear's dates use tabular figures for alignment.

---

## 13. Remove the Gradient Background from the Hero Section

**Problem:** The hero section uses `bg-gradient-to-br from-soft-accent via-white to-soft-accent` with a border and `shadow-sm`. The left panel adds another gradient: `bg-gradient-to-b from-slate-50/80 to-white/50`. These layered gradients create a "frosted" effect that feels over-designed. The gradients don't add information — they're purely decorative and make the section feel like a marketing template rather than a product-quality design.

**Why it matters:** Modern product design (2024–2026) has moved away from gradient backgrounds. Linear, Notion, Vercel, and Stripe all use flat, solid backgrounds for content areas. Gradients are now associated with generic SaaS landing page templates.

**Recommended change:** Replace with a flat `bg-white` or very subtle `bg-gray-50` background. Remove the inner gradient on the left panel. Let the content (typography, animation, whitespace) do the work. If visual separation is needed between the two columns, a single `border-r border-gray-200` is sufficient. The hero should feel "quiet" so the content and CTA stand out.

**Reference:** Linear's homepage uses flat white. Notion uses flat backgrounds. Vercel uses black or white — no gradients on content.

---

## 14. Standardize the "Compact Toggle" / "Zoom" Control Pattern

**Problem:** The Compact/Expand toggle and Year/Month zoom toggle are styled as text-only buttons (`text-[11px] font-medium`) that change between `bg-soft-accent text-secondary` (active) and `text-gray-400 hover:text-gray-600` (inactive). These look like plain text links, not toggle controls. Their 11px size makes them nearly invisible. They don't communicate their binary state clearly — there's no visual container or segmented-control shape.

**Why it matters:** Toggle controls need clear affordance. Users should instantly see "this is a switch between two states" and which state is active. Text-only toggles at 11px fail both tests.

**Recommended change:** Replace with a proper segmented control: a `bg-gray-100 rounded-lg p-0.5` container with two equal-width options, where the active option gets `bg-white rounded-md shadow-sm text-gray-900` and the inactive gets `text-gray-500`. This is the pattern used by the tab bar on the landing page — apply it consistently here too. Size should be at least `text-xs` (12px).

**Reference:** Apple's segmented controls. Linear's view-mode toggles.

---

## 15. Clean Up the Sidebar's Section Spacing and Dividers

**Problem:** The sidebar content has inconsistent section separation: the Filters section uses a tinted container (`mx-1 mt-3 rounded-lg px-3 py-3.5 bg-[#162240] border border-white/[0.06]`), the Timeline section has no container, the Utilities section uses `px-1 pt-3 space-y-0.5`, and the Help section uses `px-1 pt-2 mt-2`. The `ZoneDivider` component exists but is barely visible (`h-px mx-1 bg-sidebar-border` at 6% opacity). Some sections have headings (`ZoneHeading`), others don't.

**Why it matters:** The sidebar is the primary navigation and control surface. Inconsistent grouping makes it hard to scan. Users should be able to glance at the sidebar and instantly parse its structure.

**Recommended change:** Use consistent section patterns: every section gets a `ZoneHeading`, a consistent `py-3` vertical rhythm, and a `1px` divider between sections (not within them). Remove the special tinted background from the Filters section — it should follow the same pattern as every other section. If grouping is needed, use consistent `space-y-2` within sections and `mt-4` (or the divider) between sections.

**Reference:** Linear's sidebar has clean, evenly-spaced sections with subtle dividers. Notion uses consistent section headings.

---

## 16. Elevate the Empty State Design

**Problem:** The `EmptyState` component uses `py-20` (80px vertical padding), a `rounded-2xl bg-gray-100 p-4` icon container (which doesn't match the card radius system), and standard `text-lg`/`text-sm` text. While functional, it feels generic — the kind of empty state a developer adds as a placeholder and never revisits. The large padding makes it float in the center of a vast empty space.

**Why it matters:** Empty states are the *first experience* for users who haven't added events yet. They set the emotional tone. A generic empty state signals "this is unfinished."

**Recommended change:** Redesign the empty state with: a purposeful illustration or icon at a larger size (48–64px), a headline that's encouraging (not just descriptive), a clear CTA button, and reduced vertical padding (`py-12` instead of `py-20` — the current padding creates too much void). The icon container should use `rounded-xl` to match the card system. Consider adding a subtle dotted border around the empty area to suggest "content goes here."

**Reference:** Notion's empty pages are inviting. Linear's empty states include clear action paths.

---

## 17. Fix Inconsistent Hover States Across Interactive Elements

**Problem:** Hover states vary across the app: `Button.jsx` uses scale + shadow + background change. Sidebar buttons use background-only (`hover:bg-sidebar-hover`). Toolbar icon buttons use text color change only (`hover:text-gray-900`). Event cards use shadow + border change (`hover:shadow-md hover:border-gray-300`). Badge remove buttons use text color only. The close buttons on modals use `hover:text-gray-700 hover:bg-gray-100`. There are at least 5 different hover interaction patterns.

**Why it matters:** Hover states are the most frequent micro-interaction in a web app. Inconsistent hover feedback makes the app feel assembled from parts rather than designed as a whole.

**Recommended change:** Define exactly 2 hover patterns: **Contained elements** (buttons, cards, sidebar items) — `hover:bg-{subtle-tint}` only, no transforms, no shadow changes. The tint should be `gray-100` for light surfaces and `white/8%` for dark surfaces. **Text links/actions** — `hover:text-{darker-shade}` only. Apply these two patterns uniformly. Remove shadow-on-hover from cards (cards should have a fixed shadow state).

**Reference:** Linear uses exactly one hover pattern (subtle background tint). Notion uses background tint for all interactive elements.

---

## 18. Tighten the Color Palette — Reduce One-Off Color Usage

**Problem:** Beyond the defined palette, there are numerous one-off color values scattered through components: `text-violet-500` (landing page Sparkles icon), `text-emerald-500` (Share icon), `text-emerald-600` (CSV export icon), `text-violet-600` (Markdown export icon), `text-rose-600` (PDF export icon), `bg-green-50` (save confirmation), `text-green-400` (toast success icon), `text-red-400` (toast error icon), `text-blue-400` (toast info icon), `bg-red-50` (delete hover), hardcoded `#162240` in sidebar styles. These colors exist outside the theme system and fragment the visual identity.

**Why it matters:** A cohesive product uses 5–7 colors total. Every color that exists outside the palette weakens the system. The export modal alone introduces 5 unique colors (one per format icon), making it look like a page from a children's book rather than a focused utility.

**Recommended change:** Route all colors through the existing palette: export icons should all use `text-gray-500` or `text-secondary` (the format is communicated by the label, not the icon color). Toast variant icons should use the defined `--color-success`, `--color-error`, `--color-secondary` tokens. Landing page feature icons should all use `text-secondary`. Remove all Tailwind color classes (`emerald`, `violet`, `rose`, `green`) that aren't in the theme — these bypass the design system.

**Reference:** Linear uses a monochromatic icon approach — all icons are one color. Notion uses gray icons throughout.

---

## Summary Priority Matrix

| Priority | Recommendation | Impact | Effort |
|----------|---------------|--------|--------|
| **P0** | #5 Remove button scale transforms | High | Low |
| **P0** | #2 Unify border radius to 3 tiers | High | Medium |
| **P0** | #17 Standardize hover states | High | Medium |
| **P1** | #4 Lighten the sidebar | Very High | High |
| **P1** | #3 Reduce font size fragmentation | High | Medium |
| **P1** | #1 Strict spacing scale | High | High |
| **P1** | #18 Tighten color palette | Medium | Medium |
| **P1** | #7 Increase card padding | Medium | Low |
| **P2** | #9 Unify dropdown/popover styling | Medium | Medium |
| **P2** | #10 Simplify the toolbar | Medium | Medium |
| **P2** | #6 Redesign timeline spine | Medium | Medium |
| **P2** | #12 Elevate date labels | Medium | Low |
| **P2** | #14 Standardize toggle controls | Medium | Low |
| **P2** | #15 Clean up sidebar sections | Medium | Medium |
| **P3** | #8 Fix hero section hierarchy | Medium | Low |
| **P3** | #13 Remove hero gradients | Low | Low |
| **P3** | #11 Resize photo thumbnails | Medium | Low |
| **P3** | #16 Elevate empty state design | Low | Low |

---

*This audit focuses on visual design, layout, and UX clarity. No code changes have been made. Each recommendation can be implemented independently, though P0 items should be addressed first as they establish the foundation for the rest.*
