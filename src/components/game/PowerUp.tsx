import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Powerup } from '../../models/gameStore';

interface PowerUpProps {
  powerup: Powerup;
}

// Map powerup types to colors
const powerupColors = {
  'health': '#ff5555',
  'weapon': '#ffaa00',
  'energy': '#55aaff',
  'shield': '#55ffaa',
  'coin': '#ffff55',
  'experience': '#aa55ff'
};

const PowerUp = ({ powerup }: PowerUpProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animate the powerup (bobbing and rotating)
  useFrame((_, delta) => {
    if (groupRef.current && !powerup.isCollected) {
      // Bob up and down
      groupRef.current.position.y = powerup.position[1] + Math.sin(Date.now() * 0.003) * 0.2;
      
      // Rotate
      groupRef.current.rotation.y += delta * 2;
    }
  });
  
  if (powerup.isCollected) {
    return null;
  }
  
  return (
    <group 
      ref={groupRef}
      position={[powerup.position[0], powerup.position[1], powerup.position[2]]}
    >
      {/* Main sphere */}
      <Sphere args={[0.4, 16, 16]}>
        <meshStandardMaterial 
          color={powerupColors[powerup.type]} 
          emissive={powerupColors[powerup.type]}
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.7}
          transparent={true}
          opacity={0.8}
        />
      </Sphere>
      
      {/* Inner glow */}
      <pointLight 
        color={powerupColors[powerup.type]} 
        intensity={1.5} 
        distance={3}
        decay={2}
      />
      
      {/* Outer shell */}
      <Sphere args={[0.5, 16, 16]}>
        <meshStandardMaterial 
          color={'white'} 
          transparent={true}
          opacity={0.2}
          roughness={0.1}
          metalness={0.9}
        />
      </Sphere>
    </group>
  );
};

export default PowerUp; 