/* ═══════════════════════════════════════════════════════════════
   BAO NGO — script.js
   ═══════════════════════════════════════════════════════════════ */

/* ── Custom Cursor ──────────────────────────────────────────── */
const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = window.innerWidth / 2, my = window.innerHeight / 2;
let rx = mx, ry = my;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';
});
document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

(function tickRing() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(tickRing);
})();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => { dot.classList.add('hover');  ring.classList.add('hover');  });
  el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
});

/* ── Clock — Eastern Time (handles EST / EDT automatically) ─── */
function updateClock() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(new Date());

  document.getElementById('clock-h').textContent    = parts.find(p => p.type === 'hour').value.padStart(2, '0');
  document.getElementById('clock-m').textContent    = parts.find(p => p.type === 'minute').value;
  document.getElementById('clock-ampm').textContent = parts.find(p => p.type === 'dayPeriod').value;
}
updateClock();
setInterval(updateClock, 1000);

/* ── Greeting — per-character spin, 3 s ──────────────────────── */
const GREETINGS = [
  "Hello, I'm Bao Ngo",
  "Bonjour, je suis Bao Ngo",
  "Hola, soy Bao Ngo",
];
let gIdx = 0;
const greetEl = document.getElementById('greetingText');

function buildChars(el, text, anim) {
  el.innerHTML = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'g-char';
    s.textContent = ch === ' ' ? ' ' : ch;
    s.style.cssText = `animation-name:${anim};animation-duration:0.28s;animation-delay:${i*22}ms;animation-fill-mode:both;`;
    el.appendChild(s);
  });
}

function spinGreeting(animate) {
  if (!animate) { buildChars(greetEl, GREETINGS[gIdx], 'charIn'); return; }

  const old = [...greetEl.querySelectorAll('.g-char')];
  old.forEach((s, i) => {
    s.style.cssText = `animation-name:charOut;animation-duration:0.22s;animation-delay:${i*18}ms;animation-fill-mode:forwards;`;
  });

  setTimeout(() => {
    gIdx = (gIdx + 1) % GREETINGS.length;
    buildChars(greetEl, GREETINGS[gIdx], 'charIn');
  }, old.length * 18 + 220);
}

spinGreeting(false);
setInterval(() => spinGreeting(true), 3000);

/* ══════════════════════════════════════════════════════════════
   THREE.JS — Floating pink box cluster  (template.png style)
   ══════════════════════════════════════════════════════════════ */
const canvas   = document.getElementById('canvas');
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0.4, 9);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

/* Lighting — warm/cool mix gives the soft pinkish depth from the template */
scene.add(new THREE.AmbientLight(0x141010, 4));

