---
name: Modern Receipt Fintech
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  currency-hero:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  currency-item:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

The design system establishes a frictionless, approachable, and transparent social utility for shared dining, outings, and micro-expenses. It eliminates social friction around money by leaning into the metaphor of an artisanal paper receipt reimagined as an interactive fintech canvas. The personality is optimistic, swift, and trustworthy—inviting users to calculate and settle shares without authentication or hurdles.

The visual direction marries tactile paper details (punch-hole tears, perforated dividers, and scalloped receipt trims) with the crispness of modern Southeast Asian digital banking. Micro-interactions should feel tactile and instant: smooth spring physics when adding splitters, subtle confetti bursts on zero-balance reconciliation, and clear visual cues for tax, tip, and discount allotments.

## Colors

The color palette centers around an energetic, high-trust Emerald and Mint green duo, conveying liquidity, prompt settlements, and financial clarity without mimicking legacy corporate e-wallets. 

- **Primary (`#059669`) & Secondary (`#10B981`):** Applied to primary actions, completion states, share totals, and active chip toggles.
- **Tertiary (`#F59E0B`):** Warm amber used for pending shares, unsettled badges, tip adjustments, and alerts.
- **Surface Canvas (Light):** Soft cool-tinted off-white (`#F8FAFC`) with card surfaces in pure `#FFFFFF`.
- **Surface Canvas (Dark):** Deep slate bedrock (`#0B0F17`) with receipt containers resting on rich slate (`#131B2E`) and subtle emerald-tinted glows.
- **Dividers & Perforations:** Use an ultra-soft slate line (`#E2E8F0` in light mode, `#1E293B` in dark mode) paired with SVG cutout masks for punch holes.

## Typography

Typography pairs the warm, human geometric curves of **Plus Jakarta Sans** with the structural precision of **JetBrains Mono**. 

- All Rupiah currency figures, tax percentages, quantities, item counts, and calculation breakdowns strictly utilize `JetBrains Mono` with `font-variant-numeric: tabular-nums` to ensure flawless vertical digit alignment down calculation columns.
- Headlines, modal titles, participant avatars, and navigational controls rely on `Plus Jakarta Sans`, keeping the product cordial and non-intimidating.

## Layout & Spacing

The system adopts a mobile-first philosophy centered on a maximum container width of `480px` on mobile and tablet preview viewports, expanding to a 2-column dashboard layout on desktop (`max-width: 1040px`).

- **Mobile (< 768px):** A single central bill canvas padded by `margin: 1rem`. Bottom sheets handle line-item entry, tax/service toggles, and participant assignment.
- **Desktop (≥ 768px):** Left pane hosts active bill entry and live calculator controls; right pane displays the sticky live-rendered ticket voucher with share link QR codes and WhatsApp export triggers.
- Spacing steps adhere strictly to an 8pt modular rhythm (with a 4pt sub-step for tight badges and numeric inputs).

## Elevation & Depth

Visual depth combines subtle layered paper surfaces with crisp ticket perforation effects:

1. **Canvas Base:** Flat, neutral backdrop (`#F8FAFC` light / `#0B0F17` dark) with zero elevation.
2. **Receipt Ticket Level:** Floated on a diffused ambient shadow: `box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)` in light mode, and `box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.5)` with a subtle `1px solid rgba(255, 255, 255, 0.06)` border in dark mode.
3. **Perforated Ticket Cuts:** Created via CSS pseudo-elements with radial gradient punch-outs (half-circle punch cutouts at equal Y-coordinates along the left and right card edges), accented by a dashed horizontal rule.
4. **Interactive Floating Bar:** Bottom floating summary pill using glassmorphic blur (`backdrop-filter: blur(12px)`) with `rgba(255, 255, 255, 0.85)` in light mode to keep total share calculation anchored over scrollable item feeds.

## Shapes

Cards and primary structural containers use balanced rounded corners (`16px` to `24px`) to emulate soft modern paper slips. Internal interactive components (buttons, tags, and item selectors) use `8px` to `12px` radii for tactile precision, while avatar initial circles and toggle pills are fully round (`9999px`). The lower edge of the receipt supports an optional decorative zig-zag or saw-tooth tear edge implemented via SVG mask patterns.

## Components

### Buttons
- **Primary Action (Split & Share):** Solid Emerald (`#059669`) fill with white text, font weight 600, `border-radius: 12px`, with an active scale tap effect (`scale: 0.98`).
- **Secondary Action (Add Item / Split Evenly):** Mint-tinted ghost button (`background: rgba(16, 185, 129, 0.1)`, `color: #059669`), crisp and minimal.
- **Destructive/Remove Action:** Borderless icon buttons with hover slate/rose tone for discarding mistakenly inputted receipt rows.

### Receipt Card & Ticket Notch
- White card container (`border-radius: 20px`) flanked by 16px radial semicircular punch holes on opposing lateral borders.
- A horizontal dashed divider (`border-top: 2px dashed #CBD5E1`) connects the notches to segment itemized breakdowns from tip, tax, and final per-person shares.

### Input Fields (Currency & Item Title)
- **Currency Field:** JetBrains Mono font with prominent `Rp` prefix label. Defaults to right-aligned tabular numerals.
- Zero-state fields are clean without heavy outlines; focused inputs gain a 2px Emerald stroke (`#10B981`) and subtle green outer aura.

### Person Chips & Assignee Toggles
- Small pill tokens (`border-radius: 9999px`) showing person initials or custom color avatars.
- Unselected state: Slate background with medium text.
- Selected state: Emerald background with inverted white text and checkmark indicator.

### Lists & Line Items
- Three-column mobile row: Item Name & Sub-quantities (Left), Assigned Person Badges (Middle), Price in Tabular Rupiah (Right).
- Swipe gestures reveal quick delete or split-modifier controls on mobile viewports.

### QR & WhatsApp Share Drawer
- Bottom sheet containing a high-contrast dynamic QRIS or settlement summary accompanied by a one-tap formatted WhatsApp copy layout (`*Total: Rp ...*`).