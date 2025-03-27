import { Enemy, Projectile } from '../models/gameStore';
import useGameStore from '../models/gameStore';

// Define collision box dimensions
const PLAYER_BOX = { width: 1, height: 2, depth: 1 };
const ENEMY_BOX = { width: 1, height: 2, depth: 1 };
const ATTACK_RANGE = 3; // Increased attack range for better usability

interface CollisionBox {
  width: number;
  height: number;
  depth: number;
}

/**
 * Checks if two 3D boxes are colliding
 */
export const checkBoxCollision = (
  posA: [number, number, number],
  boxA: CollisionBox,
  posB: [number, number, number],
  boxB: CollisionBox
): boolean => {
  // Check X axis collision
  const xCollision = 
    Math.abs(posA[0] - posB[0]) <= (boxA.width / 2 + boxB.width / 2);
  
  // Check Y axis collision (slightly more forgiving for height differences)
  const yCollision = 
    Math.abs(posA[1] - posB[1]) <= (boxA.height / 2 + boxB.height / 2) * 1.2;
    
  // Check Z axis collision (more forgiving for depth as this is a side-scroller)
  const zCollision = 
    Math.abs(posA[2] - posB[2]) <= (boxA.depth / 2 + boxB.depth / 2) * 1.5;
    
  // Collision occurs only if all three axes have collision
  return xCollision && yCollision && zCollision;
};

/**
 * Checks if an enemy is within player's attack range
 */
export const isEnemyInAttackRange = (
  playerPosition: [number, number, number],
  playerDirection: 'left' | 'right',
  enemy: Enemy
): boolean => {
  const [playerX, playerY, playerZ] = playerPosition;
  const [enemyX, enemyY, enemyZ] = enemy.position;
  
  // For side-scroller, just check if enemy is in front of player in the correct direction
  // and within a certain distance
  const directionCheck = 
    (playerDirection === 'right' && enemyX > playerX) || 
    (playerDirection === 'left' && enemyX < playerX);
  
  // If enemy is not in the right direction, attack won't hit
  if (!directionCheck) return false;
  
  // Distance check - horizontal distance should be within attack range
  const horizontalDistance = Math.abs(playerX - enemyX);
  
  // Create attack collision box (wider than player but same height)
  const attackBox = {
    width: ATTACK_RANGE,
    height: PLAYER_BOX.height,
    depth: PLAYER_BOX.depth * 1.5 // Wider attack zone in Z axis
  };
  
  // Check if enemy is within attack box using the standard collision function
  const inRange = checkBoxCollision(
    [playerX + (playerDirection === 'right' ? ATTACK_RANGE/2 : -ATTACK_RANGE/2), playerY, playerZ],
    attackBox,
    enemy.position,
    ENEMY_BOX
  );
  
  // Log hits for debugging
  if (inRange) {
    console.log(`Enemy ${enemy.id} is in attack range! Distance: ${horizontalDistance.toFixed(2)}`);
  }
  
  return inRange;
};

/**
 * Find all enemies that are currently in attack range
 */
export const getEnemiesInAttackRange = (
  playerPosition: [number, number, number],
  playerDirection: 'left' | 'right',
  enemies: Enemy[]
): Enemy[] => {
  const hitEnemies = enemies.filter(enemy => !enemy.isDead && isEnemyInAttackRange(
    playerPosition,
    playerDirection,
    enemy
  ));
  
  // Debug info
  if (hitEnemies.length > 0) {
    console.log(`Hit ${hitEnemies.length} enemies with attack!`);
  }
  
  return hitEnemies;
};

/**
 * Check if player is colliding with any enemies
 */
export const isPlayerCollidingWithEnemies = (
  playerPosition: [number, number, number],
  enemies: Enemy[]
): boolean => {
  const collidingEnemies = enemies.filter(enemy => 
    !enemy.isDead && checkBoxCollision(
      playerPosition,
      PLAYER_BOX,
      enemy.position,
      ENEMY_BOX
    )
  );
  
  if (collidingEnemies.length > 0) {
    console.log(`Player is colliding with ${collidingEnemies.length} enemies`);
  }
  
  return collidingEnemies.length > 0;
};

/**
 * Handles collision detection between projectiles and enemies
 * Damages enemies when hit by projectiles and removes the projectile
 */
export const handleProjectileCollisions = () => {
  const state = useGameStore.getState();
  const { projectiles, enemies } = state;
  
  // Default projectile collision box
  const projectileBox = { width: 0.5, height: 0.5, depth: 0.5 };
  
  let hitsDetected = false;
  
  // Check each projectile against each enemy
  projectiles.forEach(projectile => {
    // Skip inactive projectiles
    if (!projectile.isActive) return;
    
    // Check if projectile has expired
    const now = Date.now();
    if (now - projectile.createdAt > projectile.lifespan) {
      // Update projectile as inactive
      const updatedProjectiles = state.projectiles.map(p => 
        p.id === projectile.id ? { ...p, isActive: false } : p
      );
      useGameStore.setState({ projectiles: updatedProjectiles });
      return;
    }
    
    enemies.forEach(enemy => {
      // Skip dead enemies
      if (enemy.isDead) return;
      
      // Check for collision
      const isColliding = checkBoxCollision(
        projectile.position,
        projectileBox,
        enemy.position,
        ENEMY_BOX
      );
      
      if (isColliding) {
        // Apply damage to enemy based on projectile damage
        useGameStore.getState().damageEnemy(enemy.id, projectile.damage);
        
        // Mark projectile as inactive
        const updatedProjectiles = state.projectiles.map(p => 
          p.id === projectile.id ? { ...p, isActive: false } : p
        );
        useGameStore.setState({ projectiles: updatedProjectiles });
        
        hitsDetected = true;
        
        // Create hit effect at the collision point (to be implemented)
        // Create a visual/audio feedback for hit
        console.log(`Projectile ${projectile.id} hit enemy ${enemy.id}`);
      }
    });
  });
  
  // Clean up inactive projectiles periodically
  // This could be done less frequently for performance
  const activeProjectiles = projectiles.filter(p => p.isActive);
  if (activeProjectiles.length < projectiles.length) {
    useGameStore.setState({ projectiles: activeProjectiles });
  }
  
  return hitsDetected;
}; 