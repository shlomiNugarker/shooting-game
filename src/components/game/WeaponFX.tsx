import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail } from '@react-three/drei';
import * as THREE from 'three';
import useGameStore from '../../models/gameStore';

interface WeaponFXProps {
  weaponType: string;
  position: [number, number, number];
  direction: 'left' | 'right';
  isActive: boolean;
}

const WeaponFX = ({ weaponType, position, direction, isActive }: WeaponFXProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const effectsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  
  // Set of effects to show based on weapon type
  useEffect(() => {
    if (!isActive) return;
    
    // Reset effect time when activated
    timeRef.current = 0;
    
    // Position effect based on player direction
    if (groupRef.current) {
      const directionMultiplier = direction === 'right' ? 1 : -1;
      groupRef.current.position.x = position[0] + 0.8 * directionMultiplier;
      groupRef.current.position.y = position[1] + 0.5;
      groupRef.current.position.z = position[2];
    }
  }, [isActive, position, direction]);
  
  // Animate the weapon effects
  useFrame((_, delta) => {
    if (!isActive || !effectsRef.current) return;
    
    // Track effect time
    timeRef.current += delta;
    
    // Fade out effect after a certain duration
    const effectDuration = 0.5; // seconds
    if (timeRef.current > effectDuration) {
      if (effectsRef.current) {
        effectsRef.current.scale.setScalar(
          Math.max(0, 1 - (timeRef.current - effectDuration) * 5)
        );
      }
    }
    
    // Rotate based on weapon type
    if (weaponType === 'laser' || weaponType === 'plasma') {
      effectsRef.current.rotation.z += delta * 10;
    }
  });
  
  if (!isActive) return null;
  
  // Render different effects based on weapon type
  return (
    <group ref={groupRef}>
      <group ref={effectsRef}>
        {weaponType === 'pistol' && (
          <>
            <Sphere args={[0.2, 8, 8]} position={[0, 0, 0]}>
              <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
            </Sphere>
            <pointLight color="#ffaa00" intensity={2} distance={3} />
          </>
        )}
        
        {weaponType === 'shotgun' && (
          <>
            <Sphere args={[0.3, 8, 8]} position={[0, 0, 0]}>
              <meshBasicMaterial color="#ff5500" transparent opacity={0.8} />
            </Sphere>
            <pointLight color="#ff5500" intensity={3} distance={4} />
          </>
        )}
        
        {weaponType === 'rifle' && (
          <>
            <Sphere args={[0.15, 8, 8]} position={[0, 0, 0]}>
              <meshBasicMaterial color="#ffff00" transparent opacity={0.9} />
            </Sphere>
            <pointLight color="#ffff00" intensity={2.5} distance={3.5} />
          </>
        )}
        
        {weaponType === 'laser' && (
          <>
            <Sphere args={[0.25, 12, 12]} position={[0, 0, 0]}>
              <meshBasicMaterial color="#00ffff" transparent opacity={0.7} />
            </Sphere>
            <pointLight color="#00ffff" intensity={3} distance={5} />
          </>
        )}
        
        {weaponType === 'plasma' && (
          <>
            <Sphere args={[0.35, 16, 16]} position={[0, 0, 0]}>
              <meshBasicMaterial color="#ff00ff" transparent opacity={0.6} />
            </Sphere>
            <pointLight color="#ff00ff" intensity={4} distance={6} />
          </>
        )}
      </group>
    </group>
  );
};

export default WeaponFX; 