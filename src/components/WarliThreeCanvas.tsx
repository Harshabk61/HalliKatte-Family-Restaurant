import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const _targetMouse = new THREE.Vector2(0, 0);
const _currentMouse = new THREE.Vector2(0, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createClayDiyaGroup(
  clayMat: THREE.MeshStandardMaterial,
  goldMat: THREE.MeshStandardMaterial,
  flameMat: THREE.MeshBasicMaterial,
  haloMat: THREE.MeshBasicMaterial,
): THREE.Group {
  const group = new THREE.Group();

  // 1. Base pedestal
  const baseGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.08, 18);
  const base = new THREE.Mesh(baseGeo, clayMat);
  base.position.y = 0.04;
  group.add(base);

  // 2. Sculpted oil bowl (LatheGeometry)
  const bowlPoints = [
    new THREE.Vector2(0.02, 0.08),
    new THREE.Vector2(0.24, 0.11),
    new THREE.Vector2(0.32, 0.21),
    new THREE.Vector2(0.29, 0.24),
    new THREE.Vector2(0.18, 0.14),
    new THREE.Vector2(0.01, 0.12),
  ];
  const bowlGeo = new THREE.LatheGeometry(bowlPoints, 24);
  const bowl = new THREE.Mesh(bowlGeo, clayMat);
  group.add(bowl);

  // 3. Rim trim ring
  const rimGeo = new THREE.TorusGeometry(0.3, 0.015, 8, 28);
  const rim = new THREE.Mesh(rimGeo, goldMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.22;
  group.add(rim);

  // 4. Wick flame teardrop
  const flameGeo = new THREE.ConeGeometry(0.045, 0.16, 12);
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0.18, 0.29, 0);
  flame.name = 'flame';
  group.add(flame);

  // 5. Soft warm flame halo sphere
  const haloGeo = new THREE.SphereGeometry(0.14, 14, 14);
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.set(0.18, 0.3, 0);
  halo.name = 'halo';
  group.add(halo);

  return group;
}

function createWarliBirdGroup(birdMat: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  const wingGeo = new THREE.BoxGeometry(0.22, 0.02, 0.05);
  const leftWing = new THREE.Mesh(wingGeo, birdMat);
  leftWing.position.set(-0.11, 0.02, 0);
  leftWing.rotation.z = 0.32;
  leftWing.name = 'leftWing';

  const rightWing = new THREE.Mesh(wingGeo, birdMat);
  rightWing.position.set(0.11, 0.02, 0);
  rightWing.rotation.z = -0.32;
  rightWing.name = 'rightWing';

  const bodyGeo = new THREE.ConeGeometry(0.035, 0.18, 8);
  const body = new THREE.Mesh(bodyGeo, birdMat);
  body.rotation.x = Math.PI / 2;

  group.add(body, leftWing, rightWing);
  return group;
}

function createWarliMandalaGroup(
  whiteMat: THREE.MeshStandardMaterial,
  goldMat: THREE.MeshStandardMaterial,
): THREE.Group {
  const group = new THREE.Group();

  // Outer sacred ring
  const outerRingGeo = new THREE.TorusGeometry(2.65, 0.016, 8, 72);
  const outerRing = new THREE.Mesh(outerRingGeo, whiteMat);
  group.add(outerRing);

  // Inner brass ring
  const innerRingGeo = new THREE.TorusGeometry(2.05, 0.012, 8, 64);
  const innerRing = new THREE.Mesh(innerRingGeo, goldMat);
  group.add(innerRing);

  // Instanced geometric Warli triangles around the mandala circumference
  const triCount = 18;
  const triGeo = new THREE.ConeGeometry(0.11, 0.22, 3);
  const triMesh = new THREE.InstancedMesh(triGeo, whiteMat, triCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < triCount; i++) {
    const angle = (i / triCount) * Math.PI * 2;
    const radius = 2.35;
    dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    dummy.rotation.set(0, 0, angle - Math.PI / 2);
    dummy.scale.set(1, 1, 0.4);
    dummy.updateMatrix();
    triMesh.setMatrixAt(i, dummy.matrix);
  }
  triMesh.instanceMatrix.needsUpdate = true;
  group.add(triMesh);

  // Secondary counter-ring of golden dots
  const dotCount = 24;
  const dotGeo = new THREE.SphereGeometry(0.032, 8, 8);
  const dotMesh = new THREE.InstancedMesh(dotGeo, goldMat, dotCount);
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2;
    const radius = 2.86;
    dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    dotMesh.setMatrixAt(i, dummy.matrix);
  }
  dotMesh.instanceMatrix.needsUpdate = true;
  group.add(dotMesh);

  return group;
}

