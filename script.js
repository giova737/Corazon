/* app.js - genera letras "Bianca" desde toda la pantalla, forman el texto,
   y al completarse aparece un corazón 3D extruido con brillo. */

/* ----- CONFIG ----- */
const NAME = "Bianca";
const REPEAT = 160;         // cuántas letras generar (más = más denso, más coste)
const FORMATION_TIME = 4200; // ms que tardan las letras en moverse y formar
const HEART_REVEAL_DELAY = 600; // ms después de completar la formación que aparece corazón
const FLOAT_HEART_RATE = 900; // ms entre corazones que suben desde abajo

/* ----- HELPERS ----- */
const rand = (a,b) => a + Math.random()*(b-a);

/* ----- SETUP DOM LAYERS ----- */
const threeContainer = document.createElement('div');
threeContainer.id = 'three-container';
document.body.appendChild(threeContainer);

const stars = document.createElement('div');
stars.className = 'stars';
document.body.appendChild(stars);

const floatingLayer = document.createElement('div');
floatingLayer.className = 'floating-layer';
document.body.appendChild(floatingLayer);

const progress = document.createElement('div');
progress.className = 'progress';
const progBar = document.createElement('i');
progress.appendChild(progBar);
document.body.appendChild(progress);

const hint = document.createElement('div');
hint.className = 'hint';
hint.innerText = 'Mueve el mouse o inclina para girar — no interfiere con la formación';
document.body.appendChild(hint);

const glow = document.createElement('div');
glow.className = 'heart-glow';
document.body.appendChild(glow);

/* ----- LETTERS: create DOM letters and initial random positions ----- */
const letters = [];
const vw = () => window.innerWidth;
const vh = () => window.innerHeight;

