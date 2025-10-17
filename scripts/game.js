// Cosmic Drift — Endless 3D Game (Three.js)
// Part 1: Core initialization and game setup

(function () {
  const wrap = document.getElementById('game-wrap');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const thumbBtn = document.getElementById('thumbBtn');
  const scoreEl = document.getElementById('score');
  const msg = document.getElementById('msg');

  let scene, camera, renderer, ship, light, stars;
  let obstacles = [];
  let speed = 1.2;
  let obstacleSpeed = 0.06;
  let running = false, paused = false;
  let distance = 0;
  let width = wrap.clientWidth, height = wrap.clientHeight;
  let pointerX = 0, targetX = 0;

  init();
  animate();

  function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    wrap.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04102a, 0.0025);

    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 2.5, 8);

    light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(5, 10, 7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x7a8fb3, 0.45));

    const shipMat = new THREE.MeshStandardMaterial({ color: 0xa6f0ff, emissive: 0x072632, metalness: 0.2, roughness: 0.3 });
    const shipBody = new THREE.ConeGeometry(0.35, 1.1, 8);
    ship = new THREE.Mesh(shipBody, shipMat);
    ship.rotation.x = Math.PI / 2;
    ship.position.set(0, 1.6, 0);
    scene.add(ship);

    const spriteMat = new THREE.SpriteMaterial({ map: makeGlowTexture(), blending: THREE.AdditiveBlending, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 1.6, 1.6);
    sprite.position.set(0, 1.6, -0.6);
    scene.add(sprite);

    createStarfield();
    createTrack();

    for (let i = 0; i < 28; i++) spawnObstacle(true);

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch, { passive: false });
    window.addEventListener('keydown', onKey);

    startBtn.addEventListener('click', () => { if (!running) start(); else reset(); });
    pauseBtn.addEventListener('click', togglePause);
    thumbBtn.addEventListener('click', downloadThumbnail);

    showMessage('Press Start — glide through the stars', 2500);
  }

  function start() {
    running = true; paused = false; distance = 0; speed = 1.2; obstacleSpeed = 0.06;
    startBtn.textContent = 'Restart';
    pauseBtn.textContent = 'Pause';
    showMessage('', 0);
  }

  function reset() {
    obstacles.forEach(obj => {
      obj.mesh.position.set((Math.random() - 0.5) * 8, (Math.random() * 2) + 0.8, -Math.random() * 400 - 20);
      obj.mesh.scale.setScalar(1 + Math.random() * 1.6);
    })
    distance = 0;
  }

  function togglePause() { if (!running) return; paused = !paused; pauseBtn.textContent = paused ? 'Resume' : 'Pause'; }
  function onResize() { width = wrap.clientWidth; height = wrap.clientHeight; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); }
  function onMove(e) { pointerX = (e.clientX / window.innerWidth) * 2 - 1; targetX = pointerX * 4; }
  function onTouch(e) { e.preventDefault(); const t = e.touches[0]; pointerX = (t.clientX / window.innerWidth) * 2 - 1; targetX = pointerX * 4; }
  function onKey(e) { if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') targetX -= 0.6; if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') targetX += 0.6; }

  function spawnObstacle(initial) {
    const geo = new THREE.DodecahedronGeometry(0.6 + Math.random() * 1.4, 0);
    const mat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, roughness: 0.8, metalness: 0.0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * 8, (Math.random() * 2) + 0.8, - (Math.random() * 400 + (initial ? Math.random() * 120 : 60)));
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    mesh.userData = { rotSpeed: (Math.random() - 0.5) * 0.02 };
    mesh.scale.setScalar(1 + Math.random() * 1.4);
    scene.add(mesh);
    obstacles.push({ mesh });
  }

  function recycleObstacle(obj) {
    obj.mesh.position.z = - (Math.random() * 300 + 80);
    obj.mesh.position.x = (Math.random() - 0.5) * 7.8;
    obj.mesh.position.y = (Math.random() * 2) + 0.7;
    obj.mesh.scale.setScalar(0.8 + Math.random() * 1.8);
    obj.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  }
  // Cosmic Drift — Endless 3D Game (Three.js)
  // Part 2: Animation, collision, scoring, and utilities

  function createStarfield() {
    const starsCount = 1600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40 + 1;
      positions[i * 3 + 2] = -Math.random() * 1200;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ size: 0.9, transparent: true, opacity: 0.9 });
    stars = new THREE.Points(geo, mat);
    scene.add(stars);
  }

  function createTrack() {
    const geom = new THREE.CylinderGeometry(0.02, 0.02, 2000, 8, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color: 0x0b1530, wireframe: true, opacity: 0.06, transparent: true });
    const track = new THREE.Mesh(geom, mat);
    track.rotation.x = Math.PI / 2;
    track.position.z = -1000;
    scene.add(track);
  }

  function makeGlowTexture() {
    const size = 128;
    const can = document.createElement('canvas'); can.width = can.height = size;
    const ctx = can.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 1.2);
    grad.addColorStop(0, 'rgba(166,240,255,0.95)');
    grad.addColorStop(0.4, 'rgba(166,240,255,0.25)');
    grad.addColorStop(1, 'rgba(166,240,255,0.0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(can);
  }

  function showMessage(text, duration = 2000) {
    msg.textContent = text;
    msg.style.opacity = 1;
    if (duration > 0) {
      setTimeout(() => { msg.style.opacity = 0; }, duration);
    }
  }

  function downloadThumbnail() {
    const link = document.createElement('a');
    link.download = 'cosmic-drift-thumbnail.png';
    renderer.render(scene, camera);
    renderer.domElement.toBlob(function (blob) {
      link.href = URL.createObjectURL(blob);
      link.click();
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    camera.position.x += ((ship.position.x * 0.2) - camera.position.x) * 0.07;
    camera.lookAt(new THREE.Vector3(0, 1.2, -10));

    if (running && !paused) {
      distance += speed * 0.3;
      scoreEl.textContent = 'Distance: ' + Math.floor(distance) + ' m';

      ship.position.x += (targetX - ship.position.x) * 0.09;
      ship.rotation.z = THREE.MathUtils.lerp(ship.rotation.z, (ship.position.x - targetX) * 0.06, 0.08);

      obstacles.forEach(obj => {
        obj.mesh.position.z += obstacleSpeed * (30 * speed);
        obj.mesh.rotation.x += obj.mesh.userData.rotSpeed;
        obj.mesh.rotation.y += obj.mesh.userData.rotSpeed * 0.6;

        const dx = obj.mesh.position.x - ship.position.x;
        const dz = obj.mesh.position.z - ship.position.z;
        const dy = obj.mesh.position.y - ship.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.9) { running = false; showMessage('Crashed! Distance: ' + Math.floor(distance) + ' m — Press Restart'); }

        if (obj.mesh.position.z > 10) { recycleObstacle(obj); }
      });

      const pos = stars.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) { pos[i + 2] += obstacleSpeed * 40; if (pos[i + 2] > 10) pos[i + 2] = -1200; }
      stars.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }
})();