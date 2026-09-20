import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { isMobileDevice } from './support';

function StarLayer({ count, color, size, speed, spread }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * spread[0];
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread[2] - 6;
    }
    return arr;
  }, [count, spread]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed * 0.5;
    ref.current.rotation.x = Math.max(-0.5, Math.min(0.5, ref.current.rotation.x)) + state.pointer.y * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        sizeAttenuation
        transparent
        opacity={0.9}
        color={color}
        depthWrite={false}
        blending={2}
      />
    </points>
  );
}

function DriftPackets() {
  const ref = useRef();

  const lines = useMemo(() => {
    const pairs = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 12; i += 1) {
      const x1 = (rand() - 0.5) * 120;
      const y1 = (rand() - 0.5) * 70;
      const z1 = (rand() - 0.5) * 40 - 8;
      const x2 = x1 + (rand() - 0.5) * 30;
      const y2 = y1 + (rand() - 0.5) * 16;
      const z2 = z1 + (rand() - 0.5) * 10;
      pairs.push(x1, y1, z1, x2, y2, z2);
    }
    return new Float32Array(pairs);
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.05) * 2;
    ref.current.rotation.z += delta * 0.004;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[lines, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#4F1F71" transparent opacity={0.28} />
    </lineSegments>
  );
}

function FieldContent() {
  const count = isMobileDevice ? 900 : 2400;
  return (
    <>
      <DriftPackets />
      <StarLayer count={count} color="#A99EF6" size={0.09} speed={0.02} spread={[150, 90, 70]} />
      <StarLayer count={Math.round(count * 0.5)} color="#F4F4F5" size={0.05} speed={0.03} spread={[120, 70, 50]} />
    </>
  );
}

export default function ParticleField() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = document.body;
    if (!('IntersectionObserver' in window)) return undefined;
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
      rootMargin: '50px',
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {visible && (
        <Canvas
          dpr={[1, isMobileDevice ? 1.5 : 1.75]}
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 14], fov: 60 }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <FieldContent />
        </Canvas>
      )}
    </div>
  );
}