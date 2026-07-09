/* =====================================================================
   theme-header.js
   Atmospheric particle field behind each theme page header. A drifting
   cloud of golden embers in 3D space with depth fog, kept deliberately
   light so theme pages stay smooth on mobile.
   ===================================================================== */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;
  var mount = document.getElementById('theme-canvas');
  if (!mount) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080507, 0.05);

  var camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 60);
  camera.position.z = 14;

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  var count = reduced ? 120 : 420;
  var geo = new THREE.BufferGeometry();
  var pos = new Float32Array(count * 3);
  var spd = new Float32Array(count);
  for (var i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    spd[i] = 0.005 + Math.random() * 0.02;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  // Two layered point clouds: gold embers + faint crimson dust.
  var mat = new THREE.PointsMaterial({ color: 0xc9a24b, size: 0.14, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  var points = new THREE.Points(geo, mat);
  scene.add(points);

  var dustGeo = geo.clone();
  var dustMat = new THREE.PointsMaterial({ color: 0x8a1220, size: 0.22, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });
  var dust = new THREE.Points(dustGeo, dustMat);
  dust.position.z = -6;
  scene.add(dust);

  var targetX = 0, targetY = 0;
  window.addEventListener('pointermove', function (e) {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.6;
  });

  var visible = true;
  var t = 0;
  function render() {
    if (!visible) return;
    requestAnimationFrame(render);
    t += 0.01;
    var p = geo.attributes.position;
    for (var i = 0; i < count; i++) {
      var y = p.getY(i) + spd[i];
      if (y > 16) y = -16;
      p.setY(i, y);
    }
    p.needsUpdate = true;

    points.rotation.y += 0.0008;
    dust.rotation.y -= 0.0005;

    camera.position.x += (targetX * 3 - camera.position.x) * 0.04;
    camera.position.y += (-targetY * 3 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  render();

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
