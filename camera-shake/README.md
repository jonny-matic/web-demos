# Camera Shake Demo

A screen-shake model: randomized amplitudes at a fixed frequency, linearly interpolated, with a
linear decay so the effect wears off smoothly. Two timeline graphs show the underlying X/Y shake
functions; the view canvas applies them to a static image.

Read [the full article](https://jonnymatic.com/blog/gamedev-camera-shake/) for the `Shake` class
in full (constructor, `amplitude()`, `noise()`, `decay()`) and why randomized samples work just as
well as Perlin noise for this.

## Run it

No build step, no dependencies. Just open `index.html` in a browser:

```
open index.html
```

or double-click it in a file browser.

## Files

- `index.html` — markup, layout, and the duration/frequency/amplitude fields
- `shake.js` — the `Shake` class and the demo logic (timeline graphs, render loop), plain vanilla JS
- `image.jpg` — the image the view canvas shakes