function spawnLetters() {
  // create array with repeated characters of NAME
  const charPool = [];
  for (let i=0;i<REPEAT;i++){
    const s = NAME[Math.floor(Math.random()*NAME.length)];
    charPool.push(s);
  }

  for (let i=0;i<charPool.length;i++){
    const ch = document.createElement('div');
    ch.className = 'letter';
    ch.textContent = charPool[i];
    ch.style.left = rand(0, vw()) + 'px';
    ch.style.top = rand(0, vh()) + 'px';
    ch.style.opacity = 0;
    const scale = rand(.6,1.4);
    ch.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rand(-30,30)}deg)`;
    document.body.appendChild(ch);
    letters.push(ch);
    // subtle entrance
    setTimeout(()=> ch.style.opacity = 1, rand(50, 600));
  }
}

/* ----- Create target matrix from canvas text: sample pixels to form points ----- */
function createTextPoints(text, density = 6) {
  const canvas = document.createElement('canvas');
  const size = Math.min(Math.max(window.innerWidth, 800), 1800);
  canvas.width = size;
  canvas.height = Math.floor(size * 0.6);
  const ctx = canvas.getContext('2d');

  // fill transparent then draw text (cream)
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const fontSize = Math.floor(canvas.height * 0.45);
  ctx.font = `bold ${fontSize}px "Arial"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvas.width/2, canvas.height/2);

  // get pixels and sample
  const img = ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const points = [];
  for (let y=0; y<canvas.height; y+=density){
    for (let x=0; x<canvas.width; x+=density){
      const idx = (y*canvas.width + x) * 4;
      const alpha = img[idx+3];
      if (alpha > 120) {
        // map canvas coords to viewport coords:
        const px = (x - canvas.width/2);
        const py = (y - canvas.height/2);
        points.push([px, -py]); // invert y for screen coords
      }
    }
  }

  // shuffle points to randomize mapping
  for (let i=points.length-1;i>0;i--){
    const j = Math.floor(Math.random() * (i+1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points;
}

/* ----- Animate letters from their start pos to target formation points ----- */
function animateFormation(points) {
  return new Promise(resolve => {
    const centerX = vw()/2;
    const centerY = vh()/2;

    // map letters to points (if fewer points than letters, repeat points)
    const needed = letters.length;
    const targets = [];
    for (let i=0;i<needed;i++){
      const p = points[i % points.length];
      // scale down the canvas coords to visual scale on screen
      const scale = Math.min(vw(), vh()) / Math.max(800, Math.min(vw(), vh()));
      const tx = centerX + p[0] * 0.6 * scale;
      const ty = centerY + p[1] * 0.6 * scale;
      targets.push([tx, ty]);
    }

    // timestamping
    const start = performance.now();
    const duration = FORMATION_TIME;

    function step(now){
      const t = Math.min(1, (now - start)/duration);
      // ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);

      progBar.style.width = `${Math.floor(ease*100)}%`;

      for (let i=0;i<letters.length;i++) {
        const el = letters[i];
        const sx = parseFloat(el.style.left);
        const sy = parseFloat(el.style.top);
        const tx = targets[i][0];
        const ty = targets[i][1];

        const cx = sx + (tx - sx) * ease;
        const cy = sy + (ty - sy) * ease;

        el.style.left = `${cx}px`;
        el.style.top = `${cy}px`;

        // subtle rotation easing to 0
        const rot = (1 - ease) * parseFloat(el.dataset._rot || 0);
        el.style.transform = `translate(-50%,-50%) scale(${1 - 0.05*ease}) rotate(${rot}deg)`;
        el.style.opacity = 0.98 - 0.6 * ease;
        el.style.fontSize = `clamp(12px, ${12 + 8*(1-ease)}px, 28px)`;
      }
      if (t < 1) requestAnimationFrame(step);
      else {
        progBar.style.width = '100%';
        setTimeout(()=> resolve(targets), 200);
      }
    }
    // store initial rotate value
    letters.forEach(el=>{
      const m = el.style.transform.match(/rotate\((-?[\d.]+)deg\)/);
      el.dataset._rot = m ? parseFloat(m[1]) : rand(-30,30);
    });

    requestAnimationFrame(step);
  });
}

/* ----- Floating hearts from bottom (DOM) ----- */
function spawnFloatingHeart() {
  const el = document.createElement('div');
  el.className = 'float-heart';
  el.textContent = Math.random() > 0.45 ? '🖤' : '🩶';
  const left = rand(6, 94);
  el.style.left = left + 'vw';
  const duration = rand(9, 18);
  el.style.animationDuration = `${duration}s`;
  el.style.opacity = rand(0.4, 0.95);
  el.style.fontSize = `${rand(12, 30)}px`;
  floatingLayer.appendChild(el);
  // cleanup
  setTimeout(()=> el.remove(), duration*1000 + 400);
}

/* ----- THREE.JS heart 3D (hidden while forming) ----- */
let scene, camera, renderer, heartMesh, textMesh, threeReady=false;
let container3 = threeContainer;
function initThree() {
  // load three from global (we expect a <script src="...three.min.js"> in HTML)
  if (typeof THREE === 'undefined') {
    console.error('Three.js no está cargado — añade CDN en tu HTML.');
    return;
  }
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 70);

  renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container3.appendChild(renderer.domElement);

  // lights
  const amb = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(amb);
  const p1 = new THREE.PointLight(0xffb6c1, 1.1);
  p1.position.set(30, 30, 30);
  scene.add(p1);
  const p2 = new THREE.PointLight(0xd40078, 1.2);
  p2.position.set(-40, -25, 20);
  scene.add(p2);

  // heart shape -> extrude
  const heartShape = new THREE.Shape();
  // parametric-ish heart using bezier anchors (scaled)
  const s = 1;
  heartShape.moveTo(0*s, 8*s);
  heartShape.bezierCurveTo(0*s, 8*s, -8*s, 10*s, -8*s, 2*s);
  heartShape.bezierCurveTo(-8*s, -6*s, -2*s, -9*s, 0*s, -13*s);
  heartShape.bezierCurveTo(2*s, -9*s, 8*s, -6*s, 8*s, 2*s);
  heartShape.bezierCurveTo(8*s, 10*s, 0*s, 8*s, 0*s, 8*s);

  const extrudeSettings = { depth: 6, bevelEnabled: true, bevelThickness: .8, bevelSize: 1.2, bevelSegments: 3, steps: 2};
  const geo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  geo.computeVertexNormals();
  geo.center();

  // material with slight emissive for glow effect
  const mat = new THREE.MeshStandardMaterial({
    color: 0x331219,
    metalness: 0.15,
    roughness: 0.45,
    emissive: 0x000000,
    emissiveIntensity: 0.9,
  });

  heartMesh = new THREE.Mesh(geo, mat);
  heartMesh.scale.set(2.6, 2.6, 2.6);
  heartMesh.visible = false; // hidden until reveal
  scene.add(heartMesh);

  // Load a font and create 3D text (small, sits in front of heart)
  const loader = new THREE.FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font){
    const tg = new THREE.TextGeometry(NAME, {
      font: font,
      size: 6,
      height: 1.4,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.9,
    });
    tg.center();
    const tm = new THREE.MeshStandardMaterial({ color: 0xf4e8d6, metalness: 0.05, roughness: 0.3 });
    textMesh = new THREE.Mesh(tg, tm);
    textMesh.position.set(0, -2, 9);
    textMesh.visible = false;
    scene.add(textMesh);
  });

  // handle resize
  window.addEventListener('resize', onThreeResize);

  // interaction: rotate heart gently with pointer
  let rx=0, ry=0, tx=0, ty=0;
  function onPointer(e){
    const x = (e.clientX / window.innerWidth) - .5;
    const y = (e.clientY / window.innerHeight) - .5;
    tx = x * 0.6;
    ty = -y * 0.6;
  }
  window.addEventListener('pointermove', onPointer, {passive:true});
  // phone orientation fallback
  window.addEventListener('deviceorientation', (ev)=>{
    if (ev.gamma !== null) {
      tx = (ev.gamma / 90) * 0.6;
      ty = -(ev.beta / 180) * 0.6;
    }
  }, {passive:true});

  // animate loop
  function threeLoop(){
    if (heartMesh){
      // lerp rotation
      rx += (ty - rx) * 0.06;
      ry += (tx - ry) * 0.06;
      heartMesh.rotation.x = rx;
      heartMesh.rotation.y = ry;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(threeLoop);
  }
  threeLoop();
  threeReady = true;
}

