/* =====================================================================
   hero.js
   Three.js landing hero: a slowly rotating katana paired with a
   geometric samurai mon (crest), gold + steel materials, shifting
   point lights for reflective highlights and a sense of real depth.
   Requires THREE (loaded from CDN before this file).
   ===================================================================== */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;
  var mount = document.getElementById('hero-canvas');
  if (!mount) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050506, 0.06);

  var camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 13);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  /* ---------- Materials ---------- */
  var goldMat = new THREE.MeshStandardMaterial({
    color: 0xc9a24b, metalness: 1.0, roughness: 0.28, emissive: 0x2a1c05, emissiveIntensity: 0.4
  });
  var steelMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde2, metalness: 1.0, roughness: 0.15
  });
  var darkMat = new THREE.MeshStandardMaterial({
    color: 0x14110d, metalness: 0.6, roughness: 0.6
  });
  var crimsonMat = new THREE.MeshStandardMaterial({
    color: 0x8a1220, metalness: 0.4, roughness: 0.5, emissive: 0x3a0008, emissiveIntensity: 0.5
  });

  var world = new THREE.Group();
  scene.add(world);

  /* ---------- Katana ---------- */
  var katana = new THREE.Group();

  // Blade: a long, slightly curved shape approximated with a tapered box.
  var bladeGeo = new THREE.BoxGeometry(0.18, 7.2, 0.5);
  // taper the tip by editing top vertices
  var pos = bladeGeo.attributes.position;
  for (var i = 0; i < pos.count; i++) {
    var y = pos.getY(i);
    if (y > 3) { pos.setX(i, pos.getX(i) * 0.15); pos.setZ(i, pos.getZ(i) * 0.2); }
  }
  bladeGeo.computeVertexNormals();
  var blade = new THREE.Mesh(bladeGeo, steelMat);
  blade.position.y = 1.6;
  katana.add(blade);

  // Tsuba (guard): a flat disk.
  var tsuba = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.16, 32), goldMat);
  tsuba.rotation.x = Math.PI / 2;
  tsuba.position.y = -2.0;
  katana.add(tsuba);

  // Handle (tsuka).
  var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 2.6, 24), darkMat);
  handle.position.y = -3.45;
  katana.add(handle);

  // Pommel cap.
  var cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), goldMat);
  cap.position.y = -4.78;
  katana.add(cap);

  katana.rotation.z = 0.32;
  katana.position.x = 2.4;
  world.add(katana);

  /* ---------- Samurai mon (crest) ---------- */
  var mon = new THREE.Group();

  var ring = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.12, 24, 80), goldMat);
  mon.add(ring);
  var ringInner = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.05, 16, 64), goldMat);
  mon.add(ringInner);

  // Petal motif: four stylised petals around a centre, evoking a kamon.
  var petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.55, 0.25, 0.55, 1.1, 0, 1.45);
  petalShape.bezierCurveTo(-0.55, 1.1, -0.55, 0.25, 0, 0);
  var petalGeo = new THREE.ExtrudeGeometry(petalShape, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  for (var p = 0; p < 4; p++) {
    var petal = new THREE.Mesh(petalGeo, crimsonMat);
    petal.rotation.z = (Math.PI / 2) * p;
    mon.add(petal);
  }
  var center = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), goldMat);
  mon.add(center);

  mon.position.x = -3.0;
  mon.scale.setScalar(0.92);
  world.add(mon);

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x221016, 0.6));

  var key = new THREE.PointLight(0xffe6b0, 1.7, 60);
  key.position.set(6, 5, 8);
  scene.add(key);

  var rim = new THREE.PointLight(0xc0192c, 2.2, 50);
  rim.position.set(-7, -2, 4);
  scene.add(rim);

  var gold = new THREE.PointLight(0xc9a24b, 1.4, 40);
  gold.position.set(0, 6, -6);
  scene.add(gold);

  var spot = new THREE.SpotLight(0xffffff, 1.2, 60, Math.PI / 6, 0.5);
  spot.position.set(0, 0, 16);
  scene.add(spot);

  /* ---------- Pointer parallax ---------- */
  var targetX = 0, targetY = 0;
  window.addEventListener('pointermove', function (e) {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });

  /* ---------- Animate ---------- */
  var t = 0;
  var visible = true;
  function render() {
    if (!visible) return;
    requestAnimationFrame(render);
    t += 0.01;

    katana.rotation.y += reduced ? 0.001 : 0.006;
    mon.rotation.y += reduced ? 0.0015 : 0.009;
    mon.rotation.z = Math.sin(t * 0.3) * 0.05;

    // Light shifts for reflective highlights.
    key.position.x = Math.sin(t * 0.5) * 7;
    key.position.y = Math.cos(t * 0.4) * 5 + 2;
    rim.intensity = 1.8 + Math.sin(t * 0.8) * 0.7;
    gold.position.x = Math.cos(t * 0.6) * 6;

    // Gentle camera parallax toward pointer.
    world.rotation.y += (targetX - world.rotation.y) * 0.05;
    world.rotation.x += (targetY - world.rotation.x) * 0.05;

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
