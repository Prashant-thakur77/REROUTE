# UI Redesign — Design System Foundation + Landing Page

**Date:** 2026-07-25
**Status:** Approved (all recommended options)

## Goal

Elevate REROUTE's UI to an award-winning bar, starting with a global design-system
foundation and a fully rebuilt landing page. Remove the "STACK OVERFLOWED" footer
credit (done).

## Decisions

- **Motion split:** Bold, editorial, motion-rich on public surfaces (landing, sign-in);
  refined/restrained + fast in the data-dense app (dashboard, digital-twin canvas,
  simulation).
- **Phase 1 deliverable:** design-system foundation + landing fully rebuilt; app inherits
  refreshed tokens for consistency.
- **Identity:** keep the warm-cream light palette (`#F6F3EE`) — bolder, not replaced.
- **Type:** pair **Fraunces** (editorial display serif) for headlines with **Inter** for body.
- **Approach:** refactor the 725-line inline-CSS `app/page.tsx` monolith into composed,
  token-driven section components; rebuild each with Framer Motion + GSAP (already installed).

## Architecture

### 1. Design-system foundation
- `app/globals.css`: keep existing token set; add **motion tokens** (`--dur-*`, `--ease-*`)
  and a display-font var (`--font-fraunces`). Light polish to shadows/contrast only.
- `tailwind.config.ts`: add `fontFamily.display` → Fraunces; add reusable keyframes
  (marquee, float, shimmer) + `prefers-reduced-motion` respected in components.
- `app/layout.tsx`: load Fraunces via `next/font/google`, expose `--font-fraunces`.

### 2. Motion primitives (`components/motion/`)
Small, reusable, reduced-motion-aware:
- `Reveal` — scroll-into-view fade/slide (Framer `whileInView`).
- `AnimatedCounter` — counts a number up when it enters the viewport.
- `Marquee` — infinite horizontal scroll strip.
- `MagneticButton` — cursor-follow hover for hero CTAs.

### 3. Landing rebuild (`components/home-page/landing/`)
Decompose into section components, preserving all existing copy/messaging:
- `LandingNav` (sticky, glass) · `HeroSection` (oversized Fraunces headline, animated
  route/network backdrop, live "Control Center" preview, floating alert cards) ·
  `TrustMarquee` (Maersk/DHL/…) · `ProblemSolution` (73% stat, pain vs. check) ·
  `StatsBand` (dark, animated counters: 0.885 ROC-AUC, <1ms, 180K, 6 agents) ·
  `FeatureDigitalTwin` · `FeatureAgents` (6-agent grid) · `FeatureSimulation`
  (alert cards) · `CtaSection`.
- New `app/page.tsx` composes these; the inline `<style>` block is deleted.

### 4. App-wide consistency
Token changes propagate automatically through shadcn/Tailwind. No heavy per-page
motion; deeper per-page redesigns are explicitly deferred to later phases.

## Non-goals (this phase)
- Bespoke redesign of every in-app screen (future phases).
- Backend/agent changes.

## Success criteria
- No "stack overflowed" text anywhere.
- Landing rebuilt from composed token-driven components; inline-CSS monolith gone.
- Fraunces headlines + Inter body live; warm-cream identity preserved.
- `tsc --noEmit` clean; `pnpm build` succeeds.
- Motion respects `prefers-reduced-motion`.
