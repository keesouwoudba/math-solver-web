---
name: Mathematical Precision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#44474e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#495f80'
  primary: '#0f2846'
  on-primary: '#ffffff'
  primary-container: '#273e5d'
  on-primary-container: '#92a9ce'
  inverse-primary: '#b1c8ee'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#002558'
  on-tertiary: '#ffffff'
  tertiary-container: '#003a82'
  on-tertiary-container: '#7ba7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#b1c8ee'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#314867'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-math:
    fontFamily: Newsreader
    fontSize: 2.5rem
    fontWeight: '400'
    lineHeight: '1.2'
  h1-ui:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: '1.3'
  h2-ui:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: '500'
    lineHeight: '1.3'
  body-main:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.5'
  math-inline:
    fontFamily: Newsreader
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  keypad-label:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  container-margin: clamp(1rem, 5vw, 2.5rem)
  grid-gutter: 1rem
---

## Brand & Style

This design system is engineered for intellectual rigor and technical clarity. The brand personality is clinical yet empowering, removing visual noise to allow complex mathematical logic to take center stage. 

The style blends **Minimalism** with **Corporate Modern** sensibilities, utilizing a disciplined card-based architecture. It evokes the feeling of a high-end physical graphing calculator translated into a digital medium. The emotional response is one of reliability and "computational confidence"—the user should feel that the interface is as precise as the equations they are solving.

## Colors

The palette is anchored by **Slate Blue**, providing a sophisticated, engineering-grade foundation. **Emerald Green** serves as the primary action color, signaling success and completion, while **Scientific Blue** is reserved for interactive states and secondary highlights.

- **Primary (Slate Blue):** Used for structural elements, headers, and primary branding.
- **Success (Emerald):** Reserved for "Solve" actions, correct answers, and positive deltas.
- **Action (Scientific Blue):** Used for links, selection states, and secondary buttons.
- **Backgrounds:** A crisp White or ultra-light Slate Gray (`#F8FAFC`) to maintain high contrast and readability.

## Typography

The typography strategy employs a technical, functional split. **Inter** handles the body text for maximum legibility during long reading sessions. **Space Grotesk** is used for headlines and UI labels (like button text and keypad characters), providing a consistent technical, geometric edge across all interactive elements.

For all mathematical expressions, **Newsreader** serves as the LaTeX-style serif. Its high x-height and elegant Italics ensure that variables, exponents, and integrals remain distinct and readable even in dense formulas.

## Layout & Spacing

This design system utilizes a **fluid grid** model with a modular 4px base unit. 

- **Desktop:** A 12-column system with a maximum container width of 1440px. 
- **Mobile:** A single-column flow with a focus on the "Bottom-Sheet" keypad pattern for ergonomic math entry.
- **Card Spacing:** Use `xl` (40px) padding for primary workspace cards and `md` (16px) for secondary utility cards.

The layout prioritizes a large "Work Canvas" area, with tools and history panels occupying sidebars that collapse into drawers on mobile devices.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. 

- **Level 0 (Background):** Solid Slate-White (`#F8FAFC`).
- **Level 1 (Cards/Work Area):** Pure White surface with a 1px border (`#E2E8F0`).
- **Level 2 (Active Keypad/Modals):** Pure White surface with a subtle ambient shadow (0px 4px 20px rgba(15, 23, 42, 0.05)) to distinguish it as an interactive overlay.
- **Focus States:** 2px Scientific Blue ring with 2px offset to ensure accessibility during rapid keyboard navigation.

## Shapes

The shape language is disciplined and "Soft-Industrial." A uniform `0.25rem` (4px) radius is applied to standard inputs and small buttons. Larger cards and the math keypad use `rounded-lg` (8px) to soften the density of the engineering interface. This prevents the UI from appearing too aggressive while maintaining a professional, structured look.

## Components

### Custom Keypad
The centerpiece of the application. Keys use a high-contrast state system:
- **Default:** Light gray surface, dark slate text using **Space Grotesk**.
- **Operation Keys:** Slate Blue background, white text.
- **Action (Solve):** Emerald Green background, white text.
- **Press State:** Inward 2px offset to simulate tactile feedback.

### Cards
Cards are the primary container for equations and result sets. They feature a 1px border and no shadow. The header of each card should use the `label-caps` typography in **Space Grotesk** for categorizing math branches (e.g., CALCULUS, TRIGONOMETRY).

### Buttons
Primary buttons are solid Emerald or Slate Blue. Ghost buttons with 1px Scientific Blue borders are used for secondary operations like "Clear" or "Copy LaTeX."

### Input Fields
Mathematical input fields must auto-expand vertically. They utilize a distinct Scientific Blue left-border accent when focused to indicate active data entry.

### Chips
Used for variables or saved constants. These are pill-shaped with a light Slate Blue tint background to distinguish them from interactive buttons.