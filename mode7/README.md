# Mode7 Demo

Scanline-based perspective rendering in HTML5 `<canvas>`, styled after the classic SNES "Mode 7"
background effect. Drive it with arrow keys, or click/hold the canvas (top third = forward, bottom
third = reverse, left/right thirds = turn).

Read [the full article](https://jonnymatic.com/blog/gamedev-mode7-html5/) for:

- The viewport math (field-of-view, camera height/tilt, per-scanline trapezoidal sampling)
- How the real SNES hardware did this in the pixel pipeline for free, vs. this software version's
  180-`drawImage()`-calls-per-frame brute force
- The affine-transform math underlying each scanline's draw, and why varying the sample width
  per scanline is what fakes perspective

## Run it

No build step, no dependencies. Just open `index.html` in a browser:

```
open index.html
```

or double-click it in a file browser.

## Files

- `index.html` — markup, layout, and the parameter sliders
- `mode7.js` — the demo logic (viewport math, input handling, render loop), plain vanilla JS
- `mariocircuit.png` — the ground texture the demo drives over
