---
name: tuffrat-visual
description: "Sistema visivo del redesign TuffRat: regole su tipografia, spaziatura, raggi, sfondi, icone, motion e stati, adattate dalla parte B di landing-page-design (elayadesign/ai-design-skills, MIT). Da consultare prima di scegliere font, dimensioni, spaziature, raggi, colori, icone o transizioni in qualsiasi componente DOM del sito. La parte di conversione (Part A) non si applica a un portfolio ed è stata tolta."
---

# TuffRat — sistema visivo

Fonte: `landing-page-design` di elayadesign, solo la parte B, con i valori TuffRat in fondo. Quando una regola qui sotto contrasta con un default del framework, vince questo file. Quando il prompt dell'utente contrasta con una regola, vince l'utente. Per il 3D (R3F) valgono solo B7 (motion) e B9 (stati): il resto riguarda il DOM.

# PART B — Sistema visivo



Every visual value must resolve through these rules instead of being invented ad hoc.

## B1. Typography

### Fonts

**Use:** Geist, Manrope, Geist Mono, Poppins.

**Never use:** Inter, Roboto, Arial, Open Sans, Helvetica.

**Never use italic fonts** anywhere in the interface.

**One typeface per site.** Do not pair two fonts unless the prompt explicitly asks for it. Geist Mono is allowed alongside a primary font only for code, data, or numeric UI where a monospace is functionally required.

**Never use ultra bold weights** (900 / black). Cap at semibold or bold.

### Copy rules

**No hyphens in text.** Do not use `-` inside body copy, headings, or labels. Rewrite the phrase instead.

**No orphaned words.** A single word must never sit alone on the last line. Apply `text-wrap: balance` for headings and `text-wrap: pretty` for body copy.

### Type scale

Always resolve font sizes to Tailwind's default type scale. Never leave arbitrary values in place, including `text-[19px]`, `font-size: 22px`, or `1.4rem`.

If an existing size does not land exactly on a step, snap it to the **closest step below**, taking both the size and its paired line height.

| Class | Size | Line height |
|---|---|---|
| `text-xs` | 12px (0.75rem) | 16px |
| `text-sm` | 14px (0.875rem) | 20px |
| `text-base` | 16px (1rem) | 24px |
| `text-lg` | 18px (1.125rem) | 28px |
| `text-xl` | 20px (1.25rem) | 28px |
| `text-2xl` | 24px (1.5rem) | 32px |
| `text-3xl` | 30px (1.875rem) | 36px |
| `text-4xl` | 36px (2.25rem) | 40px |
| `text-5xl` | 48px (3rem) | 1 |
| `text-6xl` | 60px (3.75rem) | 1 |
| `text-7xl` | 72px (4.5rem) | 1 |
| `text-8xl` | 96px (6rem) | 1 |
| `text-9xl` | 128px (8rem) | 1 |

Do not combine scale snapping with independently set custom line heights elsewhere in an audit. Tracking and line height may only be adjusted **within** the value the matched step already provides, so the two rules never fight each other.

### Text styles

Every piece of text uses one of these named styles. Never style text with a loose size and weight. Use the names exactly as written, including capitalization.

