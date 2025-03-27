import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Trail, 
  useAnimations, 
  useGLTF, 
  Text,
  MeshDistortMaterial, 
  RoundedBox, 
  Sparkles 
} from '@react-three/drei';
import { Group, Vector3, MeshStandardMaterial, Color, MathUtils } from 'three';
import useGameStore from '../../models/gameStore';
import useKeyboardControls from '../../hooks/useKeyboardControls';
import useGameSounds from '../../hooks/useGameSounds';
import { getEnemiesInAttackRange } from '../../systems/collisionSystem';

// Create glowing material for weapon effects
const createGlowMaterial = (color: string, intensity: number = 1.5) => {
  const material = new MeshStandardMaterial({
    color: new Color(color),
    emissive: new Color(color),
    emissiveIntensity: intensity,
    roughness: 0.2,
    metalness: 0.8
  });
  return material;
};

const Player = () => {
  const modelRef = useRef<Group>(null);
  const trailRef = useRef(null);
  const weaponRef = useRef(null);
  const [glowIntensity, setGlowIntensity] = useState(1);
  const [weaponColor, setWeaponColor] = useState('#00aaff');
  const [projectileCharge, setProjectileCharge] = useState(0);
  const { camera } = useThree();
  const { playSound } = useGameSounds();
  
  // Get game state
  const playerPosition = useGameStore(state => state.playerPosition);
  const playerDirection = useGameStore(state => state.playerDirection);
  const playerAnimationState = useGameStore(state => state.playerAnimationState);
  const playerHealth = useGameStore(state => state.playerHealth);
  const playerMaxHealth = useGameStore(state => state.playerMaxHealth);
  const playerEnergy = useGameStore(state => state.playerEnergy);
  const playerMaxEnergy = useGameStore(state => state.playerMaxEnergy);
  const playerShield = useGameStore(state => state.playerShield);
  const playerMaxShield = useGameStore(state => state.playerMaxShield);
  const playerInvulnerable = useGameStore(state => state.playerInvulnerable);
  const weapons = useGameStore(state => state.weapons);
  const currentWeaponIndex = useGameStore(state => state.currentWeaponIndex);
  const enemies = useGameStore(state => state.enemies);
  const damageEnemy = useGameStore(state => state.damageEnemy);
  const addProjectile = useGameStore(state => state.addProjectile);
  
  // Get current weapon
  const currentWeapon = weapons[currentWeaponIndex];
  
  // Initialize weapon properties
  useEffect(() => {
    if (currentWeapon) {
      setWeaponColor(currentWeapon.projectileColor);
    }
  }, [currentWeapon]);
  
  // Load keyboard controls
  useKeyboardControls();

  // Handle melee attack collisions
  useEffect(() => {
    if (playerAnimationState === 'attack' && !currentWeapon.isSpecial) {
      // Play attack sound
      playSound('playerAttack');
      
      // Get enemies in attack range
      const hitEnemies = getEnemiesInAttackRange(
        playerPosition,
        playerDirection,
        enemies
      );
      
      // Calculate damage with weapon and skill bonuses
      const attackDamage = currentWeapon ? currentWeapon.damage : 10;
      
      // Apply damage to all enemies in range
      hitEnemies.forEach(enemy => {
        damageEnemy(enemy.id, attackDamage);
        
        // Play hit sound
        playSound('enemyHit');
      });
      
      // Reset animation state after attack (simulating animation completion)
      setTimeout(() => {
        useGameStore.setState({ playerAnimationState: 'idle' });
      }, 300);
    }
  }, [
    playerAnimationState, 
    playerPosition, 
    playerDirection, 
    enemies, 
    damageEnemy,
    currentWeapon,
    playSound
  ]);
  
  // Handle projectile firing
  useEffect(() => {
    if (playerAnimationState === 'attack' && currentWeapon && currentWeapon.isSpecial) {
      // Fire projectile
      const now = Date.now();
      
      // Check weapon cooldown
      if (now - currentWeapon.lastFired < currentWeapon.cooldown) {
        // Weapon on cooldown, show visual feedback
        setGlowIntensity(0.5);
        
        // Play cooldown sound
        playSound('weaponCooldown');
        
        // Reset animation state
        setTimeout(() => {
          useGameStore.setState({ playerAnimationState: 'idle' });
        }, 100);
        
        return;
      }
      
      // Update weapon last fired time
      const updatedWeapons = weapons.map((weapon, index) => 
        index === currentWeaponIndex 
          ? { ...weapon, lastFired: now } 
          : weapon
      );
      useGameStore.setState({ weapons: updatedWeapons });
      
      // Set firing animation
      setGlowIntensity(3);
      setProjectileCharge(1);
      
      // Play weapon fire sound based on type
      if (currentWeapon.type === 'laser') {
        playSound('laserShot');
      } else if (currentWeapon.type === 'plasma') {
        playSound('plasmaShot');
      } else {
        playSound('playerShoot');
      }
      
      // Create projectile direction based on player direction
      const directionMultiplier = playerDirection === 'right' ? 1 : -1;
      
      // Create projectile
      setTimeout(() => {
        if (currentWeapon.type === 'shotgun') {
          // Shotgun creates multiple projectiles in a spread
          const spreadCount = 5;
          const spreadAngle = 0.3; // in radians
          
          for (let i = 0; i < spreadCount; i++) {
            const angle = (i - (spreadCount - 1) / 2) * spreadAngle;
            const vx = Math.cos(angle) * currentWeapon.projectileSpeed * directionMultiplier;
            const vy = Math.sin(angle) * currentWeapon.projectileSpeed * 0.5;
            
            addProjectile(
              'player',
              [playerPosition[0] + directionMultiplier * 0.8, playerPosition[1] + 1, playerPosition[2]],
              [vx, vy, 0],
              currentWeapon.damage / spreadCount, // Divide damage among pellets
              true
            );
          }
        } else {
          // Standard projectile
          addProjectile(
            'player',
            [playerPosition[0] + directionMultiplier * 0.8, playerPosition[1] + 1, playerPosition[2]],
            [currentWeapon.projectileSpeed * directionMultiplier, 0, 0],
            currentWeapon.damage,
            true
          );
        }
        
        // Reset charge and glow after firing
        setTimeout(() => {
          setProjectileCharge(0);
          setGlowIntensity(1);
          useGameStore.setState({ playerAnimationState: 'idle' });
        }, 200);
      }, 100);
    }
  }, [
    playerAnimationState, 
    currentWeapon, 
    weapons, 
    currentWeaponIndex, 
    playerDirection, 
    playerPosition, 
    addProjectile,
    playSound
  ]);
  
  // Handle special attacks
  useEffect(() => {
    if (playerAnimationState === 'special') {
      // Play special attack sound
      playSound('playerSpecial');
      
      // Simulate special attack effect
      setGlowIntensity(5);
      
      // Reset after effect completes
      setTimeout(() => {
        setGlowIntensity(1);
        useGameStore.setState({ playerAnimationState: 'idle' });
      }, 800);
    }
  }, [playerAnimationState, playSound]);
  
  // Update player model position, scale, and effects
  useFrame((_, delta) => {
    if (!modelRef.current) return;
    
    // Update position
    modelRef.current.position.set(
      playerPosition[0],
      playerPosition[1],
      playerPosition[2]
    );
    
    // Flip model based on direction
    const targetScale = new Vector3(
      playerDirection === 'left' ? -1 : 1, 
      1, 
      1
    );
    
    // Smooth scale transition
    modelRef.current.scale.lerp(targetScale, 0.3);
    
    // Update dash trail visibility
    if (trailRef.current) {
      trailRef.current.visible = playerAnimationState === 'dash';
    }
    
    // Make the weapon pulse based on charge level
    if (weaponRef.current && projectileCharge > 0) {
      const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.2 * projectileCharge;
      weaponRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }
    
    // Make camera shake when player is damaged
    if (playerAnimationState === 'damaged') {
      const intensity = 0.05;
      camera.position.x += (Math.random() - 0.5) * intensity;
      camera.position.y += (Math.random() - 0.5) * intensity;
    }
    
    // Pulse glow effect
    const targetGlow = playerAnimationState === 'damaged' ? 3 : 
                      playerAnimationState === 'attack' ? 2 : 1;
    setGlowIntensity(MathUtils.lerp(glowIntensity, targetGlow, delta * 5));
  });
  
  // Get color based on animation state and health
  const getPlayerColor = () => {
    if (playerInvulnerable) return '#ffffff';
    
    switch (playerAnimationState) {
      case 'attack': return '#4499ff';
      case 'damaged': return '#ff0000';
      case 'death': return '#550000';
      case 'dash': return '#00ffff';
      case 'special': return '#ff00ff';
      case 'run': return '#55aaff';
      default: return '#55aaff';
    }
  };
  
  // Get emissive color based on animation state
  const getEmissiveColor = () => {
    if (playerInvulnerable) return '#ffffff';
    
    switch (playerAnimationState) {
      case 'attack': return '#0066ff';
      case 'damaged': return '#ff0000';
      case 'death': return '#550000';
      case 'dash': return '#00ffff';
      case 'special': return '#ff00ff';
      case 'run': return '#0066ff';
      default: return '#0066ff';
    }
  };
  
  // Calculate health percentage for UI
  const healthPercentage = playerHealth / playerMaxHealth;
  const energyPercentage = playerEnergy / playerMaxEnergy;
  const shieldPercentage = playerMaxShield > 0 ? playerShield / playerMaxShield : 0;
  
  return (
    <group ref={modelRef}>
      {/* Dash trail effect */}
      <Trail
        ref={trailRef}
        width={1}
        length={5}
        color={'#00ffff'}
        attenuation={(t) => t * t}
        visible={playerAnimationState === 'dash'}
      >
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      </Trail>
      
      {/* Shield effect when active */}
      {playerShield > 0 && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <MeshDistortMaterial
            color="#00aaff"
            transparent
            opacity={0.3 + (shieldPercentage * 0.3)}
            distort={0.3}
            speed={2}
          />
        </mesh>
      )}
      
      {/* Player body */}
      <RoundedBox
        args={[1, 2, 0.5]}
        radius={0.2}
        smoothness={4}
        castShadow
        position={[0, 1, 0]}
      >
        <meshStandardMaterial 
          color={getPlayerColor()} 
          emissive={getEmissiveColor()}
          emissiveIntensity={glowIntensity}
          roughness={0.3}
          metalness={0.7}
        />
      </RoundedBox>
      
      {/* Player head */}
      <mesh castShadow position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={getPlayerColor()} 
          emissive={getEmissiveColor()}
          emissiveIntensity={glowIntensity}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Energy visor */}
      <mesh position={[0, 2.2, 0.25]}>
        <boxGeometry args={[0.6, 0.1, 0.1]} />
        <meshStandardMaterial 
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={glowIntensity * 1.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Player weapon (changes based on selected weapon) */}
      <group
        position={[playerDirection === 'right' ? 0.7 : -0.7, 1.2, 0]}
        ref={weaponRef}
      >
        {currentWeapon && (
          <>
            {/* Weapon base */}
            <mesh rotation={[0, 0, playerDirection === 'right' ? 0 : Math.PI]}>
              {currentWeapon.type === 'pistol' && (
                <boxGeometry args={[0.8, 0.3, 0.2]} />
              )}
              {currentWeapon.type === 'shotgun' && (
                <cylinderGeometry args={[0.15, 0.15, 1.2, 8]} />
              )}
              {currentWeapon.type === 'rifle' && (
                <boxGeometry args={[1.5, 0.2, 0.2]} />
              )}
              {currentWeapon.type === 'laser' && (
                <cylinderGeometry args={[0.1, 0.2, 1.2, 8]} />
              )}
              {currentWeapon.type === 'plasma' && (
                <boxGeometry args={[0.7, 0.5, 0.4]} />
              )}
              <meshStandardMaterial 
                color={'#333333'}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            
            {/* Weapon energy elements */}
            <mesh 
              position={[playerDirection === 'right' ? 0.5 : -0.5, 0, 0]}
              rotation={[0, 0, playerDirection === 'right' ? 0 : Math.PI]}
            >
              {currentWeapon.type === 'pistol' && (
                <boxGeometry args={[0.3, 0.2, 0.15]} />
              )}
              {currentWeapon.type === 'shotgun' && (
                <boxGeometry args={[0.2, 0.2, 0.3]} />
              )}
              {currentWeapon.type === 'rifle' && (
                <boxGeometry args={[0.3, 0.3, 0.3]} />
              )}
              {currentWeapon.type === 'laser' && (
                <sphereGeometry args={[0.2, 8, 8]} />
              )}
              {currentWeapon.type === 'plasma' && (
                <sphereGeometry args={[0.3, 8, 8]} />
              )}
              <primitive object={createGlowMaterial(currentWeapon.projectileColor, glowIntensity * 1.5)} />
            </mesh>
            
            {/* Weapon charging effect */}
            {projectileCharge > 0 && (
              <Sparkles
                count={20}
                scale={[2, 1, 1]}
                size={0.2 + projectileCharge * 0.4}
                speed={0.3 + projectileCharge * 1}
                color={currentWeapon.projectileColor}
              />
            )}
          </>
        )}
      </group>
      
      {/* Player light source */}
      <pointLight
        position={[0, 1.5, 0.5]}
        color={getEmissiveColor()}
        intensity={glowIntensity}
        distance={5}
      />
      
      {/* Status indicators */}
      <group position={[0, 3, 0]}>
        {/* Health bar */}
        <mesh position={[0, 0.3, 0]} scale={[healthPercentage, 0.1, 0.1]}>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshBasicMaterial 
            color={healthPercentage > 0.6 ? '#00ff00' : healthPercentage > 0.3 ? '#ffff00' : '#ff0000'} 
          />
        </mesh>
        
        {/* Energy bar */}
        <mesh position={[0, 0.15, 0]} scale={[energyPercentage, 0.1, 0.1]}>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        
        {/* Shield bar (only visible if player has shield) */}
        {playerShield > 0 && (
          <mesh position={[0, 0, 0]} scale={[shieldPercentage, 0.1, 0.1]}>
            <boxGeometry args={[1, 1, 0.1]} />
            <meshBasicMaterial color="#0088ff" />
          </mesh>
        )}
      </group>
      
      {/* Display weapon cooldown */}
      {currentWeapon && currentWeapon.isSpecial && 
       Date.now() - currentWeapon.lastFired < currentWeapon.cooldown && (
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {`Reloading... ${Math.ceil((currentWeapon.cooldown - (Date.now() - currentWeapon.lastFired)) / 1000)}s`}
        </Text>
      )}
      
      {/* Invulnerability indicator */}
      {playerInvulnerable && (
        <Sparkles
          count={20}
          scale={[2, 3, 1]}
          size={0.5}
          speed={0.5}
          color="#ffffff"
        />
      )}
      
      {/* Speech bubble for special events */}
      {playerAnimationState === 'special' && (
        <group position={[playerDirection === 'right' ? 1 : -1, 2.8, 0]}>
          <Text
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            Special Attack!
          </Text>
        </group>
      )}
    </group>
  );
};

export default Player; 