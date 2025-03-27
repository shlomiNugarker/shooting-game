import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, useTexture } from '@react-three/drei';
import useGameStore from '../../models/gameStore';

const LevelEnvironment = () => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const level = useGameStore((state) => state.levels.find(l => l.id === currentLevel));
  
  // Environment elements specific to level types
  const renderEnvironment = () => {
    switch (level?.name) {
      case 'Training Grounds':
        return <TrainingGroundsEnvironment />;
      case 'Urban Assault':
        return <UrbanEnvironment />;
      case 'Research Facility':
        return <ResearchFacilityEnvironment />;
      case 'Defense Complex':
        return <DefenseComplexEnvironment />;
      case 'Commander\'s Stronghold':
        return <StrongholdEnvironment />;
      default:
        return <DefaultEnvironment />;
    }
  };
  
  return (
    <group>
      {renderEnvironment()}
    </group>
  );
};

// Default environment with some basic structures
const DefaultEnvironment = () => {
  return (
    <group>
      {/* Background structures */}
      <Box position={[20, 5, -10]} args={[10, 10, 2]}>
        <meshStandardMaterial color="#444444" />
      </Box>
      <Box position={[30, 7, -15]} args={[8, 14, 2]}>
        <meshStandardMaterial color="#555555" />
      </Box>
      <Box position={[15, 3, -12]} args={[6, 6, 2]}>
        <meshStandardMaterial color="#333333" />
      </Box>
    </group>
  );
};

// Training grounds - simple environment
const TrainingGroundsEnvironment = () => {
  return (
    <group>
      <Box position={[15, 3, -10]} args={[5, 6, 1]}>
        <meshStandardMaterial color="#666666" />
      </Box>
      <Box position={[25, 4, -12]} args={[7, 8, 1]}>
        <meshStandardMaterial color="#777777" />
      </Box>
    </group>
  );
};

// Urban environment
const UrbanEnvironment = () => {
  return (
    <group>
      <Box position={[20, 7, -12]} args={[10, 14, 3]}>
        <meshStandardMaterial color="#444444" />
      </Box>
      <Box position={[35, 5, -14]} args={[6, 10, 2]}>
        <meshStandardMaterial color="#555555" />
      </Box>
      <Box position={[28, 3, -10]} args={[4, 6, 1]}>
        <meshStandardMaterial color="#666666" />
      </Box>
    </group>
  );
};

// Research facility
const ResearchFacilityEnvironment = () => {
  return (
    <group>
      <Box position={[20, 6, -12]} args={[12, 12, 4]}>
        <meshStandardMaterial color="#445566" />
      </Box>
      <Box position={[35, 3, -10]} args={[6, 6, 2]}>
        <meshStandardMaterial color="#334455" />
      </Box>
    </group>
  );
};

// Defense complex
const DefenseComplexEnvironment = () => {
  return (
    <group>
      <Box position={[25, 8, -15]} args={[15, 16, 5]}>
        <meshStandardMaterial color="#555566" />
      </Box>
      <Box position={[40, 4, -12]} args={[8, 8, 3]}>
        <meshStandardMaterial color="#444455" />
      </Box>
    </group>
  );
};

// Stronghold
const StrongholdEnvironment = () => {
  return (
    <group>
      <Box position={[30, 10, -18]} args={[20, 20, 6]}>
        <meshStandardMaterial color="#664444" />
      </Box>
      <Box position={[50, 5, -15]} args={[10, 10, 4]}>
        <meshStandardMaterial color="#553333" />
      </Box>
    </group>
  );
};

export default LevelEnvironment; 