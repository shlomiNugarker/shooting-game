import { RigidBody } from '@react-three/rapier';

const Floor = () => {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      {/* Main floor - wider and with a better color */}
      <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 30]} />
        <meshStandardMaterial 
          color="#4a7361"
          roughness={0.5}
          metalness={0.2}
          emissive="#2a4331"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Floor edge markers - small ridges to show the playable area */}
      <mesh receiveShadow position={[0, -0.4, 8]}>
        <boxGeometry args={[200, 0.1, 0.5]} />
        <meshStandardMaterial 
          color="#5a8b71" 
          emissive="#2a5b41"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <mesh receiveShadow position={[0, -0.4, -8]}>
        <boxGeometry args={[200, 0.1, 0.5]} />
        <meshStandardMaterial 
          color="#5a8b71" 
          emissive="#2a5b41"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Visible side walls with transparency */}
      <mesh position={[50, 2, 0]}>
        <boxGeometry args={[3, 10, 30]} />
        <meshStandardMaterial 
          color="#3d5b4e" 
          transparent={true} 
          opacity={0.6} 
          emissive="#1d3b2e"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh position={[-50, 2, 0]}>
        <boxGeometry args={[3, 10, 30]} />
        <meshStandardMaterial 
          color="#3d5b4e" 
          transparent={true} 
          opacity={0.6} 
          emissive="#1d3b2e"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Visual elements - rocks and decorations */}
      <mesh receiveShadow position={[20, 0.5, 5]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
          color="#6b8b7c" 
          emissive="#4b6b5c"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh receiveShadow position={[-15, 0.5, -3]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial 
          color="#6b8b7c" 
          emissive="#4b6b5c"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh receiveShadow position={[35, 0.3, -4]}>
        <boxGeometry args={[2, 0.6, 0.8]} />
        <meshStandardMaterial 
          color="#6b8b7c" 
          emissive="#4b6b5c"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Added more visual elements to make the floor more interesting */}
      <mesh receiveShadow position={[-30, 0.2, 2]}>
        <boxGeometry args={[3, 0.4, 0.4]} />
        <meshStandardMaterial 
          color="#5a7b6c" 
          emissive="#3a5b4c"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh receiveShadow position={[10, 0.3, -6]}>
        <cylinderGeometry args={[0.5, 0.5, 0.6, 16]} />
        <meshStandardMaterial 
          color="#7b9b8c" 
          emissive="#5b7b6c"
          emissiveIntensity={0.2}
        />
      </mesh>
    </RigidBody>
  );
};

export default Floor; 