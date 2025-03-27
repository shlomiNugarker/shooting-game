import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const BackgroundParticles = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animate the containing group instead
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });
  
  return (
    <group ref={groupRef}>
      <Sparkles
        count={200}
        scale={[30, 10, 30]}
        size={0.5}
        speed={0.3}
        color="#5d8bf5"
        opacity={0.5}
      />
      <Sparkles
        count={100}
        scale={[20, 8, 20]}
        size={1}
        speed={0.2}
        color="#ff5050"
        opacity={0.3}
      />
    </group>
  );
};

export default BackgroundParticles; 