| Style | Scale step | Size / line height | Weight |
|---|---|---|---|
| Heading 1 | `text-6xl` | 60 / 60 | Semibold |
| Heading 2 | `text-5xl` | 48 / 48 | Semibold |
| Heading 3 | `text-4xl` | 36 / 40 | Semibold |
| Heading 4 | `text-3xl` | 30 / 36 | Semibold |
| Heading 5 | `text-2xl` | 24 / 32 | Semibold |
| Heading 6 | `text-xl` | 20 / 28 | Semibold |
| Title 1 | `text-xl` | 20 / 28 | Medium |
| Title 2 | `text-lg` | 18 / 28 | Medium |
| Title 3 | `text-base` | 16 / 24 | Medium |
| Title 4 | `text-sm` | 14 / 20 | Medium |
| Title 5 | `text-xs` | 12 / 16 | Medium |
| Body 1 | `text-base` | 16 / 24 | Semibold |
| Body 2 | `text-base` | 16 / 24 | Medium |
| Body 3 | `text-base` | 16 / 24 | Regular |
| Body 4 | `text-sm` | 14 / 20 | Semibold |
| Body 5 | `text-sm` | 14 / 20 | Medium |
| Body 6 | `text-sm` | 14 / 20 | Regular |
| Button-lg | `text-lg` | 18 / 28 | Semibold |
| Button-md | `text-base` | 16 / 24 | Semibold |
| Button-sm | `text-sm` | 14 / 20 | Semibold |
| Button-Xsm | `text-xs` | 12 / 16 | Semibold |
| Caption 1 | `text-sm` | 14 / 20 | Medium |
| Caption 2 | `text-sm` | 14 / 20 | Regular |
| Caption 3 | `text-xs` | 12 / 16 | Semibold |
| Caption 4 | `text-xs` | 12 / 16 | Medium |
| Caption 5 | `text-xs` | 12 / 16 | Regular |

How the groups work:

- **Heading** for page and section headings, largest to smallest. Heading 1 is the hero.
- **Title** for card titles, list item titles, labels that lead a block, and nav items.
- **Body** for running text. Within each size, 1 is the strongest weight and the last is regular.
- **Button** for text inside buttons only. Main buttons use Button-md, small header buttons use Button-sm.
- **Caption** for metadata, helper text, badges, timestamps, and fine print.

The sizes come from the type scale above, so a style never introduces an off scale value. If a project needs a new style, add the next number in its group (for example Body 7) built from a scale step, rather than inventing a new name.

In code, define each style once as a reusable class or token with the same name in kebab case (`heading-1`, `body-4`, `button-md`, `caption-2`) and apply that, instead of repeating size and weight utilities on every element.

## B2. Spacing

Only these values. Nothing between them, nothing outside them.

| Token | Value |
|---|---|
| Spacing-0 | 0 |
| Spacing-25 | 2px |
| Spacing-50 | 4px |
| Spacing-75 | 8px |
| Spacing-100 | 12px |
| Spacing-200 | 16px |
| Spacing-300 | 24px |
| Spacing-400 | 32px |
| Spacing-500 | 40px |
| Spacing-600 | 48px |
| Spacing-700 | 64px |
| Spacing-800 | 80px |
| Spacing-900 | 96px |

**Main buttons:** 8px vertical padding, 12px horizontal padding.

## B3. Corner radius

Only use Tailwind's radius values.

**Nested radius formula.** When a shape sits inside another shape and the gap between them is **less than 32px**:

```
inner radius = outer radius − gap
```

Apply this only when the result is **greater than 2**. Below that, leave the inner shape square or unchanged.

Example: an outer card at `rounded-2xl` (16px) with 8px of internal padding gives an inner element an 8px radius (`rounded-lg`).

## B4. Borders and backgrounds

- **Never apply a border to only one side of a card.** Borders go all the way around or not at all.
- **Never use gradients in backgrounds.** Backgrounds are flat.

### Dark mode background colors

Use only these:

`#000000` · `#181818` · `#1F1F1F` · `#272727` · `#313131` · `#131209`

## B6. Icons

**Use:** Phosphor, Solar, or Iconamoon.

**Never use:** Material Icons, Material Symbols.

## B7. Motion

Motion should feel weighted and decelerate into place. Never ship a browser default curve (`ease`, `linear`, `ease-in-out`).

**Base curve:** `ease-[cubic-bezier(0.22,1,0.36,1)]` with `duration-500` for layout and position changes. Color and opacity shifts on hover may use `duration-300`, never shorter than 200ms.

Animate only `transform` and `opacity`. Never animate `top`, `left`, `width`, or `height`.

