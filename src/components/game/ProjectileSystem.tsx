import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail } from '@react-three/drei';
import useGameStore from '../../models/gameStore';

const ProjectileSystem = () => {
  const projectiles = useGameStore((state) => state.projectiles);
  const updateProjectiles = useGameStore((state) => state.updateProjectiles);
  
  useFrame((_, delta) => {
    updateProjectiles(delta * 1000); // Convert to milliseconds
  });
  
  return (
    <>
      {projectiles.map((projectile) => (
        <group key={projectile.id} position={projectile.position}>
          <Trail
            width={projectile.size * 2}
            length={8}
            color={projectile.color}
            attenuation={(t) => t * t}
            decay={1}
          >
            <Sphere args={[projectile.size, 8, 8]}>
              <meshStandardMaterial
                color={projectile.color}
                emissive={projectile.color}
                emissiveIntensity={2}
                toneMapped={false}
              />
            </Sphere>
          </Trail>
        </group>
      ))}
    </>
  );
};

export default ProjectileSystem; 