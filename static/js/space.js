/* ============================================================
   THE GRAVITY — 3D animated universe background
   Built with Three.js (r128). A drifting starfield + a glowing
   spiral galaxy of particles that reacts to the mouse & scroll.

   Theme aware: in dark mode the stars glow (additive blending);
   in light mode they switch to dark, solid stars so the animation
   stays clearly visible on the pale background.
   ============================================================ */
(function () {
  const canvas = document.getElementById('universe');
  if (!canvas || typeof THREE === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05010f, 0.0009);

  const camera = new THREE.PerspectiveCamera(
    70, window.innerWidth / window.innerHeight, 1, 2600
  );
  camera.position.z = 480;

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ---------- Soft round sprite for every particle ----------
  function makeStarTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.5, 'rgba(160,180,255,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  const starTexture = makeStarTexture();

  const palette = [
    new THREE.Color(0x38e1ff), // cyan
    new THREE.Color(0x7c4dff), // violet
    new THREE.Color(0xff4dd8), // magenta
    new THREE.Color(0xffffff), // white
  ];

  // ---------- 1. Distant starfield ----------
  function buildStarfield(count) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 700 + Math.random() * 1500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 3.2, map: starTexture, vertexColors: true,
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.9,
    });
    return { points: new THREE.Points(geo, mat), mat, baseOpacity: 0.9 };
  }

  // ---------- 2. Spiral galaxy ----------
  function buildGalaxy(count) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const arms = 4;
    const inner = new THREE.Color(0xff66e0);
    const outer = new THREE.Color(0x38b6ff);
    for (let i = 0; i < count; i++) {
      const radius = Math.pow(Math.random(), 0.6) * 420;
      const arm = (i % arms) / arms * Math.PI * 2;
      const spin = radius * 0.012;
      const spread = (Math.random() - 0.5) * (0.35 + radius / 900);
      const angle = arm + spin + spread;
      positions[i * 3]     = Math.cos(angle) * radius + (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 26 * (1 - radius / 600);
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 18;
      const col = inner.clone().lerp(outer, radius / 420);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 4.5, map: starTexture, vertexColors: true,
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.95,
    });
    const points = new THREE.Points(geo, mat);
    points.rotation.x = -0.55;
    return { points, mat, baseOpacity: 0.95 };
  }

  const isSmall = window.innerWidth < 700;
  const starfield = buildStarfield(isSmall ? 1400 : 2800);
  const galaxy = buildGalaxy(isSmall ? 6000 : 14000);
  scene.add(starfield.points);
  scene.add(galaxy.points);

  // ---------- Theme handling ----------
  // Light mode: dark, solid (normal-blended) stars so they read on a pale sky.
  // Dark mode: bright, additive glowing stars on the deep-space backdrop.
  const layers = [starfield, galaxy];
  function applyTheme(theme) {
    const light = theme === 'light';
    scene.fog.color.set(light ? 0xe7e9f7 : 0x05010f);
    layers.forEach((l) => {
      l.mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      l.mat.color.set(light ? 0x2a2358 : 0xffffff); // multiplies the star colours
      l.mat.opacity = light ? 1.0 : l.baseOpacity;
      l.mat.needsUpdate = true;
    });
  }
  applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  window.addEventListener('themechange', (e) => applyTheme(e.detail.theme));

  // ---------- Interaction ----------
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5);
    mouse.y = (e.clientY / window.innerHeight - 0.5);
  });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- Animation loop ----------
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!prefersReduced) {
      galaxy.points.rotation.y = t * 0.06;
      starfield.points.rotation.y = t * 0.012;
      starfield.points.rotation.x = t * 0.006;
    }

    // Camera eases toward the cursor for a parallax feel.
    const targetX = mouse.x * 140;
    const targetY = -mouse.y * 90 + scrollY * 0.05;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    // Pull the camera in slightly as you scroll down the page.
    camera.position.z = 480 - Math.min(scrollY * 0.08, 180);
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();
})();
