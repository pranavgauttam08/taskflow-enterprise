import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

function Bar3D({ position, height, color, label }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + (height / 2) + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[position[0], position[1] + height / 2, position[2]]}>
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      <Text
        position={[position[0], position[1] - 0.5, position[2]]}
        fontSize={0.4}
        color="#8892B0"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[position[0], position[1] + height + 0.5, position[2]]}
        fontSize={0.5}
        color="#F0F4FF"
        anchorX="center"
        anchorY="middle"
      >
        {Math.round(height * 10)}
      </Text>
    </group>
  );
}

export default function AnimatedBarChart3D({ data = [] }) {
  // data = [{ label: 'Mon', value: 80, color: '#5C4AE4' }]
  const maxVal = Math.max(...data.map(d => d.value), 100);

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#F2B94B" />
        
        <group position={[-((data.length - 1) * 1.5) / 2, -2, 0]}>
          {data.map((d, i) => (
            <Bar3D 
              key={i} 
              position={[i * 1.5, 0, 0]} 
              height={(d.value / maxVal) * 4} 
              color={d.color || '#5C4AE4'} 
              label={d.label} 
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
}
