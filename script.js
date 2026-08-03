import * as THREE from "three";

/* —— Loading / Launching —— */
(function () {
  var loader = document.getElementById("loader");
  var fill = document.getElementById("loader-fill");
  var pctEl = document.getElementById("loader-pct");
  if (!loader || !fill || !pctEl) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var progress = 0;
  var target = 0;
  var done = false;

  function finish() {
    if (done) return;
    done = true;
    progress = 100;
    fill.style.width = "100%";
    pctEl.textContent = "100%";
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 800);
  }

  if (reduceMotion) {
    finish();
    return;
  }

  function bump() {
    if (done) return;
    target = Math.min(100, target + (target < 70 ? 8 + Math.random() * 12 : 3 + Math.random() * 6));
  }

  var bumpTimer = setInterval(bump, 280);
  bump();

  window.addEventListener("load", function () {
    target = 100;
  });

  setTimeout(function () {
    target = 100;
  }, 3500);

  function frame() {
    if (done) return;
    progress += (target - progress) * 0.12;
    if (target >= 100 && progress > 99.2) {
      clearInterval(bumpTimer);
      finish();
      return;
    }
    var shown = Math.min(100, Math.floor(progress));
    fill.style.width = shown + "%";
    pctEl.textContent = shown + "%";
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();

/* —— Countdown (3 days from first visit; persists across reloads) —— */
(function () {
  var STORAGE_KEY = "tvk-launch-at";
  var THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  var stored = localStorage.getItem(STORAGE_KEY);
  var LAUNCH;

  if (stored) {
    LAUNCH = parseInt(stored, 10);
    if (isNaN(LAUNCH)) {
      LAUNCH = Date.now() + THREE_DAYS;
      localStorage.setItem(STORAGE_KEY, String(LAUNCH));
    }
  } else {
    LAUNCH = Date.now() + THREE_DAYS;
    localStorage.setItem(STORAGE_KEY, String(LAUNCH));
  }

  var daysEl = document.getElementById("cd-days");
  var hoursEl = document.getElementById("cd-hours");
  var minsEl = document.getElementById("cd-mins");
  var secsEl = document.getElementById("cd-secs");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    var now = Date.now();
    var diff = Math.max(0, LAUNCH - now);

    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var secs = Math.floor((diff % 60000) / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
})();

/* —— Three.js full solar system —— */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("space-scene");

if (canvas && !reduceMotion) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  camera.position.set(0, 18, 32);

  /* Soft ambient so dark-side planets stay visible */
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  const system = new THREE.Group();
  system.rotation.x = 0.38;
  scene.add(system);

  /* —— Starfield —— */
  function makeStars(count, spread, size, opacity) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xf5f5f5,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        depthWrite: false,
      })
    );
  }
  const starsFar = makeStars(2200, 220, 0.05, 0.4);
  const starsNear = makeStars(500, 90, 0.08, 0.65);
  scene.add(starsFar);
  scene.add(starsNear);

  /* —— Procedural B&W planet texture —— */
  function makePlanetTexture(size, opts) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(size, size);
    const d = img.data;
    const seed = opts.seed || 1;

    function noise(x, y) {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return n - Math.floor(n);
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        let n =
          noise(u * 5, v * 5) * 0.5 +
          noise(u * 12, v * 12) * 0.3 +
          noise(u * 28, v * 28) * 0.2;
        if (opts.bands) {
          n = n * 0.4 + (0.5 + 0.5 * Math.sin(v * Math.PI * opts.bands + n * 2.2)) * 0.6;
        }
        const val = Math.max(
          0,
          Math.min(255, (opts.base || 100) + (n - 0.5) * (opts.contrast || 80))
        );
        const i = (y * size + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = val;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeGlowSprite(scale, opacity) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.25, "rgba(255,255,255,0.35)");
    g.addColorStop(0.55, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    sprite.scale.set(scale, scale, 1);
    return sprite;
  }

  function makeOrbit(radius) {
    const pts = [];
    const seg = 128;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
      })
    );
  }

  /* —— Sun —— */
  const sunLight = new THREE.PointLight(0xffffff, 2.4, 120, 2);
  system.add(sunLight);

  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0xf0f0f0 })
  );
  system.add(sunMesh);
  system.add(makeGlowSprite(6.5, 0.55));
  system.add(makeGlowSprite(12, 0.18));

  /* —— Planets (scaled for visual clarity, not real proportions) —— */
  const planetDefs = [
    { name: "mercury", dist: 3.2, size: 0.18, speed: 1.6, spin: 0.02, seed: 11, base: 130, contrast: 40, bands: 0 },
    { name: "venus",   dist: 4.4, size: 0.32, speed: 1.15, spin: 0.008, seed: 22, base: 160, contrast: 35, bands: 0 },
    { name: "earth",   dist: 5.8, size: 0.34, speed: 0.95, spin: 0.025, seed: 42, base: 95, contrast: 110, bands: 0, moon: true },
    { name: "mars",    dist: 7.2, size: 0.24, speed: 0.75, spin: 0.022, seed: 33, base: 110, contrast: 70, bands: 0 },
    { name: "jupiter", dist: 10.5, size: 0.95, speed: 0.42, spin: 0.04, seed: 7, base: 100, contrast: 70, bands: 10 },
    { name: "saturn",  dist: 13.8, size: 0.8, speed: 0.3, spin: 0.035, seed: 55, base: 130, contrast: 50, bands: 8, rings: true },
    { name: "uranus",  dist: 16.8, size: 0.48, speed: 0.2, spin: 0.02, seed: 66, base: 150, contrast: 40, bands: 4 },
    { name: "neptune", dist: 19.5, size: 0.46, speed: 0.15, spin: 0.018, seed: 77, base: 90, contrast: 50, bands: 5 },
  ];

  const bodies = [];

  planetDefs.forEach((def, index) => {
    system.add(makeOrbit(def.dist));

    const pivot = new THREE.Group();
    pivot.rotation.y = (index / planetDefs.length) * Math.PI * 2;
    system.add(pivot);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.size, 32, 32),
      new THREE.MeshStandardMaterial({
        map: makePlanetTexture(128, def),
        metalness: 0.08,
        roughness: 0.7,
      })
    );
    mesh.position.x = def.dist;
    pivot.add(mesh);

    let moonPivot = null;
    let moonMesh = null;
    if (def.moon) {
      // Earth atmosphere
      mesh.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(def.size * 1.08, 24, 24),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.07,
            side: THREE.BackSide,
          })
        )
      );

      moonPivot = new THREE.Group();
      moonPivot.position.x = def.dist;
      pivot.add(moonPivot);

      moonMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshStandardMaterial({
          map: makePlanetTexture(64, { seed: 99, base: 150, contrast: 55, bands: 0 }),
          metalness: 0.05,
          roughness: 0.9,
        })
      );
      moonMesh.position.x = 0.7;
      moonPivot.add(moonMesh);
    }

    if (def.rings) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(def.size * 1.35, def.size * 2.35, 64),
        new THREE.MeshBasicMaterial({
          color: 0xe8e8e8,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = Math.PI / 2.15;
      mesh.add(ring);

      const ring2 = new THREE.Mesh(
        new THREE.RingGeometry(def.size * 2.45, def.size * 2.7, 64),
        new THREE.MeshBasicMaterial({
          color: 0xc8c8c8,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        })
      );
      ring2.rotation.x = Math.PI / 2.15;
      mesh.add(ring2);
    }

    bodies.push({
      pivot,
      mesh,
      speed: def.speed,
      spin: def.spin,
      moonPivot,
      moonMesh,
      phase: (index / planetDefs.length) * Math.PI * 2,
    });
  });

  /* —— Asteroid belt (between Mars & Jupiter) —— */
  const AST = 420;
  const astPos = new Float32Array(AST * 3);
  for (let i = 0; i < AST; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 8.4 + Math.random() * 1.5;
    astPos[i * 3] = Math.cos(a) * r;
    astPos[i * 3 + 1] = (Math.random() - 0.5) * 0.35;
    astPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const asteroids = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(astPos, 3)),
    new THREE.PointsMaterial({
      color: 0xb8b8b8,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  system.add(asteroids);

  /* —— Camera framing —— */
  let running = true;
  const look = new THREE.Vector3(0, 0, 0);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Keep system readable behind centered content
    const wide = w > 900;
    system.position.set(wide ? 4.5 : 0, wide ? -1 : -0.5, 0);
    camera.position.set(0, wide ? 14 : 20, wide ? 28 : 36);
  }
  resize();
  window.addEventListener("resize", resize);

  function animate(now) {
    if (!running) return;
    requestAnimationFrame(animate);
    const t = now * 0.001;

    sunMesh.rotation.y += 0.002;
    asteroids.rotation.y += 0.00035;
    starsFar.rotation.y += 0.00005;
    starsNear.rotation.y += 0.0001;

    bodies.forEach((b) => {
      b.pivot.rotation.y = b.phase + t * b.speed * 0.15;
      b.mesh.rotation.y += b.spin;
      if (b.moonPivot) {
        b.moonPivot.rotation.y = t * 1.1;
        if (b.moonMesh) b.moonMesh.rotation.y += 0.01;
      }
    });

    // Gentle camera drift
    const baseY = window.innerWidth > 900 ? 14 : 20;
    const baseZ = window.innerWidth > 900 ? 28 : 36;
    camera.position.x = Math.sin(t * 0.07) * 1.2;
    camera.position.y = baseY + Math.sin(t * 0.09) * 0.45;
    camera.position.z = baseZ;
    camera.lookAt(look.set(system.position.x * 0.35, 0, 0));

    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
    } else {
      running = true;
      requestAnimationFrame(animate);
    }
  });

  canvas.classList.add("is-ready");
  requestAnimationFrame(animate);
}
