/* =====================================================================
   scroll.js
   Shared behaviour used on every page:
     1. Scroll triggered reveal animations (IntersectionObserver)
     2. Parallax layer movement
     3. Sticky navbar state + mobile menu
     4. Entry navigation active state (theme pages)
     5. Page transition overlay (wipe + embers) for navigation links
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- 1. Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 2. Parallax ---------- */
  var layers = document.querySelectorAll('.parallax__layer[data-speed]');
  var ticking = false;
  function applyParallax() {
    var vh = window.innerHeight;
    layers.forEach(function (layer) {
      var rect = layer.parentElement.getBoundingClientRect();
      var progress = (rect.top + rect.height / 2 - vh / 2);
      var speed = parseFloat(layer.getAttribute('data-speed')) || 0;
      layer.style.transform = 'translate3d(0,' + (progress * speed) + 'px,0)';
    });
    ticking = false;
  }
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }
  if (layers.length) {
    window.addEventListener('scroll', onScroll, { passive: true });
    applyParallax();
  }

  /* ---------- 3. Navbar ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }, { passive: true });

    var toggle = nav.querySelector('.nav__toggle');
    var links = nav.querySelector('.nav__links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        links.classList.toggle('open');
        nav.classList.toggle('menu-open');
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          nav.classList.remove('menu-open');
        });
      });
    }
  }

  /* ---------- 4. Entry nav active state ---------- */
  var entryNavLinks = document.querySelectorAll('.entry-nav a');
  if (entryNavLinks.length) {
    var sections = [];
    entryNavLinks.forEach(function (a) {
      var id = a.getAttribute('href');
      if (id && id.charAt(0) === '#') {
        var el = document.querySelector(id);
        if (el) sections.push({ link: a, el: el });
      }
    });
    window.addEventListener('scroll', function () {
      var pos = window.scrollY + window.innerHeight * 0.35;
      var current = null;
      sections.forEach(function (s) {
        if (s.el.offsetTop <= pos) current = s.link;
      });
      entryNavLinks.forEach(function (a) { a.classList.remove('active'); });
      if (current) current.classList.add('active');
    }, { passive: true });
  }

  /* ---------- 5. Page transition overlay ---------- */
  var overlay = document.getElementById('transition-overlay');

  // Build ember petals inside the overlay once.
  function seedEmbers() {
    if (!overlay) return;
    var layer = overlay.querySelector('.ember-layer');
    if (!layer || layer.childElementCount) return;
    for (var i = 0; i < 26; i++) {
      var e = document.createElement('span');
      e.className = 'ember';
      var size = 3 + Math.random() * 6;
      e.style.cssText =
        'position:absolute;bottom:-20px;left:' + (Math.random() * 100) + '%;' +
        'width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
        'background:radial-gradient(circle,#e7c879,#c0192c);' +
        'opacity:' + (0.4 + Math.random() * 0.6) + ';' +
        'animation:emberRise ' + (1.4 + Math.random() * 1.8) + 's linear ' +
        (Math.random() * 0.6) + 's infinite;';
      layer.appendChild(e);
    }
  }
  seedEmbers();

  // Reveal: play wipe-out on load so each page dissolves in.
  if (overlay) {
    overlay.classList.add('wipe-in');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.remove('wipe-in');
        overlay.classList.add('wipe-out');
      });
    });
  }

  // Intercept links that carry data-transition for an animated exit.
  function navigateWith(href) {
    if (!overlay) { window.location.href = href; return; }
    overlay.classList.remove('wipe-out');
    overlay.classList.add('wipe-in');
    setTimeout(function () { window.location.href = href; }, 720);
  }
  document.querySelectorAll('[data-transition]').forEach(function (link) {
    link.addEventListener('click', function (ev) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      ev.preventDefault();
      navigateWith(href);
    });
  });

  // Inject the ember keyframes (kept in JS so overlay markup stays minimal).
  var style = document.createElement('style');
  style.textContent =
    '@keyframes emberRise{0%{transform:translateY(0) scale(1);opacity:0}' +
    '15%{opacity:1}100%{transform:translateY(-110vh) scale(0.3);opacity:0}}';
  document.head.appendChild(style);
})();