Respect `prefers-reduced-motion`: replace movement with a plain opacity change.

### Navigation

**Resting state.** A compact bar that floats off the top edge rather than sitting flush against it, centered and sized to its content. It uses a translucent surface over a background blur so page content stays faintly visible behind it. Spacing comes from B2, radius from B3.

**Menu toggle.** The open and close icon transforms between its two states instead of swapping instantly. Use an icon from B6 or draw the lines yourself; either way the change is animated with the base curve.

**Mobile menu.** Opens as a full height panel, not a small dropdown. The panel background uses the theme's base surface at high opacity with a strong blur.

**Link entrance.** Links inside the open menu arrive one after another in reading order, each moving up a short distance (Spacing-300, 24px) while fading in. Step each item 60ms after the previous one and cap the total sequence at 400ms so long menus never feel slow.

### Scroll reveals

Sections entering the viewport rise a short distance (Spacing-400, 32px) and fade from 0 to full opacity over 600 to 800ms on the base curve. Reveal each section once; do not replay on scroll back up.

Trigger reveals with `IntersectionObserver` or GSAP ScrollTrigger (Framer Motion is not used in this project). Never attach work to an unthrottled `window.addEventListener('scroll')`, since it runs on every frame and drags down mobile performance.

---

## B9. States

Every interactive element ships with its full state set:

- **Hover** — background shift, slight scale, or translate
- **Active** — `scale(0.98)` or `translateY(1px)` for physical feedback
- **Focus** — a visible focus ring. Accessibility requirement, not optional.
- **Loading** — skeleton loaders shaped like the real layout, not circular spinners
- **Empty** — a composed "getting started" view, never a blank panel
- **Error** — inline and specific. Never `window.alert()`.

No dead links. A button pointing at `#` is either linked or visually disabled. The current page must be indicated in the navigation.

## B10. Ship requirements

Things that get forgotten and make a page feel unfinished:

- Privacy policy and terms links in the footer
- A custom, branded 404
- Client side form validation for email format and required fields
- A skip to content link for keyboard users
- Cookie consent where the jurisdiction requires it
- A branded favicon
- `<title>`, meta description, `og:image`, and social sharing tags
- Alt text on every meaningful image
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<aside>`, `<section>`
- A way back from every page
- A check at 390px wide: no horizontal overflow, buttons keep their text inside, and the primary action is visible in the first screen

---

# Valori TuffRat (sezione da modificare, il resto segue)

Palette (dal sito attuale, confermata come base): sfondo `#f7f7f5` (bianco caldo), testo `#111`, attenuato `#555`, card `#fff`, bordo `#e4e4e0`, accento `#111`. Ombra `0 10px 30px rgba(0,0,0,0.06)`. Niente gradienti di sfondo. Il muro 3D e il banco possono avere texture, ma il DOM resta piatto.

Tipografia UI: **Manrope** (unico typeface del sito; Inter attuale va sostituito). Niente corsivo nell'interfaccia: la citazione dell'artista si rende con virgolette e peso Medium, non in italico. Il lettering della tag è un SVG tracciato dalla tag reale, non un font: è grafica, non testo.

Raggi: `12px` per card e pannelli (`rounded-xl`), `8px` per elementi annidati con 4px di padding, pulsanti `rounded-full` come oggi.

Motion: curva base `cubic-bezier(0.22,1,0.36,1)` anche nelle timeline GSAP (`CustomEase` o `expo.out` come equivalente più vicino); 500 ms per posizione e layout, 300 ms per colore e opacità, mai sotto 200 ms. Le transizioni di camera del `SceneRouter` restano entro 800 ms. Con `prefers-reduced-motion` ogni timeline va a `progress(1)`.

Icone: Phosphor (set unico). Niente emoji nell'interfaccia.

Cursore: personalizzato solo su puntatore fine (`pointer: fine`); su touch non esiste.
