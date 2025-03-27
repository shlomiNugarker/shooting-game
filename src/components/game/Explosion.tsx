import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface ExplosionProps {
  position: [number, number, number];
  color?: string;
  scale?: number;
  onComplete?: () => void;
}

interface Particle {
  position: [number, number, number];
  velocity: [number, number, number];
  scale: number;
  rotation: number;
  rotationSpeed: number;
}

const PARTICLE_COUNT = 15;
const EXPLOSION_DURATION = 1000; // milliseconds

const Explosion = ({ position, color = '#ff5500', scale = 1, onComplete }: ExplosionProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const startTime = useRef(Date.now());
  const groupRef = useRef<THREE.Group>(null);
  
  // Initialize particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.1;
      
      newParticles.push({
        position: [...position] as [number, number, number],
        velocity: [
          Math.cos(angle) * speed,
          (Math.random() - 0.3) * speed * 2,
          Math.sin(angle) * speed
        ] as [number, number, number],
        scale: (0.2 + Math.random() * 0.3) * scale,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    
    setParticles(newParticles);
    startTime.current = Date.now();
    
    // Call onComplete after the explosion duration
    if (onComplete) {
      const timer = setTimeout(onComplete, EXPLOSION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [position, scale, onComplete]);
  
  // Animate particles
  useFrame(() => {
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / EXPLOSION_DURATION, 1);
    
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        const [x, y, z] = particle.position;
        const [vx, vy, vz] = particle.velocity;
        
        // Apply gravity
        const newVy = vy - 0.001;
        
        return {
          ...particle,
          position: [x + vx, y + newVy, z + vz] as [number, number, number],
          velocity: [vx, newVy, vz] as [number, number, number],
          rotation: particle.rotation + particle.rotationSpeed,
          scale: particle.scale * (1 - progress * 0.8) // Shrink over time
        };
      })
    );
  });
  
  return (
    <group ref={groupRef}>
      <Instances limit={PARTICLE_COUNT}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial 
          color={color} 
          transparent={true} 
          opacity={0.8}
          toneMapped={false}
        />
        
        {particles.map((particle, index) => (
          <Instance 
            key={index}
            position={particle.position}
            rotation={[0, particle.rotation, 0]}
            scale={particle.scale}
          />
        ))}
      </Instances>
    </group>
  );
};

export default Explosion; 