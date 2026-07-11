/* =====================================================================
   tunnel.js
   Immersive full screen moment: moving through a Japanese forest at
   night toward a distant feudal castle. Built with Three.js depth, fog,
   receding torii gates, tree trunks and drifting embers. The camera
   glides forward continuously for a sense of scale and motion.
   ===================================================================== */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;
  var mount = document.getElementById('tunnel-canvas');
  if (!mount) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07060a, 6, 60);

  var camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.1, 120);
  camera.position.set(0, 1.4, 0);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setClearColor(0x07060a, 1);
  mount.appendChild(renderer.domElement);

  /* ---------- Ground ---------- */
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 200),
    new THREE.MeshStandardMaterial({ color: 0x0c0a10, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -80;
  scene.add(ground);

  /* ---------- Trees lining the path ---------- */
  var trunkMat = new THREE.MeshStandardMaterial({ color: 0x100c0a, roughness: 0.9 });
  var canopyMat = new THREE.MeshStandardMaterial({ color: 0x0d1410, roughness: 1 });
  var trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 9, 7);
  var canopyGeo = new THREE.ConeGeometry(2.2, 6, 8);

  var trees = [];
  var DEPTH = 160;
  for (var i = 0; i < 60; i++) {
    var side = i % 2 === 0 ? -1 : 1;
    var x = side * (3.2 + Math.random() * 3.5);
    var z = -(Math.random() * DEPTH);
    var grp = new THREE.Group();
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 4.5;
    grp.add(trunk);
    var canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 10;
    canopy.scale.setScalar(0.8 + Math.random() * 0.7);
    grp.add(canopy);
    grp.position.set(x, 0, z);
    scene.add(grp);
    trees.push(grp);
  }

  /* ---------- Torii gates receding into the dark ---------- */
  var toriiMat = new THREE.MeshStandardMaterial({ color: 0x6e0f1a, roughness: 0.5, metalness: 0.2, emissive: 0x1a0205, emissiveIntensity: 0.4 });
  function makeTorii(z) {
    var g = new THREE.Group();
    var pillarGeo = new THREE.CylinderGeometry(0.16, 0.2, 5, 10);
    var l = new THREE.Mesh(pillarGeo, toriiMat); l.position.set(-1.7, 2.5, 0); g.add(l);
    var r = new THREE.Mesh(pillarGeo, toriiMat); r.position.set(1.7, 2.5, 0); g.add(r);
    var top = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.32, 0.4), toriiMat); top.position.y = 5; top.rotation.z = 0.0; g.add(top);
    var top2 = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.22, 0.3), toriiMat); top2.position.y = 4.4; g.add(top2);
    g.position.set(0, 0, z);
    return g;
  }
  var toriis = [];
  for (var k = 0; k < 7; k++) {
    var tr = makeTorii(-k * 22 - 8);
    scene.add(tr);
    toriis.push(tr);
  }

  /* ---------- Distant castle silhouette ---------- */
  var castle = new THREE.Group();
  var castleMat = new THREE.MeshStandardMaterial({ color: 0x070509, roughness: 1 });
  var glowMat = new THREE.MeshBasicMaterial({ color: 0xc9a24b });
  for (var f = 0; f < 4; f++) {
    var tier = new THREE.Mesh(new THREE.BoxGeometry(8 - f * 1.6, 2.2, 6 - f * 1.2), castleMat);
    tier.position.y = 1.1 + f * 2.4;
    castle.add(tier);
    var roof = new THREE.Mesh(new THREE.ConeGeometry((8 - f * 1.6) * 0.78, 1.2, 4), castleMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.3 + f * 2.4;
    castle.add(roof);
  }
  // a few warm lit windows
  for (var wI = 0; wI < 5; wI++) {
    var win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), glowMat);
    win.position.set(-2.5 + Math.random() * 5, 1 + Math.random() * 6, 3.1);
    castle.add(win);
  }
  castle.position.set(0, 0, -DEPTH + 6);
  scene.add(castle);

  /* ---------- Moon glow ---------- */
  var moon = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 24), new THREE.MeshBasicMaterial({ color: 0xe7c879 }));
  moon.position.set(10, 22, -DEPTH);
  scene.add(moon);

  /* ---------- Embers ---------- */
  var emberCount = reduced ? 60 : 220;
  var emberGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(emberCount * 3);
  for (var e = 0; e < emberCount; e++) {
    positions[e * 3] = (Math.random() - 0.5) * 24;
    positions[e * 3 + 1] = Math.random() * 14;
    positions[e * 3 + 2] = -Math.random() * DEPTH;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var emberMat = new THREE.PointsMaterial({ color: 0xe0903a, size: 0.16, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
  var embers = new THREE.Points(emberGeo, emberMat);
  scene.add(embers);

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x141018, 0.8));
  var moonLight = new THREE.DirectionalLight(0xbcd0ff, 0.5);
  moonLight.position.set(10, 22, -40);
  scene.add(moonLight);
  var pathGlow = new THREE.PointLight(0xc0192c, 1.4, 30);
  pathGlow.position.set(0, 2, -6);
  scene.add(pathGlow);

  /* ---------- Scroll driven progress ---------- */
  var section = document.querySelector('.immersive');
  var progress = 0;
  function updateProgress() {
    if (!section) return;
    var rect = section.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var scrolled = Math.min(Math.max(-rect.top, 0), total);
    progress = total > 0 ? scrolled / total : 0;
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Animate ---------- */
  var visible = true;
  var t = 0;
  function render() {
    if (!visible) return;
    requestAnimationFrame(render);
    t += 0.016;

    // Camera moves forward across the section, plus a slow idle drift.
    var base = -6 - progress * (DEPTH - 24);
    camera.position.z += (base - camera.position.z) * 0.06;
    camera.position.z -= 0.02; // gentle constant glide so it never feels frozen
    camera.position.x = Math.sin(t * 0.2) * 0.6;
    camera.position.y = 1.4 + Math.sin(t * 0.5) * 0.08;

    // Loop the camera so the scene feels endless when idle.
    if (camera.position.z < -DEPTH + 20) camera.position.z = -6;

    // Embers drift upward and recycle.
    var pa = emberGeo.attributes.position;
    for (var i = 0; i < emberCount; i++) {
      var y = pa.getY(i) + 0.02 + Math.random() * 0.01;
      if (y > 15) y = 0;
      pa.setY(i, y);
      pa.setX(i, pa.getX(i) + Math.sin((t + i) * 0.5) * 0.004);
    }
    pa.needsUpdate = true;

    pathGlow.intensity = 1.2 + Math.sin(t * 2) * 0.4;

    renderer.render(scene, camera);
  }
  render();

  /* ---------- Resize ---------- */
  function resize() {
    var wd = mount.clientWidth, ht = mount.clientHeight;
    camera.aspect = wd / ht;
    camera.updateProjectionMatrix();
    renderer.setSize(wd, ht);
  }
  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { visible = false; }
    else if (!visible) { visible = true; render(); }
  });
})();
