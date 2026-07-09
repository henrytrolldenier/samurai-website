/* =====================================================================
   sakura.js
   Continuous falling cherry blossom petals drawn on a fixed canvas.
   Lightweight 2D canvas system, capped particle count for performance.
   Used on every page.
   ===================================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('sakura-canvas');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var w, h, dpr;
  var petals = [];

  // Scale petal count with screen size, but keep it modest for smoothness.
  function petalCount() {
    var base = Math.round((window.innerWidth * window.innerHeight) / 38000);
    return Math.max(14, Math.min(reduced ? 10 : 46, base));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  var palette = ['#f7c9d4', '#e7a6b6', '#d98a9c', '#c9a24b', '#f0d7dd'];

  function Petal(seed) {
    this.reset(seed);
  }
  Petal.prototype.reset = function (initial) {
    this.x = Math.random() * w;
    this.y = initial ? Math.random() * h : -20;
    this.size = 6 + Math.random() * 9;
    this.speedY = 0.4 + Math.random() * 1.1;
    this.speedX = -0.4 + Math.random() * 0.8;
    this.sway = Math.random() * Math.PI * 2;
    this.swaySpeed = 0.01 + Math.random() * 0.02;
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = -0.02 + Math.random() * 0.04;
    this.color = palette[(Math.random() * palette.length) | 0];
    this.alpha = 0.45 + Math.random() * 0.5;
  };
  Petal.prototype.update = function () {
    this.sway += this.swaySpeed;
    this.x += this.speedX + Math.sin(this.sway) * 0.6;
    this.y += this.speedY;
    this.rot += this.rotSpeed;
    if (this.y > h + 24 || this.x < -40 || this.x > w + 40) this.reset(false);
  };
  Petal.prototype.draw = function () {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    // Petal shape: two curved lobes.
    var s = this.size;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.bezierCurveTo(s * 0.5, -s * 0.5, s * 0.5, s * 0.4, 0, s * 0.55);
    ctx.bezierCurveTo(-s * 0.5, s * 0.4, -s * 0.5, -s * 0.5, 0, -s * 0.5);
    ctx.fill();
    ctx.restore();
  };

  function build() {
    petals = [];
    var n = petalCount();
    for (var i = 0; i < n; i++) petals.push(new Petal(true));
  }

  var running = true;
  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(loop);
  }

  // Pause when the tab is hidden to save resources.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      loop();
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); build(); }, 200);
  });

  resize();
  build();
  loop();
})();
