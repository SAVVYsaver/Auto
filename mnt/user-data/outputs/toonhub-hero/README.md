# TOONHUB — Character Figurine Carousel Hero

A full-viewport hero section built with React + TypeScript + Vite + Tailwind CSS, using `lucide-react` for icons.

## Run it

```bash
npm install
npm run dev
```

## What's inside

- `src/ToonhubHero.tsx` — the hero component (state machine for the 4-item carousel, role-based positioning for center/left/right/back, 650ms crossfades on background color, position, scale, blur, and opacity).
- `src/main.tsx` — mounts the component.
- `index.html` — loads the Anton + Inter fonts.
- `tailwind.config.js`, `postcss.config.js` — Tailwind setup.

## Behavior

- Click the left/right circular arrow buttons to rotate which figurine is centered.
- While a transition is in flight (650ms), further clicks are ignored via an `isAnimating` lock.
- Below 640px viewport width the layout switches to tighter mobile sizing/positioning automatically (tracked via a `resize` listener).
