/* Camera-shake demo — vanilla JS, no dependencies, no build step.
 *
 * Ported from the version running at jonnymatic.com/blog/gamedev-camera-shake/
 * (originally published 2016 as a Prototype.js demo). Read the article for the full
 * explanation of the model — randomized amplitudes at a fixed frequency, linearly
 * interpolated, with a linear decay: https://jonnymatic.com/blog/gamedev-camera-shake/
 *
 * Modernized only at the DOM boundary (native addEventListener/rAF/canvas APIs instead
 * of Prototype.js's Event.observe/Element()/$()) — the Shake class itself (constructor,
 * amplitude, noise, decay) is untouched from the original, including its exact sample-
 * count formula and noise()'s return-0-past-the-end fallback.
 */

/**
 * @class Initializes a 1D shaking pattern
 * @param {int} duration The length of the shake in milliseconds
 * @param {int} frequency The frequency of the shake in Hertz
 */
var Shake = function (duration, frequency) {
  // The duration in milliseconds
  this.duration = parseInt(duration, 10);

  // The frequency in Hz
  this.frequency = parseInt(frequency, 10);

  // The sample count = number of peaks/valleys in the Shake
  var sampleCount = (duration / 1000) * frequency;

  // Populate the samples array with randomized values between -1.0 and 1.0
  this.samples = [];
  for (var i = 0; i < sampleCount; i++) {
    this.samples.push(Math.random() * 2 - 1);
  }

  // Init the time variables
  this.startTime = null;
  this.t = null;

  // Flag that represents if the shake is active
  this.isShaking = false;
};

/**
 * Start the shake, initializing time variables and flags
 */
Shake.prototype.start = function () {
  this.startTime = new Date().getTime();
  this.t = 0;
  this.isShaking = true;
};

/**
 * Update the shake, setting the current time variable
 */
Shake.prototype.update = function () {
  this.t = new Date().getTime() - this.startTime;
  if (this.t > this.duration) this.isShaking = false;
};

/**
 * Retrieve the amplitude. If "t" is passed, it will get the amplitude for the
 * specified time, otherwise it will use the internal time.
 * @param {int} t (optional) The time since the start of the shake in milliseconds
 */
Shake.prototype.amplitude = function (t) {
  // Check if optional param was passed
  if (t == undefined) {
    // return zero if we are done shaking
    if (!this.isShaking) return 0;
    t = this.t;
  }

  // Get the previous and next sample
  var s = (t / 1000) * this.frequency;
  var s0 = Math.floor(s);
  var s1 = s0 + 1;

  // Get the current decay
  var k = this.decay(t);

  // Return the current amplitude
  return (this.noise(s0) + (s - s0) * (this.noise(s1) - this.noise(s0))) * k;
};

/**
 * Retrieve the noise at the specified sample.
 * @param {int} s The randomized sample we are interested in.
 */
Shake.prototype.noise = function (s) {
  // Retrieve the randomized value from the samples
  if (s >= this.samples.length) return 0;
  return this.samples[s];
};

/**
 * Get the decay of the shake as a floating point value from 0.0 to 1.0
 * @param {int} t The time since the start of the shake in milliseconds
 */
Shake.prototype.decay = function (t) {
  // Linear decay
  if (t >= this.duration) return 0;
  return (this.duration - t) / this.duration;
};

(function () {
  var DURATION = 2000;
  var FREQUENCY = 40;
  var AMPLITUDE = 32;

  var tempCanvasArr = [];
  var tempContextArr = [];

  var canvasArr = [];
  var contextArr = [];

  var canvas, context, image;

  var xShake = null;
  var yShake = null;

  var startTime = null;

  var WIDTH, HEIGHT;

  function main() {
    image = document.getElementById('image');

    tempCanvasArr.push(document.createElement('canvas'));
    tempCanvasArr.push(document.createElement('canvas'));

    canvasArr.push(document.getElementById('canvas_a'));
    canvasArr.push(document.getElementById('canvas_b'));

    WIDTH = canvasArr[0].width;
    HEIGHT = canvasArr[0].height;

    tempCanvasArr[0].width = WIDTH;
    tempCanvasArr[0].height = HEIGHT;
    tempCanvasArr[1].width = WIDTH;
    tempCanvasArr[1].height = HEIGHT;

    canvas = document.getElementById('canvas_v');
    context = canvas.getContext('2d');

    document.getElementById('shakeBtn').addEventListener('click', handleStartClick);

    tempContextArr.push(tempCanvasArr[0].getContext('2d'));
    tempContextArr.push(tempCanvasArr[1].getContext('2d'));

    contextArr.push(canvasArr[0].getContext('2d'));
    contextArr.push(canvasArr[1].getContext('2d'));

    handleStartClick();
  }

  function handleStartClick() {
    DURATION = parseFloat(document.getElementById('durationTxt').value) * 1000;
    FREQUENCY = parseInt(document.getElementById('frequencyTxt').value, 10);
    AMPLITUDE = parseInt(document.getElementById('amplitudeTxt').value, 10);

    canvasArr[0].width = WIDTH;
    canvasArr[1].width = WIDTH;

    tempCanvasArr[0].width = WIDTH;
    tempCanvasArr[1].width = WIDTH;

    xShake = new Shake(DURATION, FREQUENCY);
    yShake = new Shake(DURATION, FREQUENCY);

    var t, x, y, s;

    for (s = 0; s <= xShake.samples.length; s++) {
      t = (s / xShake.frequency) * 1000;
      x = (s / xShake.samples.length) * WIDTH;
      y = (xShake.amplitude(t) * HEIGHT + HEIGHT) / 2;
      tempContextArr[0].lineTo(x, y);
    }

    for (s = 0; s <= yShake.samples.length; s++) {
      t = (s / yShake.frequency) * 1000;
      x = (s / yShake.samples.length) * WIDTH;
      y = (yShake.amplitude(t) * HEIGHT + HEIGHT) / 2;
      tempContextArr[1].lineTo(x, y);
    }

    tempContextArr[0].stroke();
    tempContextArr[1].stroke();

    xShake.start();
    yShake.start();

    startTime = new Date().getTime();

    window.requestAnimationFrame(update);
  }

  function update(t) {
    xShake.update();
    yShake.update();

    if (xShake.isShaking || yShake.isShaking) {
      window.requestAnimationFrame(update);
    }

    var ctx = context;
    canvas.width = canvas.width;

    var x = xShake.amplitude() * AMPLITUDE;
    var y = yShake.amplitude() * AMPLITUDE;
    ctx.drawImage(image, x - (800 - canvas.width) / 2, y - (600 - canvas.height) / 2);

    x = ((t - startTime) / DURATION) * WIDTH;

    ctx = contextArr[0];
    canvasArr[0].width = WIDTH;
    ctx.drawImage(tempCanvasArr[0], 0, 0);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();

    ctx = contextArr[1];
    canvasArr[1].width = WIDTH;
    ctx.drawImage(tempCanvasArr[1], 0, 0);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }

  window.addEventListener('load', main);
})();