function onThreeResize(){
  if (!renderer) return;
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ----- Reveal heart and apply glow ----- */
function revealHeart() {
  if (!threeReady) return;
  // make heart visible with tiny pop
  heartMesh.visible = true;
  heartMesh.scale.set(0.2,0.2,0.2);
  textMesh && (textMesh.visible = true);

  // animate scale up
  const start = performance.now();
  const dur = 700;
  function pop(now){
    const t = Math.min(1, (now-start)/dur);
    const ease = 1 - Math.pow(1 - t, 3);
    const s = 0.2 + 2.4 * ease;
    heartMesh.scale.set(s,s,s);
    // emissive glow progression
    heartMesh.material.emissive.setHex( ease > 0.5 ? 0xffd6c9 : 0x3a0018 );
    heartMesh.material.emissiveIntensity = 0.7 * ease;
    glow.style.opacity = 0.7 * ease;
    if (t < 1) requestAnimationFrame(pop);
    else {
      // keep a subtle breathing glow
      let dir = 1;
      setInterval(()=> {
        const g = 0.4 + Math.random()*0.6;
        heartMesh.material.emissiveIntensity = g;
      }, 1300);
    }
  }
  requestAnimationFrame(pop);
}

/* ----- Clean up letters after reveal (fade out) ----- */
function fadeOutLetters() {
  letters.forEach((el, i) => {
    setTimeout(()=> {
      el.style.transition = 'all 900ms ease';
      el.style.opacity = 0;
      el.style.transform = 'translate(-50%,-50%) scale(.9) rotate(0deg)';
      setTimeout(()=> el.remove(), 1000);
    }, i*6);
  });
}

/* ----- FLOW: spawn -> create points -> animate -> reveal ----- */
async function runSequence(){
  spawnLetters();

  // start spawning floating hearts slowly
  const floatInterval = setInterval(()=> spawnFloatingHeart(), FLOAT_HEART_RATE);

  // create formation points (canvas-based)
  const points = createTextPoints(NAME, 6);

  // slight random jitter in initial letter positions
  letters.forEach(l => {
    l.style.left = rand(0, vw()) + 'px';
    l.style.top = rand(0, vh()) + 'px';
  });

  // animate to formation
  const targets = await animateFormation(points);

  // pause, then reveal heart
  setTimeout(()=>{
    progBar.style.width = '100%';
  }, 200);

  // reveal three heart
  setTimeout(()=>{
    revealHeart();
    fadeOutLetters();
  }, HEART_REVEAL_DELAY + 200);

  // stop floating hearts spawning after a while (they continue briefly)
  setTimeout(()=> clearInterval(floatInterval), 14000);
}

/* ----- INIT ----- */
function initAll(){
  // Inject three.js script dynamically if missing
  if (typeof THREE === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = () => {
      initThree();
      runSequence();
    };
    document.head.appendChild(s);
  } else {
    initThree();
    runSequence();
  }

  // pre-spawn a few floating hearts
  for (let i=0;i<6;i++) setTimeout(()=> spawnFloatingHeart(), i*420);
}

/* start */
initAll();