/* =====================================================================
   THE WAY OF THE SAMURAI  ·  Shared JavaScript
   - custom cursor
   - loading screen + progress
   - page transition wipes
   - scroll reveal (IntersectionObserver)
   - parallax theme headers
   - brushstroke divider injection
   - global falling sakura particles (Three.js Points)
   - per page 3D model scenes (kabuto / katana / cherry blossom)
   ===================================================================== */
(function () {
  'use strict';

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
  const HAS_THREE = typeof THREE !== 'undefined';

  /* small helpers ---------------------------------------------------- */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* keep a registry of running render loops so we can stop them ------ */
  const disposables = [];

  /* shared interaction state: smoothed cursor parallax + scroll, read by
     every 3D scene so the models feel responsive rather than on a timer ---- */
  const interaction = { mx: 0, my: 0, tx: 0, ty: 0, scrollY: 0 };
  if (!REDUCE) {
    window.addEventListener('mousemove', (e) => {
      interaction.tx = (e.clientX / window.innerWidth) * 2 - 1;
      interaction.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }
  window.addEventListener('scroll', () => { interaction.scrollY = window.scrollY; }, { passive: true });
  function updateInteraction() {
    interaction.mx = lerp(interaction.mx, interaction.tx, 0.06);
    interaction.my = lerp(interaction.my, interaction.ty, 0.06);
  }

  /* ===================================================================
     1. BRUSHSTROKE DIVIDERS
     A hand painted red ink stroke, drawn with layered organic paths.
     =================================================================== */
  const BRUSH_SVG = `
    <svg viewBox="0 0 720 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="bsg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0"   stop-color="#8b0000" stop-opacity="0"/>
          <stop offset="0.12" stop-color="#8b0000" stop-opacity="0.9"/>
          <stop offset="0.5" stop-color="#b81212" stop-opacity="1"/>
          <stop offset="0.88" stop-color="#8b0000" stop-opacity="0.9"/>
          <stop offset="1"   stop-color="#8b0000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="M8,42 C120,18 240,60 360,40 C480,22 600,58 712,38
               C600,52 480,30 360,50 C240,66 120,30 8,42 Z"
            fill="url(#bsg)"/>
      <path d="M20,44 C160,34 300,52 430,42 C540,34 640,50 700,42"
            fill="none" stroke="#5a0000" stroke-width="2.4"
            stroke-linecap="round" opacity="0.55"/>
      <circle cx="704" cy="40" r="3.2" fill="#b81212" opacity="0.8"/>
      <circle cx="688" cy="47" r="1.7" fill="#8b0000" opacity="0.6"/>
    </svg>`;

  function injectBrushstrokes() {
    $$('.brushstroke').forEach((el) => { el.innerHTML = BRUSH_SVG; });
  }

  /* ===================================================================
     2. CUSTOM CURSOR
     =================================================================== */
  function initCursor() {
    if (!FINE_POINTER || REDUCE) return;
    document.documentElement.classList.add('has-custom-cursor');

    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;

    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    // grow over interactive elements (event delegation)
    const interactiveSel = 'a, button, .theme-card, .hamburger, canvas, input, .entry-image, [data-cursor]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSel)) cursor.classList.add('cursor-grow');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSel)) cursor.classList.remove('cursor-grow');
    });

    (function loop() {
      cx = lerp(cx, mx, 0.1);
      cy = lerp(cy, my, 0.1);
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ===================================================================
     3. LOADING SCREEN
     =================================================================== */
  const Loader = (function () {
    const el = $('.loader');
    const fill = $('.progress-fill');
    const pct = $('.progress-pct');
    let done = false;
    function set(p) {
      p = clamp(Math.round(p), 0, 100);
      if (fill) fill.style.width = p + '%';
      if (pct) pct.textContent = p + ' %';
    }
    function hide() {
      if (done || !el) return;
      done = true;
      set(100);
      setTimeout(() => el.classList.add('hidden'), 350);
    }
    return { set, hide, get el() { return el; } };
  })();

  /* ===================================================================
     4. PAGE TRANSITION WIPES
     =================================================================== */
  function initTransitions() {
    const panel = $('.transition-panel');
    if (!panel) return;

    // reveal on entry: panel starts covering, slides off to the right
    if (!REDUCE) {
      panel.classList.add('cover');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.classList.remove('cover');
          panel.classList.add('reveal');
        });
      });
    }

    // intercept internal navigation
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          a.target === '_blank' || e.metaKey || e.ctrlKey) return;
      // only intercept same site .html navigation
      if (!/\.html?($|[?#])/.test(href)) return;

      e.preventDefault();
      if (REDUCE) { window.location.href = href; return; }

      panel.classList.remove('reveal');
      // bring panel in from the left to cover screen
      panel.style.transition = 'none';
      panel.style.transform = 'translateX(-100%)';
      // force reflow
      void panel.offsetWidth;
      panel.style.transition = '';
      panel.classList.add('cover');

      let navigated = false;
      const go = () => { if (!navigated) { navigated = true; window.location.href = href; } };
      panel.addEventListener('transitionend', go, { once: true });
      setTimeout(go, 750); // safety fallback
    });
  }

  /* ===================================================================
     5. SCROLL REVEAL  (IntersectionObserver)
     =================================================================== */
  function initScrollReveal() {
    const targets = $$('.reveal');
    if (REDUCE || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // stagger children by 0.1s
        const kids = $$('[data-stagger]', el);
        el.style.transitionDelay = '0s';
        el.classList.add('in-view');
        kids.forEach((k, i) => {
          k.style.transitionDelay = (i * 0.1) + 's';
          k.classList.add('in-view');
        });
        io.unobserve(el);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    targets.forEach((t) => io.observe(t));
  }

  /* ===================================================================
     6. PARALLAX HEADERS  (background 0.3x, content 1x)
     =================================================================== */
  function initParallax() {
    if (REDUCE) return;
    const layers = $$('.parallax-bg');
    if (!layers.length) return;
    let ticking = false;
    function update() {
      const y = window.scrollY;
      layers.forEach((l) => { l.style.transform = `translateY(${y * 0.3}px)`; });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ===================================================================
     7. NAV HAMBURGER
     =================================================================== */
  function initNav() {
    const burger = $('.hamburger');
    const links = $('.nav-links');
    if (!burger || !links) return;
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      links.classList.toggle('open');
    });
    $$('.nav-links a').forEach((a) =>
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        links.classList.remove('open');
      })
    );
  }

  /* ===================================================================
     8. THREE.JS SHARED HELPERS
     =================================================================== */
  // soft circular pink texture for petals
  function makePetalTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0.0, 'rgba(255,225,235,1)');
    g.addColorStop(0.35, 'rgba(255,183,206,0.95)');
    g.addColorStop(0.7, 'rgba(229,140,170,0.45)');
    g.addColorStop(1.0, 'rgba(229,140,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  // radial red glow sprite texture (for katana bloom)
  function makeGlowTexture(color) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color || 'rgba(220,40,40,0.9)');
    g.addColorStop(0.4, 'rgba(160,10,10,0.35)');
    g.addColorStop(1, 'rgba(120,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  // equirectangular gradient -> PMREM environment for PBR reflections
  function makeEnvironment(renderer) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, '#3a0d0d');   // crimson glow above
    g.addColorStop(0.28, '#140607');
    g.addColorStop(0.6, '#0a0a0a');   // dark middle
    g.addColorStop(0.82, '#1a1408');
    g.addColorStop(1.0, '#5a4716');   // warm gold glow below
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
    // a couple of soft highlights for specular life
    const hi = ctx.createRadialGradient(140, 60, 0, 140, 60, 120);
    hi.addColorStop(0, 'rgba(200,60,60,0.6)');
    hi.addColorStop(1, 'rgba(200,60,60,0)');
    ctx.fillStyle = hi; ctx.fillRect(0, 0, 512, 256);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromEquirectangular(tex).texture;
    pmrem.dispose();
    tex.dispose();
    return env;
  }

  function makeRenderer(canvas, alpha) {
    const r = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: alpha !== false,
      powerPreference: 'high-performance'
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.2;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    return r;
  }

  // recenter + scale a loaded model to a target size, returns the group.
  // `focus` (optional) is a child whose bounds drive the framing, so an asset
  // that ships with a stand or an atmospheric volume can still be framed on the
  // piece that matters.
  function fitModel(obj, targetSize, focus) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(focus || obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;
    obj.scale.setScalar(scale);
    obj.position.sub(center.multiplyScalar(scale));
    obj.traverse((n) => {
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
        if (n.material) n.material.envMapIntensity = 1.35;
      }
    });
    return obj;
  }

  function onResize(renderer, camera, canvas) {
    function resize() {
      const w = canvas.clientWidth || canvas.parentElement.clientWidth;
      const h = canvas.clientHeight || canvas.parentElement.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
    return resize;
  }

  /* ===================================================================
     9. GLOBAL SAKURA PARTICLE FIELD  (every page)
     =================================================================== */
  function initSakura() {
    const canvas = $('#sakura-canvas');
    if (!canvas || !HAS_THREE || REDUCE) {
      if (canvas && REDUCE) canvas.style.display = 'none';
      return;
    }
    const COUNT = parseInt(canvas.dataset.count, 10) || 200;

    const renderer = makeRenderer(canvas, true);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
    camera.position.z = 300;

    const W = 600, H = 400, D = 400;
    const positions = new Float32Array(COUNT * 3);
    const speed = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    const swayAmp = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * W;
      positions[i * 3 + 1] = (Math.random() - 0.5) * H;
      positions[i * 3 + 2] = (Math.random() - 0.5) * D;
      speed[i]   = 0.06 + Math.random() * 0.16;   // slow motion fall
      phase[i]   = Math.random() * Math.PI * 2;
      swayAmp[i] = 0.3 + Math.random() * 0.8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 7,
      map: makePetalTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      opacity: 0.9,
      color: 0xffc8da
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const resize = onResize(renderer, camera, canvas);

    let wind = 0, windTarget = 0, t = 0, raf;
    function tick() {
      t += 0.016;
      // occasional wind gusts
      if (Math.random() < 0.004) windTarget = (Math.random() - 0.5) * 2.4;
      windTarget *= 0.992;
      wind = lerp(wind, windTarget, 0.02);

      const pos = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        let x = pos[i * 3], y = pos[i * 3 + 1];
        y -= speed[i] * 1.0;                                   // slow motion fall
        x += Math.sin(t * speed[i] + phase[i]) * swayAmp[i] * 0.7;  // gentle sine sway
        x += wind * (0.4 + speed[i]);                          // wind gust
        if (y < -H / 2) { y = H / 2; x = (Math.random() - 0.5) * W; }
        if (x >  W / 2) x = -W / 2;
        if (x < -W / 2) x =  W / 2;
        pos[i * 3] = x; pos[i * 3 + 1] = y;
      }
      geo.attributes.position.needsUpdate = true;
      points.rotation.y = Math.sin(t * 0.05) * 0.05;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    disposables.push(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      geo.dispose(); mat.map && mat.map.dispose(); mat.dispose();
      renderer.dispose();
    });
  }

  /* ===================================================================
     10. PER PAGE 3D MODEL SCENES
     A single canvas #model-canvas carries data-type + data-src.
     =================================================================== */
  function initModel() {
    const canvas = $('#model-canvas');
    if (!canvas) { return false; }
    if (!HAS_THREE || typeof THREE.GLTFLoader === 'undefined') {
      Loader.hide();
      return false;
    }
    const type = canvas.dataset.type;          // kabuto | katana | sakura
    const src  = canvas.dataset.src;
    const isBg = canvas.classList.contains('bg-canvas');   // full page backdrop
    // the hero helmet is deliberately non interactive: no drag, no cursor
    // parallax, so the page scrolls freely over it
    const interactive = (type !== 'kabuto');

    const renderer = makeRenderer(canvas, true);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const env = makeEnvironment(renderer);
    scene.environment = env;

    // dramatic museum lighting (shared base)
    scene.add(new THREE.AmbientLight(0x221015, 0.6));

    // RectAreaLight deep red from above
    if (THREE.RectAreaLightUniformsLib) THREE.RectAreaLightUniformsLib.init();
    const rect = new THREE.RectAreaLight(0x8b0000, 16, 7, 4);
    rect.position.set(0, 4.5, 2.5);
    rect.lookAt(0, 0, 0);
    scene.add(rect);

    // warm gold point light from below
    const gold = new THREE.PointLight(0xc9a84c, 2.6, 40, 2);
    gold.position.set(0, -3.2, 2.8);
    gold.castShadow = true;
    gold.shadow.mapSize.set(2048, 2048);
    gold.shadow.bias = -0.0004;
    scene.add(gold);

    // key light for crisp shadows and specular life on the lacquer
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 4;
    key.shadow.bias = -0.0004;
    scene.add(key);

    // soft warm rim light from behind to separate the piece from the darkness
    const rim = new THREE.DirectionalLight(0xffe7c2, 0.6);
    rim.position.set(-3.5, 2.5, -4.5);
    scene.add(rim);

    // controls (drag to rotate). Skipped for the non interactive hero helmet.
    // Zoom is disabled everywhere so the mouse wheel scrolls the page instead
    // of being captured by the canvas.
    let controls = null;
    if (interactive && typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.autoRotate = false;
      controls.rotateSpeed = 0.6;
    }

    // while the user is actively dragging, let the orbit take over and pause
    // the cursor parallax so the two do not fight each other
    let dragging = false;
    if (controls) {
      controls.addEventListener('start', () => { dragging = true; });
      controls.addEventListener('end', () => { dragging = false; });
    }

    // shadow catcher plane (floating-in-darkness ground shadow)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.5 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), shadowMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.6;
    ground.receiveShadow = true;
    scene.add(ground);

    // type specific extras
    let glowSprite = null;
    let petalPoints = null;
    let petalGeo = null;

    if (type === 'katana') {
      camera.position.set(0, 0, 7);
      const tex = makeGlowTexture('rgba(230,40,40,0.95)');
      const sm = new THREE.SpriteMaterial({
        map: tex, color: 0xff3322, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8
      });
      glowSprite = new THREE.Sprite(sm);
      glowSprite.scale.set(9, 2.6, 1);
      glowSprite.position.set(0, 0, -0.6);
      scene.add(glowSprite);
    }

    if (type === 'sakura') {
      camera.position.set(0, 0, isBg ? 11 : 5.5);
      // petals drifting around the branch (a full sky of them in background mode)
      const N     = isBg ? 320 : 140;
      const SP    = isBg ? 24 : 6;     // horizontal / vertical spread
      const SPZ   = isBg ? 12 : 4;     // depth spread
      const bound = isBg ? 12 : 3.2;   // recycle threshold
      const pp = new Float32Array(N * 3);
      const psp = [];
      for (let i = 0; i < N; i++) {
        pp[i * 3]     = (Math.random() - 0.5) * SP;
        pp[i * 3 + 1] = (Math.random() - 0.5) * SP;
        pp[i * 3 + 2] = (Math.random() - 0.5) * SPZ;
        // slow motion: gentle fall speed and sway
        psp.push({ s: 0.002 + Math.random() * 0.004, ph: Math.random() * 6.28, a: 0.004 + Math.random() * 0.012 });
      }
      petalGeo = new THREE.BufferGeometry();
      petalGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
      const pmat = new THREE.PointsMaterial({
        size: isBg ? 0.3 : 0.18, map: makePetalTexture(), transparent: true,
        depthWrite: false, opacity: isBg ? 0.85 : 0.95, color: 0xffc0d4
      });
      petalPoints = new THREE.Points(petalGeo, pmat);
      petalPoints._speeds = psp;
      petalPoints._bound = bound;
      petalPoints._spread = SP;
      scene.add(petalPoints);
    }

    const resize = onResize(renderer, camera, canvas);

    // ---- load the GLB ----
    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => {
      if (total) Loader.set((loaded / total) * 100);
    };
    const loader = new THREE.GLTFLoader(manager);

    let model = null;
    const target = isBg ? 11 : (type === 'sakura') ? 4.6 : (type === 'katana' ? 5.8 : 3.9);

    loader.load(
      src,
      (gltf) => {
        model = gltf.scene;

        // Some assets ship with a display stand and an atmospheric "dust"
        // volume. Hide the dust (it only inflates the bounds) and frame the
        // hero on the most detailed mesh so the helmet reads large and floats.
        let focus = null;
        if (type === 'kabuto') {
          let maxV = 0, core = null, coreCY = 0;
          model.updateMatrixWorld(true);
          model.traverse((n) => {
            if (!n.isMesh) return;
            const tag = (n.name + ' ' + ((n.material && n.material.name) || '')).toLowerCase();
            if (tag.includes('dust')) { n.visible = false; return; }
            const v = n.geometry.attributes.position.count;
            if (v > maxV) { maxV = v; core = n; }
          });
          if (core) {
            focus = core;
            const cb = new THREE.Box3().setFromObject(core).getCenter(new THREE.Vector3());
            coreCY = cb.y;
            // drop the separate stand mesh (sits well below the helmet) so the
            // piece floats in darkness as specified
            model.traverse((n) => {
              if (!n.isMesh || n === core || !n.visible) return;
              const c = new THREE.Box3().setFromObject(n).getCenter(new THREE.Vector3());
              if (c.y < coreCY - 0.1) n.visible = false;
            });
          }
        }

        fitModel(model, target, focus);

        if (type === 'katana') {
          model.rotation.z = THREE.MathUtils.degToRad(15);
          model.rotation.y = Math.PI * 0.04;
        }
        if (type === 'kabuto') {
          model.position.y += 0.2;
        }
        // remember the resting transform so the interactive animation can
        // play relative to it
        model.userData.baseScale = model.scale.x;
        model.userData.baseY = model.position.y;
        scene.add(model);
        Loader.hide();
      },
      (xhr) => { if (xhr.total) Loader.set((xhr.loaded / xhr.total) * 100); },
      (err) => {
        console.warn('Model failed to load:', src, err);
        // graceful fallback: a lacquered placeholder so the page still works
        const geo = (type === 'katana')
          ? new THREE.BoxGeometry(4, 0.16, 0.16)
          : new THREE.IcosahedronGeometry(1.4, 1);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x2a0a0a, metalness: 0.85, roughness: 0.25, envMapIntensity: 1.2
        });
        model = new THREE.Mesh(geo, mat);
        model.castShadow = true; model.receiveShadow = true;
        if (type === 'katana') model.rotation.z = THREE.MathUtils.degToRad(15);
        scene.add(model);
        Loader.hide();
      }
    );

    let t = 0, raf;
    function tick() {
      t += 0.016;
      updateInteraction();
      const infl = dragging ? 0 : 1;          // cursor influence (off while dragging)
      const mx = interaction.mx * infl;
      const my = interaction.my * infl;

      if (model) {
        const bs = model.userData.baseScale || 1;
        const by = model.userData.baseY || 0;

        if (type === 'kabuto') {
          // non interactive: a very slow spin on its own axis, plus a parallax
          // transition (rises, grows and tilts) as the hero scrolls past
          const p = clamp(interaction.scrollY / (canvas.clientHeight || 1), 0, 1.3);
          const targetScale = bs * (1 + p * 0.45);
          model.scale.setScalar(lerp(model.scale.x, targetScale, 0.08));
          model.rotation.y += 0.0022;                                   // slow self spin
          model.rotation.x = lerp(model.rotation.x, p * 0.16, 0.06);    // tilt with scroll
          model.position.y = lerp(model.position.y, by + p * 1.8, 0.1); // parallax rise
        } else if (type === 'katana') {
          // drifts up and down, banks toward the cursor
          model.position.y = by + Math.sin(t * 0.9) * 0.26;
          const ry = Math.PI * 0.04 + mx * 0.5;
          const rx = my * 0.16;
          model.rotation.y = lerp(model.rotation.y, ry, 0.06);
          model.rotation.x = lerp(model.rotation.x, rx, 0.06);
        } else if (type === 'sakura') {
          // sways like a branch in wind, with a soft lean toward the cursor
          const ry = Math.sin(t * 0.18) * 0.4 + mx * 0.3;
          const rz = Math.sin(t * 0.13) * 0.06;
          model.rotation.y = lerp(model.rotation.y, ry, 0.04);
          model.rotation.z = lerp(model.rotation.z, rz, 0.04);
        }
      }
      if (glowSprite) {
        glowSprite.position.y = model ? model.position.y : 0;
        const pulse = 0.7 + Math.sin(t * 1.6) * 0.12;
        glowSprite.material.opacity = pulse;
      }
      if (petalPoints) {
        const arr = petalGeo.attributes.position.array;
        const sp = petalPoints._speeds;
        const bound = petalPoints._bound || 3.2;
        const spread = petalPoints._spread || 6;
        for (let i = 0; i < sp.length; i++) {
          arr[i * 3 + 1] -= sp[i].s * 3;                       // slow motion fall
          arr[i * 3]     += Math.sin(t + sp[i].ph) * sp[i].a;
          if (arr[i * 3 + 1] < -bound) { arr[i * 3 + 1] = bound; arr[i * 3] = (Math.random() - 0.5) * spread; }
        }
        petalGeo.attributes.position.needsUpdate = true;
      }
      if (controls) controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    disposables.push(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (controls) controls.dispose();
      env.dispose();
      if (petalGeo) petalGeo.dispose();
      renderer.dispose();
    });

    return true;
  }

  /* ===================================================================
     11. TUNNEL (landing page) ring + kanji generation
     =================================================================== */
  function initTunnel() {
    const tunnel = $('.tunnel');
    if (!tunnel) return;
    const RINGS = 8;
    for (let i = 0; i < RINGS; i++) {
      const ring = document.createElement('div');
      ring.className = 'tunnel-ring';
      ring.style.animationDelay = (-(6 / RINGS) * i) + 's';
      ring.style.borderColor = (i % 2 === 0) ? 'var(--crimson)' : 'var(--gold)';
      tunnel.appendChild(ring);
    }
  }

  /* ===================================================================
     12. LIGHTBOX  (click an entry image to view the full resolution work)
     =================================================================== */
  function initLightbox() {
    const imgs = $$('.entry-image img[data-full]');
    if (!imgs.length) return;

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
      '<button class="lightbox-close" aria-label="Close">&times;</button>' +
      '<figure class="lightbox-inner"><img alt="" /><figcaption></figcaption></figure>';
    document.body.appendChild(box);

    const lbImg = $('img', box);
    const lbCap = $('figcaption', box);

    function open(src, caption, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCap.textContent = caption || '';
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => { lbImg.src = ''; }, 350);
    }

    imgs.forEach((im) => {
      im.addEventListener('click', () => {
        const fig = im.closest('figure');
        const cap = fig && fig.querySelector('figcaption');
        open(im.dataset.full || im.src, cap ? cap.textContent : '', im.alt);
      });
    });
    box.addEventListener('click', (e) => {
      if (e.target === box || e.target.closest('.lightbox-close')) close();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box.classList.contains('open')) close();
    });
  }

  /* ===================================================================
     13. READING PROGRESS BAR
     =================================================================== */
  function initReadingProgress() {
    const bar = document.createElement('div');
    bar.className = 'read-progress';
    bar.innerHTML = '<div class="read-progress-bar"></div>';
    document.body.appendChild(bar);
    const fill = bar.firstElementChild;
    let ticking = false;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      fill.style.transform = 'scaleX(' + (max > 0 ? (h.scrollTop / max) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ===================================================================
     14. FAVICON  (a small crimson and gold mon crest, injected once)
     =================================================================== */
  function injectFavicon() {
    if (document.querySelector('link[rel="icon"]')) return;
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<circle cx="16" cy="16" r="15" fill="#0a0a0a"/>' +
      '<circle cx="16" cy="16" r="11" fill="none" stroke="#8b0000" stroke-width="2.5"/>' +
      '<circle cx="16" cy="16" r="4.5" fill="#c9a84c"/></svg>';
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
    document.head.appendChild(link);
  }

  /* ===================================================================
     15. BOOT
     =================================================================== */
  function boot() {
    injectFavicon();
    injectBrushstrokes();
    initCursor();
    initNav();
    initTransitions();
    initScrollReveal();
    initParallax();
    initTunnel();
    initLightbox();
    initReadingProgress();
    initSakura();
    const hasModel = initModel();

    // pages without a 3D model: finish the loader once everything is in
    if (!hasModel) {
      let p = 0;
      const iv = setInterval(() => {
        p += 8 + Math.random() * 16;
        Loader.set(Math.min(p, 96));
        if (p >= 96) clearInterval(iv);
      }, 60);
      window.addEventListener('load', () => setTimeout(() => Loader.hide(), 300));
      // safety: never hang on the loader
      setTimeout(() => Loader.hide(), 2500);
    } else {
      // safety net if a model stalls
      setTimeout(() => Loader.hide(), 9000);
    }
  }

  window.addEventListener('beforeunload', () => {
    disposables.forEach((fn) => { try { fn(); } catch (e) {} });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
