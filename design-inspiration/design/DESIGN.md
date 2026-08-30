---
name: Earthy Kinetic
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbd9da'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efedee'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#42474a'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f1'
  outline: '#73787b'
  outline-variant: '#c3c7ca'
  surface-tint: '#4f616a'
  primary: '#000508'
  on-primary: '#ffffff'
  primary-container: '#0d2028'
  on-primary-container: '#758892'
  inverse-primary: '#b6c9d4'
  secondary: '#964900'
  on-secondary: '#ffffff'
  secondary-container: '#ff8000'
  on-secondary-container: '#5e2b00'
  tertiary: '#040301'
  on-tertiary: '#ffffff'
  tertiary-container: '#201d18'
  on-tertiary-container: '#8a857d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e6f1'
  primary-fixed-dim: '#b6c9d4'
  on-primary-fixed: '#0b1e26'
  on-primary-fixed-variant: '#374952'
  secondary-fixed: '#ffdcc7'
  secondary-fixed-dim: '#ffb787'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#723600'
  tertiary-fixed: '#e8e1d9'
  tertiary-fixed-dim: '#ccc6bd'
  on-tertiary-fixed: '#1e1b16'
  on-tertiary-fixed-variant: '#4a4640'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  section-desktop: 160px
  section-mobile: 80px
  gutter: 32px
  container-max: 1440px
---

## Brand & Style

The design system evolves the professional core of the brand into a "human-centric" solar narrative. It captures the warmth of natural light and the stability of modern infrastructure. The personality is **warm, ambitious, and high-energy**, shifting away from purely clinical corporate visuals toward an editorial, lifestyle-focused aesthetic.

The visual style is a blend of **Minimalism and High-Contrast / Bold**, defined by:
- **Natural Immersion:** Large-scale photography using "golden hour" lighting to create an emotional connection to solar energy.
- **Visual Anchors:** High-impact, oversized typography and saturated color blocks that command attention.
- **Narrative Transitions:** Instead of standard horizontal banding, the layout uses integrated visual stories where color and imagery bleed into new sections.
- **Kinetic Energy:** A sense of movement achieved through asymmetrical layouts and vibrant, warm accents.

## Colors

The palette transitions from a foundation of professional neutrals to a high-energy "Daylight" spectrum. 

- **Primary (Deep Teal-Navy):** A refined, darker slate (#0d2028) that represents "Trust" and "Logic." Used for primary text and structural UI elements.
- **Secondary (Kinetic Orange):** A vibrant, high-energy orange (#ff8000). The signature color for high-contrast CTAs and active states.
- **Tertiary (Warm Sand):** A soft, earthy background neutral (#f4ede4) that replaces sterile whites to create a more inviting, human feel.
- **Neutral:** Pure blacks are avoided in favor of the primary deep teal-navy to maintain a sophisticated depth.

Color is used to tell a story; transitions between sections should feel like a sunset or a clear morning, utilizing gradients that feel atmospheric rather than digital.

## Typography

The typography system is unified through a clean, modern Grotesk typeface, providing a seamless transition between high-impact headlines and functional body copy.

- **Headlines & Body:** **Hanken Grotesk** is used across the entire hierarchy. Its neutral, professional profile and high legibility ensure clarity. In headline roles, weight and scale are used to provide the "human-centric" authority previously established.
- **Technical Accents:** **JetBrains Mono** is used for data points, "step" indicators, and small UI labels to maintain the technical "logic" heritage of the brand, providing a sharp, monospaced contrast to the primary typeface.

## Layout & Spacing

The layout is characterized by **generous whitespace and high-impact visual anchors**. 

- **Grid:** A 12-column fixed grid for desktop (1440px max) with wide 32px gutters to prevent content density. 
- **Rhythm:** A 4px base unit is used, but major components utilize larger leaps (16px, 32px, 64px) to create an airy, premium feel.
- **Asymmetry:** Content is often offset—for example, a headline may span columns 1-6 while the supporting imagery spans 8-12, creating dynamic eye movement.
- **Transitions:** Vertical spacing between sections is intentionally large (160px) to allow for immersive background transitions and high-resolution imagery to dominate the viewport.

## Elevation & Depth

Elevation is achieved through **refined, subtle shadows** and **tonal layering**, avoiding heavy skeuomorphism.

- **Refined Shadows:** Shadows are highly diffused and tinted with the primary deep teal-navy color. For active cards, use a "lift" effect: `0px 20px 40px rgba(13, 32, 40, 0.06)`.
- **Integrated Surfaces:** Depth is often suggested by overlapping elements—placing a high-contrast card slightly over a photograph to create a physical "stacked" relationship.
- **Glassmorphism:** Reserved strictly for navigation overlays and floating UI controllers to keep the focus on the natural background lighting. Use a background blur of 12px and 80% opacity.

## Shapes

The shape language is **Soft (0.25rem - 0.75rem)**, moving away from "pill" shapes toward a more architectural, structured look that feels permanent and reliable.

- **Primary UI (Buttons/Inputs):** 4px (0.25rem) radius for a sharp, professional edge.
- **Containers (Cards):** 8px (0.5rem) radius to provide a slight softening of the data-heavy content.
- **Imagery:** Large immersive photos remain sharp (0px) to act as architectural "windows" within the layout.

## Components

### Buttons
Primary buttons are high-contrast kinetic orange with primary deep teal-navy text. They use a sharp 4px corner and bold typography. On hover, the shadow deepens to create a "tactile" press effect.

### Cards
Cards are designed as "High-Impact Anchors." They utilize the Tertiary (Warm Sand) or white backgrounds with thin, low-opacity borders (1px primary navy at 10% opacity). They should never feel cluttered; internal padding should be at least 40px.

### Input Fields
Inputs follow a "minimalist-tech" look: no background fill, only a bottom border (2px) that thickens and changes to kinetic orange upon focus. Labels use the `label-sm` monospace font.

### Progress & Steps
Step indicators (1, 2, 3) are oversized and use the primary font (**Hanken Grotesk**) in a faded "outline" style or a subtle tone, acting as a background element that guides the user through the narrative.

### Immersive Imagery
Imagery is treated as a component. It should occupy full-width or large-column spans, always featuring natural light sources (sun, glow) that interact with the surrounding UI elements.
