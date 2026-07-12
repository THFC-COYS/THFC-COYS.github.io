# Lope — AI Enrollment Concierge (Concept)

An AI-powered enrollment platform concept for Grand Canyon University, serving
both **online** and **ground** (on-campus) prospective students. One guided
conversation takes a student from "curious" to a recommended degree path —
with honest cost, timeline, and a plain-language explanation of *why* —
ending in a warm handoff to an application or counselor.

> **Concept prototype only.** Not an official Grand Canyon University product.
> All programs, costs, and timelines are illustrative. No personal data is
> collected or transmitted — all state lives in the browser.

## Stack

- [Vite](https://vitejs.dev) + [React 18](https://react.dev) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) with a token-based design system
  (CSS custom properties, automatic light/dark theming)
- No backend — the matching engine runs client-side over an illustrative
  program catalog

Built to be edited in [Lovable](https://lovable.dev): import this repo via
**Lovable → New project → Import from GitHub**.

## Getting started

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
```

## Project structure

```
src/
  App.tsx                 # page composition
  index.css               # design tokens (light/dark) + shared component classes
  data/programs.ts        # illustrative program catalog + interest taxonomy
  hooks/useReveal.ts      # scroll-reveal animation hook
  components/
    Header.tsx            # sticky nav + theme toggle
    Hero.tsx              # headline, CTAs, stat strip
    Concierge.tsx         # ⭐ the interactive matcher (state machine + scoring)
    Platform.tsx          # six platform pillars
    Audiences.tsx         # online vs. ground split
    Flow.tsx              # listen → reason → recommend → hand off
    Voices.tsx            # leadership quotes
    FinalCta.tsx / Footer.tsx
```

## How the matcher works

`Concierge.tsx` walks a four-question state machine (learning mode →
interests → life stage → name), then scores every program in
`data/programs.ts`:

- +5 for a format match (online/ground), −4 for a mismatch
- +4 per overlapping interest tag
- stage nudges (e.g., graduate programs down-ranked for high-schoolers)

The top match renders with format, estimated timeline, estimated cost, a
generated "why Lope picked this" rationale, and two tappable alternatives.

## Roadmap ideas

- Swap the illustrative catalog for real GCU program + tuition data
- Wire the conversation to an LLM for open-ended Q&A
- Counselor-side dashboard (the "enrollment intelligence" layer)
- Transfer-credit and cost estimator modules
- CRM handoff (lead context payload) integration