export function WarliThreeCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      50,
    );
    camera.position.set(0, 0.3, 8.2);

    // Warm key + soft hemisphere fill + flickering diya point lights
    const keyLight = new THREE.DirectionalLight(0xffe6c2, 1.35);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xfff5e4, 0x542820, 0.78);
    scene.add(hemiLight);

    const leftDiyaLight = new THREE.PointLight(0xffb85c, 1.8, 6.5, 1.8);
    leftDiyaLight.position.set(-4.1, -1.5, 1.5);
    scene.add(leftDiyaLight);

    const rightDiyaLight = new THREE.PointLight(0xffb85c, 1.6, 6.5, 1.8);
    rightDiyaLight.position.set(4.5, -1.55, 1.3);
    scene.add(rightDiyaLight);

    // Materials
    const clayMat = new THREE.MeshStandardMaterial({
      color: 0x8b493b,
      roughness: 0.78,
      metalness: 0.05,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc49a5a,
      roughness: 0.35,
      metalness: 0.75,
    });
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffd580,
      transparent: true,
      opacity: 0.92,
    });
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffb85c,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const birdMat = new THREE.MeshStandardMaterial({
      color: 0xfff9ef,
      roughness: 0.65,
      metalness: 0.08,
    });
    const mandalaWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfff9ef,
      roughness: 0.55,
      metalness: 0.1,
      transparent: true,
      opacity: 0.22,
    });
    const mandalaGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc49a5a,
      roughness: 0.38,
      metalness: 0.68,
      transparent: true,
      opacity: 0.32,
    });

    // Subtle geometric Warli Mandala behind center focal area
    const mandala = createWarliMandalaGroup(mandalaWhiteMat, mandalaGoldMat);
    mandala.position.set(0, 0.2, -2.4);
    scene.add(mandala);

    // Floating terracotta oil diyas in lower corner accents
    const diyaLeft = createClayDiyaGroup(clayMat, goldMat, flameMat, haloMat);
    diyaLeft.position.set(-4.3, -1.9, 1.2);
    diyaLeft.scale.setScalar(1.05);
    scene.add(diyaLeft);

    const diyaRight = createClayDiyaGroup(clayMat, goldMat, flameMat, haloMat);
    diyaRight.position.set(4.4, -1.95, 1.0);
    diyaRight.scale.setScalar(0.95);
    scene.add(diyaRight);

    // 3D layered Warli birds
    const birds: Array<{
      group: THREE.Group;
      baseX: number;
      baseY: number;
      z: number;
      speed: number;
      phase: number;
    }> = [];

    for (let i = 0; i < 6; i++) {
      const bird = createWarliBirdGroup(birdMat);
      const bx = -5 + i * 2.0;
      const by = 1.4 + (i % 3) * 0.45;
      const bz = -1.2 + (i % 2) * 0.8;
      bird.position.set(bx, by, bz);
      bird.scale.setScalar(0.75 + (i % 3) * 0.15);
      scene.add(bird);
      birds.push({
        group: bird,
        baseX: bx,
        baseY: by,
        z: bz,
        speed: 0.22 + (i % 3) * 0.08,
        phase: i * 1.1,
      });
    }

    // Warm golden rice-husk / ember dust particles
    const particleCount = 85;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      speeds[i] = 0.08 + Math.random() * 0.18;
    }
    particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0xffecd1,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      _targetMouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      _targetMouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let scrollProgress = 0;
    const onScroll = () => {
      const h = Math.max(window.innerHeight, 1);
      scrollProgress = Math.min(Math.max(window.scrollY / h, 0), 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let smoothScroll = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        _currentMouse.x = THREE.MathUtils.damp(
          _currentMouse.x,
          _targetMouse.x,
          4.5,
          delta,
        );
        _currentMouse.y = THREE.MathUtils.damp(
          _currentMouse.y,
          _targetMouse.y,
          4.5,
          delta,
        );
        smoothScroll = THREE.MathUtils.damp(
          smoothScroll,
          scrollProgress,
          5,
          delta,
        );

        camera.position.x = _currentMouse.x * 0.32;
        camera.position.y = 0.3 + _currentMouse.y * 0.18 - smoothScroll * 0.55;
        camera.position.z = 8.2 + smoothScroll * 1.1;
        camera.lookAt(0, -smoothScroll * 0.25, 0);

        // Slow sacred Warli mandala rotation & gentle tilt
        mandala.rotation.z = elapsed * 0.045;
        mandala.rotation.x = _currentMouse.y * 0.08;
        mandala.rotation.y = _currentMouse.x * 0.1;

        // Diya flame + PointLight flicker
        const f1 = diyaLeft.getObjectByName('flame');
        const h1 = diyaLeft.getObjectByName('halo');
        const f2 = diyaRight.getObjectByName('flame');
        const h2 = diyaRight.getObjectByName('halo');
        const flicker1 = 1 + Math.sin(elapsed * 7.5) * 0.16;
        const flicker2 = 1 + Math.cos(elapsed * 6.8) * 0.16;
        if (f1) f1.scale.y = flicker1;
        if (h1) h1.scale.setScalar(0.95 + Math.sin(elapsed * 7.5) * 0.12);
        if (f2) f2.scale.y = flicker2;
        if (h2) h2.scale.setScalar(0.95 + Math.cos(elapsed * 6.8) * 0.12);
        leftDiyaLight.intensity = 1.6 + Math.sin(elapsed * 8.2) * 0.35;
        rightDiyaLight.intensity = 1.45 + Math.cos(elapsed * 7.4) * 0.35;

        // Wing flap & gentle bird flight
        for (const b of birds) {
          const x = ((b.baseX + elapsed * b.speed + 6) % 12) - 6;
          const y = b.baseY + Math.sin(elapsed * 1.2 + b.phase) * 0.18;
          b.group.position.set(x, y, b.z);
          const lw = b.group.getObjectByName('leftWing');
          const rw = b.group.getObjectByName('rightWing');
          const flap = Math.sin(elapsed * 5.5 + b.phase) * 0.32;
          if (lw) lw.rotation.z = 0.25 + flap;
          if (rw) rw.rotation.z = -0.25 - flap;
        }

        // Gentle upward drift of golden dust
        const posAttr = particleGeo.getAttribute(
          'position',
        ) as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          let py = posAttr.getY(i) + speeds[i] * delta;
          if (py > 3.5) py = -3.5;
          posAttr.setY(i, py);
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      }
    }

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      tick();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);

      particleGeo.dispose();
      particleMat.dispose();
      clayMat.dispose();
      goldMat.dispose();
      flameMat.dispose();
      haloMat.dispose();
      birdMat.dispose();
      mandalaWhiteMat.dispose();
      mandalaGoldMat.dispose();
      envTex.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
          obj.geometry.dispose();
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-15"
      aria-hidden="true"
    />
  );
}
