import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text } from '@react-three/drei';
import * as THREE from 'three';

function TorusMesh({ completionRate = 0 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  // Animate rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const color = completionRate >= 80 ? '#10D9A0' : completionRate >= 50 ? '#F59E0B' : '#FF4D6D';

  return (
    <group ref={meshRef}>
      <mesh>
        <torusGeometry args={[2, 0.4, 32, 100, (completionRate / 100) * Math.PI * 2]} />
        <meshStandardMaterial 
          ref={materialRef} 
          color={color} 
          roughness={0.2} 
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Background track */}
      <mesh>
        <torusGeometry args={[2, 0.38, 16, 100]} />
        <meshStandardMaterial color="#232B42" transparent opacity={0.3} />
      </mesh>
      
      <Center>
        <Text
          position={[0, 0, 0]}
          fontSize={1.2}
          color="#F0F4FF"
          font="https://fonts.gstatic.com/s/syne/v22/8vIJ7w4qzj6q_C-22w.woff"
          anchorX="center"
          anchorY="middle"
        >
          {`${Math.round(completionRate)}%`}
        </Text>
      </Center>
    </group>
  );
}

export default function CompletionTorus({ rate = 0, size = '300px' }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#5C4AE4" />
        <TorusMesh completionRate={rate} />
      </Canvas>
    </div>
  );
}
