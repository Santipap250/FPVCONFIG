"use client";

import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  Clock,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
} from "three";

function buildDrone(): Group {
  const drone = new Group();

  const frameMaterial = new MeshStandardMaterial({
    color: 0x0c1410,
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0x0a2a1c,
    emissiveIntensity: 0.4,
  });

  const armMaterial = new MeshStandardMaterial({
    color: 0x111a16,
    metalness: 0.7,
    roughness: 0.3,
  });

  const phosphorMaterial = new MeshStandardMaterial({
    color: 0x7cffb2,
    emissive: 0x7cffb2,
    emissiveIntensity: 1.4,
    toneMapped: false,
  });

  const amberMaterial = new MeshStandardMaterial({
    color: 0xffb454,
    emissive: 0xffb454,
    emissiveIntensity: 1.2,
    toneMapped: false,
  });

  const bladeMaterial = new MeshStandardMaterial({
    color: 0x0a0f0d,
    metalness: 0.2,
    roughness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  // Central hub — a flattened octahedron reads as a compact FPV frame body
  const hub = new Mesh(new OctahedronGeometry(0.34, 0), frameMaterial);
  hub.scale.set(1, 0.45, 1);
  drone.add(hub);

  // Front-facing LED (orientation indicator, common on real FPV frames)
  const frontLed = new Mesh(new SphereGeometry(0.05, 12, 12), phosphorMaterial);
  frontLed.position.set(0, 0.05, 0.42);
  drone.add(frontLed);

  const armLength = 0.95;
  const armAngles = [45, 135, 225, 315];

  armAngles.forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const armGroup = new Group();
    armGroup.rotation.y = rad;

    const arm = new Mesh(new BoxGeometry(0.09, 0.06, armLength), armMaterial);
    arm.position.set(0, 0, armLength / 2);
    armGroup.add(arm);

    const motor = new Mesh(new CylinderGeometry(0.11, 0.13, 0.16, 16), frameMaterial);
    motor.position.set(0, 0.05, armLength);
    armGroup.add(motor);

    const motorRing = new Mesh(
      new TorusGeometry(0.115, 0.012, 8, 20),
      deg === 45 || deg === 135 ? amberMaterial : phosphorMaterial
    );
    motorRing.rotation.x = Math.PI / 2;
    motorRing.position.set(0, 0.13, armLength);
    armGroup.add(motorRing);

    // Two-blade propeller — spins independently in the render loop
    const propGroup = new Group();
    propGroup.position.set(0, 0.15, armLength);
    propGroup.name = "propeller";

    const blade1 = new Mesh(new BoxGeometry(0.85, 0.008, 0.11), bladeMaterial);
    const blade2 = blade1.clone();
    blade2.rotation.y = Math.PI / 2;
    propGroup.add(blade1, blade2);

    armGroup.add(propGroup);
    drone.add(armGroup);
  });

  return drone;
}

// Building the scene (geometry, materials, renderer) and starting the
// render loop is real synchronous work — enough to show up as "long tasks"
// on the main thread if it runs the instant this component mounts, which
// competes with the browser painting the actual page content (headline,
// CTA) that visitors came for. Deferring it to an idle moment lets that
// paint happen first; the drone appears a beat later instead of blocking
// it. Safari has no requestIdleCallback, hence the setTimeout fallback.
function onIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 1200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
}

export default function DroneScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const cancelIdle = onIdle(() => {
      if (cancelled) return;
      cleanup = setupScene(container, fallbackRef.current);
    });

    return () => {
      cancelled = true;
      cancelIdle();
      cleanup?.();
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="h-full w-full" aria-hidden="true" />
      <div
        ref={fallbackRef}
        className="absolute inset-0 hidden items-center justify-center text-xs text-muted"
        aria-hidden="true"
      >
        <span className="font-hud">3D preview unavailable on this device</span>
      </div>
    </>
  );
}

function setupScene(container: HTMLDivElement, fallbackEl: HTMLDivElement | null): (() => void) | undefined {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer: WebGLRenderer;
  try {
    // antialias:false — MSAA is real GPU cost per frame, and on the small
    // (usually <400px) HUD panel this renders into, jagged edges on a dark
    // glowing UI aren't very noticeable. Trading it away lowers the cost of
    // every single frame, not just the first one.
    renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  } catch {
    if (fallbackEl) fallbackEl.style.display = "flex";
    return undefined;
  }

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0.6, 1.15, 3.1);
  camera.lookAt(0, 0, 0);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  scene.add(new AmbientLight(0x0d1a14, 1.4));
  const keyLight = new PointLight(0x7cffb2, 6, 8, 2);
  keyLight.position.set(-1.5, 1.8, 1.5);
  scene.add(keyLight);
  const rimLight = new PointLight(0xffb454, 3, 8, 2);
  rimLight.position.set(1.8, 0.6, -1.2);
  scene.add(rimLight);

  const drone = buildDrone();
  scene.add(drone);

  const propellers = drone.children
    .flatMap((armGroup) => armGroup.children)
    .filter((child): child is Group => child.name === "propeller");

  let frameId: number;
  let elapsed = 0;
  const clock = new Clock();

  const animate = () => {
    const delta = clock.getDelta();
    elapsed += delta;

    const motionScale = prefersReducedMotion ? 0.04 : 1;

    drone.rotation.y = elapsed * 0.25 * motionScale;
    drone.rotation.z = Math.sin(elapsed * 0.6) * 0.16 * motionScale;
    drone.rotation.x = Math.sin(elapsed * 0.4) * 0.05 * motionScale;
    drone.position.y = Math.sin(elapsed * 0.9) * 0.04 * motionScale;

    propellers.forEach((prop, i) => {
      prop.rotation.y += delta * (i % 2 === 0 ? 22 : -22) * motionScale;
    });

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };
  animate();

  const handleResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => m.dispose());
      }
    });
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };
}
