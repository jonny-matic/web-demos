/* Mode7-style scanline perspective demo — vanilla JS, no dependencies, no build step.
 *
 * Ported from the version running at jonnymatic.com/blog/gamedev-mode7-html5/ (originally
 * published 2016 as a jQuery demo, modernized since). Read the article for the full
 * explanation of the math and how this compares to how the real SNES hardware did it:
 * https://jonnymatic.com/blog/gamedev-mode7-html5/
 *
 * The core idea: for each of H scanlines, compute a trapezoidal region of the ground
 * texture to sample, and draw it as a thin horizontal strip in the viewport. Each strip
 * is individually just an affine transform (scale + translate) via drawImage(); what
 * makes the stack of them read as one perspective-correct floor is that the sampled
 * width shrinks as scanlines approach the horizon.
 */

/**
 * Computes, for each scanline 1..H, the source rectangle (sx, sy, sw, sh) to sample from
 * the ground texture and the destination rectangle (dx, dw) to draw it into, given the
 * current viewport parameters.
 */
function computeModes(groundWidth, groundHeight, params) {
  const { omega, theta, alpha, h, H, width } = params;
  const modes = [];

  for (let L = 1; L <= H; L++) {
    modes[L] = null;

    const w1 = (2 * h * Math.tan((Math.PI - theta) / 2 + (alpha * (L - 1)) / H)) / Math.tan(omega / 2);
    const d1 = h * Math.tan((Math.PI - theta) / 2 + (alpha * (L - 1)) / H);
    const d2 = h * Math.tan((Math.PI - theta) / 2 + (alpha * L) / H);
    const w = w1;

    if (d2 > groundHeight) continue;

    let sx = (groundWidth - w) / 2;
    const sy = groundHeight - d1;
    let sw = w;
    const sh = d2 - d1;
    let dw = width;
    let dx = 0;

    if (w > groundWidth) {
      sx = 0;
      sw = groundWidth;
      dw = width * (sw / w);
      dx = (width - dw) / 2;
    }

    modes[L] = { sx, sy, sw, sh, dx, dw };
  }

  return modes;
}

(function () {
  const WIDTH = 360;
  const HEIGHT = 200;

  const canvas = document.getElementById('canvas_v');
  const context = canvas.getContext('2d');

  let groundCanvas, groundContext, groundImage;

  // Physics
  let lastTime = null;
  let dt = 0;
  let av = 0;
  let lv = 0;
  let px = 953;
  let py = 792;
  let pa = 0;

  // Viewport
  let omega = (108 * Math.PI) / 180;
  let theta = (60 * Math.PI) / 180;
  let alpha = (45 * Math.PI) / 180;
  let h = 25;
  const H = 180;
  const LH = 1;
  let modes = [];

  const MAX_VELOCITY = 100 / 1000;
  const ANGULAR_VELOCITY = Math.PI / (4 * 1000);
  const BACKGROUND_IMG = 'mariocircuit.png';

  // Input
  const LEFT = 0, UP = 1, RIGHT = 2, DOWN = 3;
  const downKeys = [false, false, false, false];
  const codeOffset = 37; // arrow keys are keyCode 37-40; deprecated API, kept as recovered

  function setModes() {
    modes = computeModes(groundCanvas.width, groundCanvas.height, { omega, theta, alpha, h, H, width: WIDTH });
  }

  function update(t) {
    requestAnimationFrame(update);

    if (lastTime == null) lastTime = t;
    dt = t - lastTime;
    lastTime = t;

    lv = 0;
    av = 0;
    if (downKeys[LEFT] || downKeys[RIGHT] || downKeys[UP] || downKeys[DOWN]) {
      lv = MAX_VELOCITY * ((0 + Number(downKeys[DOWN])) + Number(downKeys[UP]) * -1);
      if (lv === -1) lv *= 0.5;
      av = ANGULAR_VELOCITY * ((0 + Number(downKeys[LEFT])) + Number(downKeys[RIGHT]) * -1);
    }

    pa += dt * av;
    px += dt * lv * Math.sin(pa);
    py += dt * lv * Math.cos(pa);

    // clear (the width-reassignment trick)
    groundCanvas.width = groundCanvas.width;
    canvas.width = canvas.width;

    const dx = groundCanvas.width / 2 - px;
    const dy = groundCanvas.height - py;

    groundContext.save();
    groundContext.translate(dx + px, dy + py);
    groundContext.rotate(pa);
    groundContext.translate((dx + px) * -1, (dy + py) * -1);
    groundContext.drawImage(groundImage, dx, dy);
    groundContext.restore();

    for (let L = 1; L <= H; L++) {
      const val = modes[L];
      if (val == null) continue;
      context.drawImage(groundCanvas, val.sx, val.sy, val.sw, val.sh, val.dx, HEIGHT - L * LH, val.dw, LH);
    }
  }

  function handleKeydown(event) {
    const code = event.keyCode - codeOffset;
    if (code === UP || code === DOWN || code === LEFT || code === RIGHT) {
      downKeys[code] = true;
      event.preventDefault();
    }
  }

  function handleKeyup(event) {
    const code = event.keyCode - codeOffset;
    if (code === UP || code === DOWN || code === LEFT || code === RIGHT) {
      downKeys[code] = false;
      event.preventDefault();
    }
  }

  function canvasXY(event) {
    // Scaled from CSS pixels to canvas-buffer pixels, in case the canvas is displayed
    // at a different size than its buffer (e.g. via CSS max-width).
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;
    return { x: event.offsetX * scaleX, y: event.offsetY * scaleY };
  }

  function handleMousedown(event) {
    const { x, y } = canvasXY(event);
    if (y < HEIGHT / 3) {
      downKeys[UP] = true;
    } else if (y < (HEIGHT * 2) / 3) {
      if (x < WIDTH / 2) downKeys[LEFT] = true;
      else downKeys[RIGHT] = true;
    } else {
      downKeys[DOWN] = true;
    }
  }

  function handleMouseup() {
    downKeys[UP] = downKeys[DOWN] = downKeys[LEFT] = downKeys[RIGHT] = false;
  }

  function handleUpdateValues() {
    const val = (id) => document.getElementById(id).value;
    omega = (parseInt(val('omega'), 10) * Math.PI) / 180;
    theta = (parseInt(val('theta'), 10) * Math.PI) / 180;
    alpha = (parseInt(val('alpha'), 10) * Math.PI) / 180;
    h = parseInt(val('height'), 10);
    document.getElementById('omega-v').textContent = val('omega') + '°';
    document.getElementById('theta-v').textContent = val('theta') + '°';
    document.getElementById('alpha-v').textContent = val('alpha') + '°';
    document.getElementById('height-v').textContent = val('height') + 'px';
    setModes();
  }

  function start() {
    const max = Math.ceil(Math.sqrt(2 * Math.pow(Math.max(groundImage.width, groundImage.height), 2)));
    groundCanvas = document.createElement('canvas');
    groundCanvas.width = max;
    groundCanvas.height = max;
    groundContext = groundCanvas.getContext('2d');

    setModes();
    requestAnimationFrame(update);

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyup);
    canvas.addEventListener('pointerdown', handleMousedown);
    canvas.addEventListener('pointerup', handleMouseup);
    canvas.addEventListener('pointerleave', handleMouseup);

    for (const id of ['omega', 'theta', 'alpha', 'height']) {
      document.getElementById(id).addEventListener('input', handleUpdateValues);
    }
  }

  groundImage = new Image();
  groundImage.onload = start;
  groundImage.src = BACKGROUND_IMG;
})();
