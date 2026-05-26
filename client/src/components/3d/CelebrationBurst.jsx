import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Confetti({ count = 150 }) {
  const mesh = useRef();
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const color = new THREE.Color();
      const randomColor = ['#5C4AE4', '#F2B94B', '#10D9A0', '#FF4D6D', '#FFFFFF'][Math.floor(Math.random() * 5)];
      color.set(randomColor);
      
      temp.push({
        position: [0, 0, 0], // Start at center
        velocity: [
          (Math.random() - 0.5) * 10,
          Math.random() * 10 + 5,
          (Math.random() - 0.5) * 10
        ],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        rotationSpeed: [
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        ],
        color
      });
    }
    return temp;
  }, [count]);
  
  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.color.r;
      arr[i * 3 + 1] = p.color.g;
      arr[i * 3 + 2] = p.color.b;
    });
    return arr;
  }, [particles, count]);

  useFrame((state, delta) => {
    particles.forEach((particle, i) => {
      // Gravity
      particle.velocity[1] -= 9.8 * delta;
      
      // Update position
      particle.position[0] += particle.velocity[0] * delta;
      particle.position[1] += particle.velocity[1] * delta;
      particle.position[2] += particle.velocity[2] * delta;
      
      // Update rotation
      particle.rotation[0] += particle.rotationSpeed[0];
      particle.rotation[1] += particle.rotationSpeed[1];
      particle.rotation[2] += particle.rotationSpeed[2];
      
      dummy.position.set(...particle.position);
      dummy.rotation.set(...particle.rotation);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <planeGeometry args={[0.2, 0.4]} />
      <meshBasicMaterial side={THREE.DoubleSide} vertexColors />
      <instancedBufferAttribute attach="geometry-attributes-color" args={[colorArray, 3]} />
    </instancedMesh>
  );
}

export default function CelebrationBurst() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ alpha: true }}>
        <ambientLight intensity={1} />
        <Confetti count={200} />
      </Canvas>
    </div>
  );
}
