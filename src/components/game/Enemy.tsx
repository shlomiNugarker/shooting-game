import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import useGameStore from '../../models/gameStore';

// Extended enemy type with the properties we need
interface ExtendedEnemy {
  id: string;
  position: [number, number, number];
  health: number;
  isDead: boolean;
  type: 'normal' | 'fast' | 'heavy';
  state: 'idle' | 'run' | 'attack' | 'damaged' | 'death';
  lastAttackTime: number;
}

interface EnemyProps {
  enemy: any; // Use the existing type from gameStore
  playerPosition: [number, number, number];
}

const Enemy = ({ enemy, playerPosition }: EnemyProps) => {
  const modelRef = useRef<Group>(null);
  const [enemyX, enemyY, enemyZ] = enemy.position;
  
  // Get enemy properties - cast to our extended type
  const enemyData = enemy as ExtendedEnemy;
  const { health, isDead } = enemy;
  // These may not exist in original type, provide defaults
  const type = enemyData.type || 'normal';
  const state = enemyData.state || 'idle';
  
  // Update enemy position and rotation
  useFrame(() => {
    if (!modelRef.current || isDead) return;
    
    // Set position
    modelRef.current.position.set(enemyX, enemyY, enemyZ);
    
    // Face direction (always face the player)
    const direction = playerPosition[0] < enemyX ? 'left' : 'right';
    
    // Apply scale based on direction (flip model)
    const targetScale = new Vector3(
      direction === 'left' ? -1 : 1, 
      1, 
      1
    );
    
    // Smooth transition for scale
    modelRef.current.scale.lerp(targetScale, 0.2);
    
    // Add bobbing animation based on state
    if (state === 'run') {
      modelRef.current.position.y = enemyY + Math.sin(Date.now() * 0.01) * 0.1;
    }
    
    // Add attack animation
    if (state === 'attack') {
      // Quick forward lunge
      const attackOffset = direction === 'left' ? -0.3 : 0.3;
      modelRef.current.position.x = enemyX + attackOffset * Math.sin(Date.now() * 0.05);
    }
  });
  
  // Color based on enemy type
  const getEnemyColor = () => {
    if (isDead) return '#553333';
    
    switch (type) {
      case 'fast': return '#ff3366';
      case 'heavy': return '#aa4422';
      default: return '#ff6633';
    }
  };
  
  // Emissive glow color based on enemy type and state
  const getEmissiveColor = () => {
    if (isDead) return '#331111';
    
    if (state === 'attack') {
      return '#ff0000'; // Bright red during attack
    }
    
    switch (type) {
      case 'fast': return '#ff0033';
      case 'heavy': return '#cc2200';
      default: return '#ff3300';
    }
  };
  
  // Calculate size based on enemy type
  const getEnemySize = (): [number, number, number] => {
    switch (type) {
      case 'fast': return [0.7, 1.7, 0.4]; // Thin and tall
      case 'heavy': return [1.4, 1.4, 0.7]; // Wide and short
      default: return [1, 1.8, 0.5]; // Default size
    }
  };
  
  // Health percentage for visual effects
  const healthPercentage = health / 100;
  
  // Don't render if enemy is marked as fully dead (optional fade out could be added)
  if (isDead) return null;
  
  return (
    <group ref={modelRef}>
      {/* Enemy body */}
      <mesh castShadow>
        <boxGeometry args={getEnemySize()} />
        <meshStandardMaterial 
          color={getEnemyColor()} 
          emissive={getEmissiveColor()} 
          emissiveIntensity={state === 'attack' ? 2 : 0.8}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Enemy eyes (glow brighter during attacks) */}
      <group position={[0.25, 0.4, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff" 
            emissiveIntensity={state === 'attack' ? 3 : 1}
          />
        </mesh>
      </group>
      
      <group position={[-0.25, 0.4, 0.3]}>
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff" 
            emissiveIntensity={state === 'attack' ? 3 : 1}
          />
        </mesh>
      </group>
      
      {/* Health indicator */}
      <mesh position={[0, 1.2, 0]} scale={[healthPercentage, 0.1, 0.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          color={health > 50 ? '#00ff00' : health > 25 ? '#ffff00' : '#ff0000'} 
        />
      </mesh>
      
      {/* Add subtle light to enemy */}
      <pointLight 
        position={[0, 0.5, 0]} 
        distance={3} 
        intensity={0.5}
        color={getEnemyColor()}
      />
      
      {/* Attack effect visualization */}
      {state === 'attack' && (
        <mesh position={[type === 'heavy' ? 0.8 : 0.5, 0, 0.5]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial 
            color="#ff0000" 
            transparent 
            opacity={0.7} 
          />
        </mesh>
      )}
    </group>
  );
};

export default Enemy; 