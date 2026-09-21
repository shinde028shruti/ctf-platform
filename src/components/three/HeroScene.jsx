import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import SceneLoader from './SceneLoader';
import { supportsWebGL, isMobileDevice } from './support';

function makeNodePoints(n) {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i += 1) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    points.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return points;
}

function makeLinkGeometry(nodeCount, radius) {
  const pts = makeNodePoints(nodeCount).map(([x, y, z]) => [x * radius, y * radius, z * radius]);
  const verts = [];
  for (let i = 0; i < pts.length; i += 1) {
    for (let j = i + 1; j < pts.length; j += 1) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      const dz = pts[i][2] - pts[j][2];
      if (dx * dx + dy * dy + dz * dz < radius * radius * 0.62) {
        verts.push(...pts[i], ...pts[j]);
      }
    }
  }
  return new Float32Array(verts);
}

function glowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(119,100,224,0.9)');
  g.addColorStop(0.35, 'rgba(119,100,224,0.45)');
  g.addColorStop(1, 'rgba(119,100,224,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function NetworkCore() {
  const spin = useRef();
  const group = useRef();

  const nodePositions = useMemo(() => makeNodePoints(54), []);
  const links = useMemo(() => makeLinkGeometry(54, 2.1), []);
  const glowTex = useMemo(() => glowTexture(), []);

  useFrame((state, delta) => {
    if (!spin.current) return;
    spin.current.rotation.y += delta * 0.18;
    if (group.current) {
      group.current.rotation.y = state.pointer.x * 0.45;
      group.current.rotation.x = state.pointer.y * 0.28;
    }
  });

  const nodeSize = isMobileDevice ? 0.11 : 0.13;

  return (
    <group ref={group}>
      <group ref={spin}>
        <group scale={2.4}>
          <sprite>
            <spriteMaterial map={glowTex} transparent depthWrite={false} opacity={0.6} blending={2} />
          </sprite>
        </group>

        <mesh>
          <icosahedronGeometry args={[2.1, 1]} />
          <meshStandardMaterial
            color="#1E2040"
            emissive="#7764E0"
            emissiveIntensity={0.4}
            metalness={0.6}
            roughness={0.4}
            wireframe
          />
        </mesh>

        <mesh>
          <icosahedronGeometry args={[1.12, 3]} />
          <meshStandardMaterial
            color="#4F1F71"
            emissive="#4F1F71"
            emissiveIntensity={0.5}
            transparent
            opacity={0.5}
            roughness={0.5}
          />
        </mesh>

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[links, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#8A7BF0" transparent opacity={0.32} />
        </lineSegments>

        {nodePositions.map((p, i) => (
          <mesh key={i} position={[p[0] * 2.1, p[1] * 2.1, p[2] * 2.1]}>
            <sphereGeometry args={[nodeSize, 12, 12]} />
            <meshBasicMaterial color="#A99EF6" toneMapped={false} />
          </mesh>
        ))}

        <Sparkles
          count={isMobileDevice ? 90 : 200}
          scale={[6, 6, 6]}
          size={2.4}
          speed={0.35}
          opacity={0.8}
          color="#9BA6FF"
        />
      </group>
    </group>
  );
}

function HeroCanvas({ active }) {
  return (
    <Canvas
      dpr={[1, isMobileDevice ? 1.5 : 2]}
      frameloop={active ? 'always' : 'never'}
      gl={{ alpha: true, antialias: !isMobileDevice, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 7], fov: 42 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.25} color="#7764E0" />
      <pointLight intensity={1} distance={12} color="#8A7BF0" position={[4, 3, 5]} />
      <pointLight intensity={0.5} distance={10} color="#4F1F71" position={[-4, -3, 3]} />
      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.9}>
        <NetworkCore />
      </Float>
    </Canvas>
  );
}

export default function HeroScene() {
  const [active, setActive] = useState(true);
  const [webgl] = useState(() => supportsWebGL());
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const obs = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: '120px',
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!webgl) return <SceneLoader label="webgl unavailable" />;

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} aria-hidden="true">
      <Suspense fallback={<SceneLoader label="loading scene" />}>
        <HeroCanvas active={active} />
      </Suspense>
    </div>
  );
}