const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
keyLight.position.set(5, 9, 6);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.PointLight(0xffbbbb, 2.8, 20);
fillLight.position.set(-5, 2, 5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
rimLight.position.set(0, -5, -4);
scene.add(rimLight);

/* ── Box cluster ─────────────────────────────────────────────── */
const GROUP   = new THREE.Group();
// Centered between left HUD text and right nav:
// x = 2.5 puts it at ~68 % across a 16:9 screen
GROUP.position.set(2.5, 0.3, 0);
GROUP.rotation.x = 0.25;   // slight forward tilt like the template
GROUP.rotation.y = 0.4;
scene.add(GROUP);

const BOX_SIZE = 0.66;
const STEP     = 0.82;      // spacing between cubie centres
const GRID     = 3;
const HALF     = ((GRID - 1) * STEP) / 2;

const geo      = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
const boxes    = [];

for (let xi = 0; xi < GRID; xi++) {
  for (let yi = 0; yi < GRID; yi++) {
    for (let zi = 0; zi < GRID; zi++) {
      // Warm rose palette — slightly lighter toward the top, like the template
      const lum = 0.64 + yi * 0.07;
      const mat = new THREE.MeshStandardMaterial({
        color:     new THREE.Color().setHSL(0.0, 0.30 + yi * 0.06, lum),
        roughness: 0.16 + Math.random() * 0.07,
        metalness: 0.04,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const bx = xi * STEP - HALF;
      const bz = zi * STEP - HALF;
      let   by = yi * STEP - HALF;

      // Bottom layer outer boxes drift downward (template's disintegrating look)
      let floating = false;
      if (yi === 0 && !(xi === 1 && zi === 1)) {
        by      -= 0.22 + Math.random() * 0.42;
        floating = true;
      }

      mesh.position.set(bx, by, bz);
      mesh.userData = { baseY: by, floating, phase: Math.random() * Math.PI * 2 };
      GROUP.add(mesh);
      boxes.push(mesh);
    }
  }
}

/* ── Raycaster — hover detection over cube area ──────────────── */
// Use one large invisible bounding-box so the entire cluster is the hit zone
const hitMesh = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 4.2, 3.2),
  new THREE.MeshBasicMaterial({ visible: false, depthWrite: false })
);
GROUP.add(hitMesh);

const raycaster  = new THREE.Raycaster();
const mouseNDC   = new THREE.Vector2(-99, -99);
let   cubeHovered = false;

document.addEventListener('mousemove', e => {
  mouseNDC.x = (e.clientX / window.innerWidth)  *  2 - 1;
  mouseNDC.y = (e.clientY / window.innerHeight) * -2 + 1;
});

/* ── Spin state — smoothly accelerates / decelerates on hover ── */
let rotSpeed = 0.001;   // current speed (rad / frame)

/* ── FPS ─────────────────────────────────────────────────────── */
let fps = 0, fFrames = 0, fLast = performance.now();

/* ── Animate loop ─────────────────────────────────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  /* Hover detection */
  raycaster.setFromCamera(mouseNDC, camera);
  cubeHovered = raycaster.intersectObject(hitMesh).length > 0;

  /* Smooth speed transition */
  const targetSpeed = cubeHovered ? 0.020 : 0.0008;
  rotSpeed += (targetSpeed - rotSpeed) * 0.04;

  /* Rotate group */
  GROUP.rotation.y += rotSpeed;
  GROUP.rotation.x  = 0.25 + Math.sin(t * 0.18) * 0.05;  // subtle breathing tilt

  /* Gentle float for displaced boxes */
  boxes.forEach(b => {
    if (b.userData.floating) {
      b.position.y = b.userData.baseY + Math.sin(t * 0.9 + b.userData.phase) * 0.05;
    }
  });

  /* FPS */
  fFrames++;
  const now = performance.now();
  if (now - fLast >= 1000) {
    fps = fFrames; fFrames = 0; fLast = now;
    document.getElementById('hud-fps').textContent = fps + ' fps';
  }

  renderer.render(scene, camera);
}
animate();

/* ── Resize ───────────────────────────────────────────────────── */
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  document.getElementById('hud-res').textContent = `${w} × ${h}`;
});
document.getElementById('hud-res').textContent = `${window.innerWidth} × ${window.innerHeight}`;

/* ── HUD smooth scroll fade ───────────────────────────────────── */
const hudBottom = document.getElementById('hudBottom');
const hudFoot   = document.getElementById('hudFoot');

function updateHudFade() {
  const y       = window.scrollY;
  const fadeEnd = window.innerHeight * 0.42;
  const t       = Math.max(0, Math.min(1, y / fadeEnd));
  const opacity = 1 - t;
  const shift   = t * 14;
  hudBottom.style.opacity   = opacity;
  hudBottom.style.transform = `translateY(${shift}px)`;
  hudFoot.style.opacity     = opacity;
  hudFoot.style.transform   = `translateY(${shift * 0.6}px)`;
}
updateHudFade();
window.addEventListener('scroll', updateHudFade, { passive: true });

/* ── Section scroll reveal ────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Nav active state ─────────────────────────────────────────── */
const navLinks = document.querySelectorAll('.hn-link');
const secObs   = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.sec === e.target.id));
  });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => secObs.observe(s));
