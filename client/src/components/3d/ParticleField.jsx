import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 120 }) {
  const mesh = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 80;
      const speed = 0.005 + Math.random() / 400;
      const xFactor = -40 + Math.random() * 80;
      const yFactor = -40 + Math.random() * 80;
      const zFactor = -30 + Math.random() * 60;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.t += p.speed;
      const t = p.t;
      
      dummy.position.set(
        p.xFactor + Math.cos(t * 0.1 * p.factor) * 2,
        p.yFactor + Math.sin(t * 0.1 * p.factor) * 2,
        p.zFactor + Math.cos(t * 0.08) * 2
      );
      const s = 0.5 + Math.sin(t) * 0.5;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial color="#6C5CE7" transparent opacity={0.25} />
    </instancedMesh>
  );
}

export default function ParticleField() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
      <Canvas
        camera={{ fov: 100, position: [0, 0, 30] }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Particles count={120} />
      </Canvas>
    </div>
  );
}
