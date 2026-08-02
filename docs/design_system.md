# AURA Design System - v4.0

> Validated after full maquette review & Phase 5 component implementation
> ft_transcendence / Beauty & Lifestyle D2C
> Stack: Next.js 14+, Tailwind CSS v4, shadcn/ui, Radix UI, Apollo Client
> Languages: FR / EN / AR (RTL)

**Last updated:** Post-Phase-5-implementation
**Maintained by:** Frontend team
**Review cycle:** Post-phase-delivery

---

## Table of contents

1. [Color Tokens](#1-color-tokens)
2. [Typography Tokens](#2-typography-tokens)
3. [Spacing Tokens](#3-spacing-tokens)
4. [Radius Tokens](#4-radius-tokens)
5. [Shadow Tokens](#5-shadow-tokens)
6. [Grid & Layout](#6-grid--layout)
7. [i18n & RTL](#7-i18n--rtl)
8. [Component Inventory](#8-component-inventory)
9. [Implementation Patterns](#9-implementation-patterns)
10. [Usage Rules](#10-usage-rules)

---

## 1. Color Tokens

Named by **semantic role**, never by value. Use Tailwind token utilities directly, never raw hex in code.

### Backgrounds (Tailwind: `bg-*`)

| Tailwind Token | Hex Value            | Usage                                      |
| -------------- | -------------------- | ------------------------------------------ |
| `bg-page`      | `#fafaf8`            | Page background (White Stone)              |
| `bg-card`      | `#ffffff`            | Cards, modals, navbar                      |
| `bg-surface`   | `#e8f0ec`            | Hero right, categories, editorial sections |
| `bg-subtle`    | `#f3f1eb`            | Alternate product sections, CTA sections   |
| `bg-overlay`   | `rgba(26,20,16,0.5)` | Modal backdrop                             |

### Text (Tailwind: `text-*`)

| Tailwind Token   | Hex Value | Contrast on `#fafaf8` | Contrast on `#e8f0ec` | Usage                      |
| ---------------- | --------- | --------------------- | --------------------- | -------------------------- |
| `text-primary`   | `#2c2420` | 11.8:1 AAA            | 11.8:1 AAA            | Titles, prices, main body  |
| `text-secondary` | `#4a4540` | 8.1:1 AA+             | 8.1:1 AA+             | Body text, descriptions    |
| `text-muted`     | `#a09890` | 3.1:1 (UI only)       | —                     | Labels, captions, metadata |
| `text-inverse`   | `#fafaf8` | —                     | —                     | Text on dark backgrounds   |

**Critical:** Never use `text-muted` on `bg-surface`. Use `text-secondary` instead. Contrast minimum: 4.5:1 (AA), target 7:1 (AA+).

### Brand (Tailwind: `brand-*`)

| Tailwind Token | Hex Value | Contrast on `#fafaf8` | Usage                                  |
| -------------- | --------- | --------------------- | -------------------------------------- |
| `brand-dark`   | `#2c2420` | 11.8:1 AAA            | Primary CTA buttons, footer bg         |
| `brand-accent` | `#dc9b9b` | —                     | Badge Sale, cart dot (decorative only) |

### Borders (Tailwind: `border-*`)

| Tailwind Token   | Hex Value | Usage                              |
| ---------------- | --------- | ---------------------------------- |
| `border-default` | `#dedad4` | Cards, inputs, separators (0.5px)  |
| `border-focus`   | `#2c2420` | Focus ring, active state indicator |

### Footer (Tailwind: `footer-*`)

| Tailwind Token  | Hex Value | Usage                    |
| --------------- | --------- | ------------------------ |
| `footer-bg`     | `#1e1b18` | Footer background        |
| `footer-text`   | `#e0dbd4` | Footer links (primary)   |
| `footer-muted`  | `#c8c0b8` | Footer tagline           |
| `footer-subtle` | `#786e68` | Footer labels, copyright |

### Status (Tailwind: `status-*`)

| Tailwind Token  | Hex Value | Usage                                   |
| --------------- | --------- | --------------------------------------- |
| `status-online` | `#3d7a5e` | Online dot, delivery, trend up          |
| `status-error`  | `#c0392b` | Form errors, trend down, danger actions |

---

## 2. Typography Tokens

### Typefaces

| Role                | Family                 | Weights                                        | Use case                                |
| ------------------- | ---------------------- | ---------------------------------------------- | --------------------------------------- |
| Display / Editorial | **Cormorant Garamond** | 300 Light, 400 Regular, 300 Italic, 400 Italic | Hero titles, product names, blockquotes |
| Functional / UI     | **Jost**               | 300 Light, 400 Regular, 500 Medium             | Body text, buttons, labels, inputs, nav |
| Arabic (lang="ar")  | **Noto Sans Arabic**   | 300, 400, 500                                  | All functional text when lang="ar"      |

**Rule:** Cormorant Garamond = editorial only (titles, hero, product names). Jost = all interactive and functional text (body, nav, buttons, prices, labels, inputs). When `lang="ar"`, Noto Sans Arabic replaces Jost for all text.

### Scale - Major Third ×1.250, base 16px

#### Display - Cormorant Garamond

| Tailwind Token          | Size | Weight             | Line-height | Letter-spacing | Usage                              |
| ----------------------- | ---- | ------------------ | ----------- | -------------- | ---------------------------------- |
| `text-display-hero`     | 48px | 300 Light Italic   | 1.08        | 0              | H1 hero                            |
| `text-display-title`    | 30px | 400 Regular        | 1.2         | 0              | H2 sections                        |
| `text-display-subtitle` | 22px | 400 Regular        | 1.3         | 0              | H3, admin titles                   |
| `text-display-product`  | 18px | 400 Regular Italic | 1.4         | 0              | Product name on card               |
| `text-display-stat`     | 24px | 300 Light          | 1           | 0              | KPI values, ratings, profile stats |

#### Functional - Jost

| Tailwind Token    | Size    | Weight      | Line-height | Letter-spacing | Usage                            |
| ----------------- | ------- | ----------- | ----------- | -------------- | -------------------------------- |
| `text-body-lg`    | 13px    | 300 Light   | 1.85        | 0              | Intro paragraphs                 |
| `text-body-base`  | 12px    | 300 Light   | 1.8         | 0              | Body text, descriptions          |
| `text-body-sm`    | 11px    | 300 Light   | 1.7         | 0              | Accordion content, metadata      |
| `text-ui-nav`     | 10px    | 400 Regular | 1           | 0.12em         | Navigation links                 |
| `text-ui-button`  | 10px    | 500 Medium  | 1           | 0.10em         | CTAs (uppercase)                 |
| `text-ui-label`   | 9px     | 500 Medium  | 1           | 0.18em         | Eyebrows, labels UPPERCASE       |
| `text-ui-caption` | 9px     | 300 Light   | 1.5         | 0.06em         | Timestamps, order dates          |
| `text-ui-price`   | 12-13px | 400 Regular | 1           | 0              | Prices                           |
| `text-ui-badge`   | 8px     | 400-500     | 1           | 0.08em         | Badges, role tags                |
| `text-ui-lang`    | 9px     | 400-500     | 1           | 0.10em         | Language selector (FR / EN / AR) |

---

## 3. Spacing Tokens

Base unit: **4px**. All spacing is a multiple of 4. Use Tailwind scale directly.

| Tailwind Token    | Value | Typical usage              |
| ----------------- | ----- | -------------------------- |
| `p-1` / `gap-1`   | 4px   | Icon gaps, tight inline    |
| `p-2` / `gap-2`   | 8px   | Between card elements      |
| `p-3` / `gap-3`   | 12px  | Compact padding            |
| `p-4` / `gap-4`   | 16px  | Standard card padding      |
| `p-5` / `gap-5`   | 20px  | Product grid gap           |
| `p-6` / `gap-6`   | 24px  | Section content gap        |
| `p-7` / `gap-7`   | 28px  | Sidebar / header padding   |
| `p-8` / `gap-8`   | 32px  | Section horizontal padding |
| `p-12` / `gap-12` | 48px  | Medium section padding     |
| `p-16` / `gap-16` | 64px  | Large section padding      |

---

## 4. Radius Tokens

| Tailwind Token | Value  | Usage                                                           |
| -------------- | ------ | --------------------------------------------------------------- |
| `rounded-none` | 0px    | Primary CTA buttons, product images (intentional design choice) |
| `rounded-sm`   | 4px    | Inputs, small elements, modals                                  |
| `rounded-pill` | 20px   | Role badges (Admin/Moderator), status tags, large badges        |
| `rounded-full` | 9999px | Avatars, online dots                                            |

**Rule:** Primary CTA buttons always `rounded-none`. This is deliberate to differentiate AURA from generic rounded-button UI and reinforce premium fashion aesthetic.

---

## 5. Shadow Tokens

| Tailwind Token      | Value                            | Usage                                 |
| ------------------- | -------------------------------- | ------------------------------------- |
| `shadow-none`       | `none`                           | Flat elements, buttons, resting state |
| `shadow-card`       | `0 1px 4px rgba(44,36,32,0.06)`  | Cards at rest                         |
| `shadow-card-hover` | `0 4px 16px rgba(44,36,32,0.10)` | Cards on hover                        |
| `shadow-modal`      | `0 8px 32px rgba(44,36,32,0.14)` | Modals, chat side panels, overlays    |

---

## 6. Grid & Layout

| Property               | Value                                           |
| ---------------------- | ----------------------------------------------- |
| Max content width      | 1152px (72rem)                                  |
| Horizontal page gutter | 32px                                            |
| Column system          | 12 columns                                      |
| Column gap             | 24px                                            |
| Navbar height          | 54px                                            |
| Breakpoints            | sm: 640px / md: 768px / lg: 1024px / xl: 1280px |

### Section alternation pattern

Sections follow a color alternation to create visual rhythm and prevent monotony:

```
Navbar (bg-card)
Hero (bg-page left / bg-surface right)
Featured Collections (bg-page)
Featured Products (bg-subtle)
Editorial (bg-surface left / bg-page right)
Newsletter (bg-page)
Footer (footer-bg dark)
```

### Navbar structure (LTR)

Logo (start) · Nav links · Search · Cart · Avatar · border-l · Lang selector (end)

---

## 7. i18n & RTL

### Languages

| Code | Language | Direction | Font Stack                           |
| ---- | -------- | --------- | ------------------------------------ |
| `fr` | Français | LTR       | Cormorant + Jost                     |
| `en` | English  | LTR       | Cormorant + Jost                     |
| `ar` | العربية  | RTL       | Cormorant (latin) + Noto Sans Arabic |

### Implementation: RTL support

```tsx
/* Root layout component */
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

Use Tailwind's `rtl:` variant for directional properties:

```tsx
/* Example: border-left in LTR becomes border-right in RTL */
<div className="border-l rtl:border-l-0 rtl:border-r border-border-default">

/* Example: padding-left in LTR becomes padding-right in RTL */
<div className="pl-4 rtl:pl-0 rtl:pr-4">

/* Example: text-left naturally becomes text-right in RTL */
<p className="text-left rtl:text-right">
```

### Language selector - Navbar

Placed at far right (start in RTL), separated by `border-l` (becomes `border-r` in RTL):

```tsx
<div className="border-l border-border-default pl-3.5 flex items-center gap-0">
  <span
    className={`text-ui-lang uppercase cursor-pointer px-1.5
    ${locale === 'fr' ? 'text-primary font-medium' : 'text-muted'}`}
    onClick={() => setLocale('fr')}
  >
    FR
  </span>
  <span className="text-ui-lang text-border-default">·</span>
  <span
    className={`text-ui-lang uppercase cursor-pointer px-1.5
    ${locale === 'en' ? 'text-primary font-medium' : 'text-muted'}`}
    onClick={() => setLocale('en')}
  >
    EN
  </span>
  <span className="text-ui-lang text-border-default">·</span>
  <span
    className={`text-ui-lang uppercase cursor-pointer px-1.5
    ${locale === 'ar' ? 'text-primary font-medium' : 'text-muted'}`}
    onClick={() => setLocale('ar')}
  >
    AR
  </span>
</div>
```

### What RTL inverts automatically (via dir="rtl")

- Navbar order
- Hero split (text right, product left)
- Product badge position (left → right)
- Cart dot position
- Border directions (border-left ↔ border-right)
- Flex row direction

### What stays fixed regardless of direction

- Logo position (always start)
- Avatar initials
- Price display (€ symbol)
- Cormorant Garamond for latin characters in branding

---

## 8. Component Inventory

All components organized by purpose.

### Layout

| Component | Location                       | Description                                                |
| --------- | ------------------------------ | ---------------------------------------------------------- |
| `Navbar`  | `components/layout/Navbar.tsx` | Fixed 54px, nav links, search, cart, avatar, lang selector |
| `Footer`  | `components/layout/Footer.tsx` | Dark bg (footer-bg), 4-col grid, RTL-aware                 |

### Form Primitives

| Component  | Location                          | Variants                                                          |
| ---------- | --------------------------------- | ----------------------------------------------------------------- |
| `Button`   | `components/ui/form/button.tsx`   | dark / ghost / link (dark is `rounded-none`)                      |
| `Input`    | `components/ui/form/input.tsx`    | default / focus / error / disabled                                |
| `Textarea` | `components/ui/form/textarea.tsx` | default / focus / error                                           |
| `Select`   | `components/ui/form/select.tsx`   | Native HTML5, closed / open                                       |
| `Checkbox` | `components/ui/form/checkbox.tsx` | unchecked / checked / disabled (real hidden input + peer styling) |
| `Switch`   | `components/ui/form/switch.tsx`   | on / off, `role="switch"`                                         |

### Display Components

| Component   | Location                              | Variants                                                       |
| ----------- | ------------------------------------- | -------------------------------------------------------------- |
| `Badge`     | `components/ui/display/badge.tsx`     | dark / accent / muted, `rounded-pill`                          |
| `Avatar`    | `components/ui/display/avatar.tsx`    | SM 26px / MD 36px / LG 72px, fallback to initials              |
| `Separator` | `components/ui/display/separator.tsx` | 0.5px border-default, horizontal / vertical                    |
| `Tabs`      | `components/ui/display/tabs.tsx`      | Underline active state, `<span>` not `<button>`, arrow key nav |
| `Accordion` | `components/ui/display/accordion.tsx` | Label + ChevronDown only, no box, border-b separator           |

### Overlay Components

| Component | Location                           | Description                                          |
| --------- | ---------------------------------- | ---------------------------------------------------- |
| `Dialog`  | `components/ui/overlay/dialog.tsx` | Focus trap, Escape to close, confirm / form variants |

### Feedback Components

| Component  | Location                              | Description                                   |
| ---------- | ------------------------------------- | --------------------------------------------- |
| `Toast`    | `components/ui/feedback/toast.tsx`    | success / error / info, auto-dismiss, stacked |
| `Skeleton` | `components/ui/feedback/skeleton.tsx` | animate-pulse for loading states              |

### Card Components

| Component        | Location                              | Description                                                                                                                                        |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CollectionCard` | `components/cards/CollectionCard.tsx` | Featured collection: 1:1 image (rounded-none), title, description, count, "Shop Collection" badge. Hover: scale 105% + opacity 80%. Wraps in Link. |
| `CategoryCard`   | `components/cards/CategoryCard.tsx`   | Filter option: icon + label + optional count. Variants: default / active / disabled. Keyboard-operable.                                            |

### Section Components

| Component                    | Location                                             | Description                                                                                              |
| ---------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `HeroSection`                | `components/sections/HeroSection.tsx`                | Split layout: text (left, bg-page) + image (right, bg-surface). Cormorant title, Jost body, CTA buttons. |
| `FeaturedCollectionsSection` | `components/sections/FeaturedCollectionsSection.tsx` | CollectionCard grid on bg-page with Suspense + Skeleton loading.                                         |
| `CallToActionSection`        | `components/sections/CallToActionSection.tsx`        | Blockquote + CTA button on bg-subtle.                                                                    |

---

## 9. Implementation Patterns

### Pattern: Section with alternating backgrounds

```tsx
/* Follow the alternation: bg-page → bg-subtle → bg-page → bg-surface */
<section className="bg-page py-16 md:py-24">
  <div className="mx-auto max-w-6xl px-4 md:px-8">
    {/* content */}
  </div>
</section>

<section className="bg-subtle py-16 md:py-24">
  {/* content */}
</section>

<section className="bg-surface py-16 md:py-24">
  {/* content */}
</section>
```

### Pattern: Image container (Next.js Image)

```tsx
import Image from 'next/image';

/* Always use Next.js Image, never <img> */
<div className="relative aspect-square overflow-hidden bg-page rounded-none">
  <Image src={url} alt={altText} width={400} height={400} className="h-full w-full object-cover" />
</div>;
```

### Pattern: Accordion (label + icon, no box)

```tsx
/* No background box, no rounded corners, separator via border-b only */
<div className="border-b border-border-default">
  <button
    type="button"
    className="flex w-full items-center justify-between py-4 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
    onClick={toggle}
  >
    <span className="text-body-sm font-medium text-primary">Label</span>
    <ChevronDown
      className={`h-4 w-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
    />
  </button>
  {open && <div className="text-body-sm text-secondary pb-4">Content</div>}
</div>
```

### Pattern: Tab navigation (span, not button)

```tsx
/* Use <span> to prevent browser default <button> styling */
<div className="flex items-center justify-center border-b border-border-default gap-8">
  <span className="text-ui-button uppercase cursor-pointer text-primary pb-3 border-b-2 border-brand-dark">
    Active tab
  </span>
  <span className="text-ui-button uppercase cursor-pointer text-muted pb-3 border-b-2 border-transparent hover:text-primary">
    Inactive tab
  </span>
</div>
```

### Pattern: Modal backdrop + focus trap

```tsx
/* Overlay */
<div
  className="fixed inset-0 bg-black/50 backdrop-blur-xs"
  onClick={onClose}
  aria-hidden="true"
/>

/* Dialog */
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  className="shadow-modal border-default relative z-10 w-full max-w-md rounded-sm border bg-card p-6"
>
  {/* content */}
</div>
```

### Pattern: RTL layout helper

```tsx
/* Common pattern for elements that need RTL support */
<div className="flex items-center gap-2 p-4 text-left rtl:text-right">
  <IconLeft className="shrink-0" />
  <span>Label</span>
  <IconRight className="ml-auto rtl:ml-0 rtl:mr-auto shrink-0" />
</div>
```

### Pattern: Role badge

```tsx
/* Always use rounded-pill for badges */
<span className="inline-flex px-2 py-0.5 rounded-pill text-ui-badge font-medium bg-brand-dark text-inverse">
  Admin
</span>
<span className="inline-flex px-2 py-0.5 rounded-pill text-ui-badge font-medium bg-bg-surface text-primary">
  Moderator
</span>
```

### Pattern: Loading states

```tsx
import { Skeleton } from '@/components/ui/feedback/skeleton';

/* Use Skeleton with Suspense for loading placeholders */
<Suspense fallback={<Skeleton className="h-64 w-full" />}>
  <AsyncComponent />
</Suspense>

/* Or inline skeleton cards */
<div className="grid grid-cols-3 gap-4">
  {[...Array(3)].map((_, i) => (
    <div key={i} className="space-y-4">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  ))}
</div>
```

---

## 10. Usage Rules

### Always

- Use Tailwind token utilities directly: `bg-page`, `text-primary`, `border-border-default`
- Use Cormorant Garamond (`font-cormorant`) for editorial and product copy
- Use Jost (`font-jost`) for all interactive and functional text
- Use `<span>` not `<button>` for tabs and inline text actions
- Keep primary CTA buttons square (`rounded-none`)
- Use `Image` from Next.js, never native `<img>` (ESLint @next/next/no-img-element)
- Maintain contrast >= 4.5:1 on all backgrounds (target 7:1 on `bg-surface`)
- Use `text-secondary` on `bg-surface`, never `text-muted`
- Follow section alternation pattern for background colors

### Never

- Use `text-muted` for body text (only for labels, captions, metadata)
- Use `brand-accent` (#dc9b9b) for text (decorative only)
- Mix Cormorant and Jost in the same line
- Apply letter-spacing to Cormorant Garamond italic
- Round primary CTA buttons
- Put light text on light background of same hue
- Use `<button>` for tab navigation
- Strikethrough OOS sizes, grey them instead
- Use native `<img>` tags (use Next.js `<Image>`)
- Hardcode hex colors or spacing values

---

## Stack & Tools

| Feature           | Technology                                            |
| ----------------- | ----------------------------------------------------- |
| i18n routing      | `next-intl` (FR, EN, AR)                              |
| RTL support       | `dir` attribute on `<html>` + Tailwind `rtl:` variant |
| Arabic font       | Noto Sans Arabic (Google Fonts)                       |
| GraphQL           | Apollo Client + Apollo Server (NestJS, code-first)    |
| Chat realtime     | Socket.io                                             |
| Online presence   | Socket.io + Redis                                     |
| Charts            | Recharts                                              |
| System monitoring | Prometheus + Grafana                                  |
| Auth              | Passport.js + JWT + otplib (2FA/TOTP)                 |
| File uploads      | Multer (avatar, product media)                        |
| Form validation   | Zod + React Hook Form                                 |
| UI Components     | shadcn/ui, Radix UI, lucide-react                     |
| ORM               | Prisma + PostgreSQL                                   |
