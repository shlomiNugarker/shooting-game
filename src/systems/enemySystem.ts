import useGameStore from '../models/gameStore';

// Enemy type definition
type EnemyType = 'normal' | 'fast' | 'heavy';

// Enemy interface definition
interface Enemy {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  isDead: boolean;
  type: EnemyType;
  level: number;
  state: 'idle' | 'run' | 'attack' | 'damaged' | 'death';
  lastAttackTime: number;
  projectiles: any[];
  scoreValue: number;
  dropChance: number;
}

// Configuration for enemy spawning
const SPAWN_DISTANCE = 20; // Increased distance from player to spawn enemies
const MIN_ENEMY_SPACING = 3; // Minimum distance between enemies
const MAX_ENEMIES_PER_WAVE = 3; // Reduced max enemies per wave
const WAVE_DIFFICULTY_MULTIPLIER = 0.3; // Reduced difficulty scaling

/**
 * Generate a unique ID for an enemy
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Get a random enemy type
 */
const getRandomEnemyType = (): EnemyType => {
  const types: EnemyType[] = ['normal', 'fast', 'heavy'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
};

/**
 * Generates a random spawn position for an enemy
 */
export const generateEnemySpawnPosition = (
  playerPosition: [number, number, number],
  playerDirection: 'left' | 'right'
): [number, number, number] => {
  const [playerX, playerY, playerZ] = playerPosition;
  
  // Determine which side to spawn on (opposite to player direction + random factor)
  const spawnOnRight = playerDirection === 'left' || Math.random() > 0.3;
  
  // Calculate spawn X position (with some randomness)
  const spawnX = playerX + (spawnOnRight ? 1 : -1) * (SPAWN_DISTANCE + Math.random() * 5);
  
  // Keep Y and Z the same as player for now (2D gameplay on a plane)
  return [spawnX, playerY, playerZ];
};

/**
 * Determines how many enemies should spawn in the current wave
 */
export const getEnemyCountForWave = (wave: number): number => {
  // For wave 1, always spawn just 1 enemy
  if (wave === 1) return 1;
  
  const baseCount = Math.min(MAX_ENEMIES_PER_WAVE, Math.floor(1 + wave * WAVE_DIFFICULTY_MULTIPLIER));
  // Add some randomness to enemy count
  return baseCount + Math.floor(Math.random() * 2);
};

/**
 * Manages enemy spawning for a wave
 */
export const spawnEnemyWave = (waveNumber: number, playerPosition: [number, number, number], playerDirection: string) => {
  const enemyCount = Math.min(waveNumber + 1, 10); // Cap max enemies at 10
  const enemies: Enemy[] = [];

  console.log(`Spawning wave ${waveNumber} with ${enemyCount} enemies`);

  for (let i = 0; i < enemyCount; i++) {
    // Spawn enemies on the right side of the player at varying distances
    const spawnDistance = 15 + Math.random() * 5; // 15-20 units away
    
    // Calculate spawn position - always to the right
    const spawnX = playerPosition[0] + spawnDistance + (i * 2); // Spread out enemies
    
    enemies.push({
      id: generateId(),
      position: [spawnX, 0.5, 0] as [number, number, number], // Same height as player
      health: 100,
      maxHealth: 100,
      isDead: false,
      type: getRandomEnemyType(),
      level: waveNumber,
      state: 'idle',
      lastAttackTime: 0,
      projectiles: [],
      scoreValue: 100,
      dropChance: 0.2
    });
  }

  // Add new enemies to the game state
  const existingEnemies = useGameStore.getState().enemies;
  useGameStore.setState({ enemies: [...existingEnemies, ...enemies] });
};

/**
 * Updates enemy positions to move toward the player
 */
export const updateEnemies = (playerPosition: [number, number, number], enemies: Enemy[], deltaTime: number): Enemy[] => {
  return enemies.map(enemy => {
    // Skip dead enemies
    if (enemy.isDead) return enemy;

    // Current enemy position
    const [enemyX, enemyY, enemyZ] = enemy.position;
    
    // Calculate direction to player
    const directionX = playerPosition[0] - enemyX;
    const distance = Math.abs(directionX);
    
    // Update enemy state based on distance
    let state = enemy.state;
    
    // Different behavior patterns based on enemy type
    const speed = enemy.type === 'fast' ? 1.8 : enemy.type === 'heavy' ? 0.6 : 1.0;
    
    // Attack range varies by enemy type
    const attackRange = enemy.type === 'heavy' ? 1.5 : 1.0;
    
    // Enemy is close enough to attack
    if (distance <= attackRange) {
      // Attack with cooldown
      const now = Date.now();
      if (now - enemy.lastAttackTime > 1000) { // 1 second cooldown
        state = 'attack';
        
        // Apply damage to player
        const currentHealth = useGameStore.getState().playerHealth;
        const damage = enemy.type === 'heavy' ? 20 : 10;
        
        useGameStore.setState({ 
          playerHealth: Math.max(0, currentHealth - damage),
          playerAnimationState: 'damaged'
        });
        
        // Reset player animation after a short delay
        setTimeout(() => {
          if (useGameStore.getState().playerAnimationState === 'damaged') {
            useGameStore.setState({ playerAnimationState: 'idle' });
          }
        }, 200);
        
        // Update attack cooldown
        enemy.lastAttackTime = now;
      }
      else if (state === 'attack') {
        // Reset attack state after animation time
        state = 'idle';
      }
    }
    // Enemy is pursuing player
    else {
      state = 'run';
      
      // Move enemy towards player (always from right to left)
      const moveX = Math.sign(directionX) * speed * deltaTime;
      enemy.position = [enemyX + moveX, enemyY, enemyZ];
    }
    
    return { ...enemy, state };
  });
}; 