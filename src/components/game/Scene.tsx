import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  Sky, 
  Environment, 
  PerspectiveCamera,
  Stars,
  Stats,
  Text,
  Sparkles,
  Trail,
  useTexture,
  useGLTF
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  DepthOfField
} from '@react-three/postprocessing';
import { Physics } from '@react-three/rapier';
import { Vector3, MathUtils } from 'three';
import Player from './Player';
import Enemy from './Enemy';
import Floor from './Floor';
import ProjectileSystem from './ProjectileSystem';
import PowerUp from './PowerUp';
import BackgroundParticles from './BackgroundParticles';
import Explosion from './Explosion';
import LevelEnvironment from './LevelEnvironment';
import WeaponFX from './WeaponFX';
import HUD from '../ui/HUD';
import useGameStore from '../../models/gameStore';
import useGameLoop from '../../hooks/useGameLoop';
import useKeyboardControls from '../../hooks/useKeyboardControls';
import useGameSounds from '../../hooks/useGameSounds';
import { updateEnemies, spawnEnemyWave } from '../../systems/enemySystem';
import { handleProjectileCollisions } from '../../systems/collisionSystem';

// Camera follow component
const CameraFollow = () => {
  const { camera } = useThree();
  const playerPosition = useGameStore(state => state.playerPosition);
  const gameStatus = useGameStore(state => state.gameStatus);
  const smoothedCameraRef = useRef(new Vector3(-2, 4, 8));
  
  useEffect(() => {
    // Setting camera for side-scrolling perspective
    // Position camera slightly to the right and above the player's starting position
    camera.position.set(-2, 4, 8);
    camera.lookAt(0, 1, 0);
    
    console.log('Camera initialized for side-scrolling view at:', camera.position);
  }, [camera]);
  
  useFrame((_, delta) => {
    if (gameStatus !== 'playing') return;
    
    // Keep player slightly to the left of center for side-scrolling
    // This gives more view of what's coming from the right
    const offsetX = 3; // Left-side offset
    const targetX = playerPosition[0] + offsetX;
    
    // Create smoother camera follow with spring-like dynamics
    smoothedCameraRef.current.x = MathUtils.lerp(
      smoothedCameraRef.current.x,
      targetX,
      delta * 2.5
    );
    
    // Add some dynamic height adjustment based on player position
    const targetY = playerPosition[1] + 4 + Math.sin(Date.now() * 0.001) * 0.2;
    smoothedCameraRef.current.y = MathUtils.lerp(
      smoothedCameraRef.current.y,
      targetY,
      delta * 1.5
    );
    
    // Apply the smoothed camera position
    camera.position.x = smoothedCameraRef.current.x;
    camera.position.y = smoothedCameraRef.current.y;
    
    // Keep camera looking slightly ahead of player with dynamic adjustment
    const lookAheadDistance = 5 + Math.sin(Date.now() * 0.002) * 1;
    camera.lookAt(playerPosition[0] + lookAheadDistance, playerPosition[1] + 1, 0);
    
    // Add subtle camera shake during intense moments
    // This would ideally be linked to game events like nearby explosions
    const enemyCount = useGameStore.getState().enemies.length;
    if (enemyCount > 5) {
      const intensity = Math.min(0.03, enemyCount * 0.005);
      camera.position.x += (Math.random() - 0.5) * intensity;
      camera.position.y += (Math.random() - 0.5) * intensity;
    }
  });
  
  return null;
};

// Time controller for slow-motion effects
const TimeController = () => {
  const gameStatus = useGameStore(state => state.gameStatus);
  const timeSpeed = useRef(1);
  
  useFrame((state) => {
    if (gameStatus !== 'playing') return;
    
    // Adjust the global timeScale for slow-motion effects
    state.clock.elapsedTime *= timeSpeed.current;
  });
  
  // This could be called from ability system for time-slowdown ability
  const setTimeSpeed = (speed: number) => {
    timeSpeed.current = speed;
  };
  
  return null;
};

// Particle systems manager
const ParticleSystemsManager = () => {
  const enemies = useGameStore(state => state.enemies);
  const explosions = useRef([]);
  
  // Track enemies that were alive but are now dead to create explosions
  useEffect(() => {
    const deadEnemies = enemies.filter(enemy => enemy.isDead && enemy.health <= 0);
    
    deadEnemies.forEach(enemy => {
      if (!explosions.current.includes(enemy.id)) {
        explosions.current.push(enemy.id);
        // Trigger explosion effect at enemy position
        // This is a placeholder - actual implementation would happen in the Explosion component
      }
    });
    
    // Cleanup old explosions
    if (explosions.current.length > 20) {
      explosions.current = explosions.current.slice(-20);
    }
  }, [enemies]);
  
  return (
    <>
      {/* Background particle effects */}
      <BackgroundParticles count={1000} />
      
      {/* Explosions at dead enemy positions */}
      {enemies
        .filter(enemy => enemy.isDead && explosions.current.includes(enemy.id))
        .map(enemy => (
          <Explosion 
            key={`explosion_${enemy.id}`} 
            position={enemy.position} 
            size={enemy.type === 'boss' ? 3 : enemy.type === 'heavy' ? 2 : 1} 
          />
        ))
      }
    </>
  );
};

// Enemy manager component with improved wave system
const EnemyManager = () => {
  const enemies = useGameStore(state => state.enemies);
  const playerPosition = useGameStore(state => state.playerPosition);
  const playerDirection = useGameStore(state => state.playerDirection);
  const gameStatus = useGameStore(state => state.gameStatus);
  const currentWave = useGameStore(state => state.currentWave);
  const maxWave = useGameStore(state => state.maxWave);
  const currentLevel = useGameStore(state => state.currentLevel);
  const setWaveProgress = useGameStore(state => state.waveProgress);
  const { playSound } = useGameSounds();
  
  const waveTimerRef = useRef(null);
  const lastWaveSpawnTime = useRef(0);
  const waveCountdownRef = useRef(0);
  
  // Wave management
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    // Clear any existing timer on status change or component unmount
    return () => {
      if (waveTimerRef.current) {
        clearTimeout(waveTimerRef.current);
      }
    };
  }, [gameStatus]);
  
  // Spawn next wave when all enemies are defeated
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    const aliveEnemies = enemies.filter(enemy => !enemy.isDead);
    const now = Date.now();
    
    // Calculate wave progress for UI
    if (aliveEnemies.length === 0) {
      // No enemies left, next wave is coming
      useGameStore.setState({ waveProgress: 100 });
    } else {
      // Some percentage complete based on enemies defeated
      const totalEnemiesInWave = currentWave + 2; // Estimate
      const enemiesDefeated = totalEnemiesInWave - aliveEnemies.length;
      const progress = Math.floor((enemiesDefeated / totalEnemiesInWave) * 100);
      useGameStore.setState({ waveProgress: progress });
    }
    
    // If no enemies left and enough time has passed since last spawn
    if (aliveEnemies.length === 0 && now - lastWaveSpawnTime.current > 3000) {
      // Start countdown for next wave
      if (waveCountdownRef.current === 0) {
        waveCountdownRef.current = 3; // 3 second countdown
        
        // Play wave incoming sound
        playSound('waveIncoming');
        
        const countdownInterval = setInterval(() => {
          waveCountdownRef.current -= 1;
          
          if (waveCountdownRef.current <= 0) {
            clearInterval(countdownInterval);
            
            // Check if we've reached the max waves for this level
            if (currentWave > maxWave) {
              // Level complete!
              useGameStore.setState({ 
                gameStatus: 'levelComplete',
                levels: useGameStore.getState().levels.map(level => 
                  level.id === currentLevel ? { ...level, completed: true } : level
                )
              });
              
              // Unlock next level if available
              const nextLevelId = currentLevel + 1;
              if (nextLevelId <= useGameStore.getState().levels.length) {
                useGameStore.setState({
                  levels: useGameStore.getState().levels.map(level => 
                    level.id === nextLevelId ? { ...level, unlocked: true } : level
                  )
                });
              }
              
              // Play level complete sound
              playSound('levelComplete');
              
              return;
            }
            
            // Spawn the wave
            spawnEnemyWave(currentWave, playerPosition, playerDirection);
            useGameStore.setState({ currentWave: currentWave + 1 });
            lastWaveSpawnTime.current = Date.now();
            
            // Play wave start sound
            playSound('waveStart');
          }
        }, 1000);
      }
    }
  }, [enemies, gameStatus, currentWave, maxWave, currentLevel, playerPosition, playerDirection, playSound]);
  
  // Update enemy positions and behaviors
  useGameLoop((deltaTime) => {
    if (gameStatus !== 'playing') return;
    
    const updatedEnemies = updateEnemies(playerPosition, enemies, deltaTime);
    useGameStore.setState({ enemies: updatedEnemies });
    
    // Handle projectile collisions with enemies
    handleProjectileCollisions();
  });
  
  return (
    <>
      {/* Wave announcement text */}
      {waveCountdownRef.current > 0 && (
        <Text
          position={[playerPosition[0], playerPosition[1] + 3, 0]}
          fontSize={1.5}
          color="#ff0000"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#220000"
        >
          {`Wave ${currentWave} in ${waveCountdownRef.current}...`}
        </Text>
      )}
      
      {/* Render all enemies */}
      {enemies.map((enemy) => (
        <Enemy 
          key={enemy.id}
          enemy={enemy}
          playerPosition={playerPosition}
        />
      ))}
    </>
  );
};

// Post-processing effects controller
const PostProcessingEffects = () => {
  const playerHealth = useGameStore(state => state.playerHealth);
  const playerMaxHealth = useGameStore(state => state.playerMaxHealth);
  const playerAnimationState = useGameStore(state => state.playerAnimationState);
  const gameStatus = useGameStore(state => state.gameStatus);
  
  // Calculate intensity based on player health and game state
  const healthRatio = playerHealth / playerMaxHealth;
  const isDamaged = playerAnimationState === 'damaged';
  const isGameOver = gameStatus === 'gameOver';
  
  // Bloom intensity increases as health decreases
  const bloomIntensity = MathUtils.lerp(0.7, 1.5, 1 - healthRatio);
  
  // Chromatic aberration increases when damaged or near death
  const chromaticAberrationOffset = isDamaged || healthRatio < 0.3 
    ? MathUtils.lerp(0.003, 0.01, 1 - healthRatio) 
    : 0.0015;
  
  // Depth of field when game over or in menu
  const dofEnabled = isGameOver || gameStatus === 'menu' || gameStatus === 'pause';
  
  return (
    <EffectComposer>
      <Bloom 
        intensity={bloomIntensity} 
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
      />
      <ChromaticAberration offset={new Vector3(chromaticAberrationOffset, 0, 0)} />
      {dofEnabled && (
        <DepthOfField
          focusDistance={5}
          focalLength={0.02}
          bokehScale={2}
        />
      )}
    </EffectComposer>
  );
};

// Error boundary component to catch WebGL errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error("WebGL Error:", error);
    console.log("Error Info:", errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ 
          color: 'white', 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h2>משהו השתבש עם תהליך הרינדור</h2>
          <p>ניסיון איתחול מחדש...</p>
          <button 
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              background: '#4466ff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            טען מחדש
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Scene component
const Scene = () => {
  const gameStatus = useGameStore(state => state.gameStatus);
  const currentLevel = useGameStore(state => state.currentLevel);
  const playerPosition = useGameStore(state => state.playerPosition);
  const { initSounds, playSound, stopSound } = useGameSounds();
  const [useBasicRenderer, setUseBasicRenderer] = useState(false);
  
  // Initialize keyboard controls
  useKeyboardControls();
  
  // Initialize sound system
  useEffect(() => {
    initSounds();
  }, [initSounds]);
  
  // Check for too many reloads to prevent infinite reload loops
  useEffect(() => {
    // Get reload counter from localStorage
    const reloadCount = parseInt(localStorage.getItem('webglReloadCount') || '0');
    
    // If we've reloaded too many times, switch to basic mode
    if (reloadCount > 2) {
      console.log('Too many WebGL context losses. Switching to basic renderer.');
      setUseBasicRenderer(true);
      localStorage.setItem('webglReloadCount', '0');
    }
    
    // Clear the counter after 1 minute of successful operation
    const timer = setTimeout(() => {
      localStorage.setItem('webglReloadCount', '0');
    }, 60000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Start the first wave when the game starts
  useEffect(() => {
    if (gameStatus === 'playing') {
      const playerPosition = useGameStore.getState().playerPosition;
      const playerDirection = useGameStore.getState().playerDirection;
      
      console.log('Game started, player at:', playerPosition);
      
      // Play game start sound
      playSound('gameStart');
      
      // Start the first wave after a longer delay to give player time to prepare
      const timer = setTimeout(() => {
        spawnEnemyWave(1, playerPosition, playerDirection);
        // Play wave start sound
        playSound('waveStart');
      }, 4000);
      
      return () => clearTimeout(timer);
    }
    
    // Stop game music when not playing
    if (gameStatus !== 'playing') {
      stopSound('gameMusic');
    }
  }, [gameStatus, playSound, stopSound]);
  
  // Play background music when game is playing
  useEffect(() => {
    if (gameStatus === 'playing') {
      playSound('gameMusic', true); // second parameter is loop
    }
  }, [gameStatus, playSound]);
  
  // If we're using basic renderer, show a simplified version
  if (useBasicRenderer) {
    return (
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundColor: '#000', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1>משחק הצלף</h1>
        <p>הגרסה הבסיסית פועלת כעת מפני שנתקלנו בבעיות רינדור.</p>
        <p>ייתכן שהדפדפן או המכשיר שלך אינם תומכים ב-WebGL באופן מלא.</p>
        <button 
          onClick={() => {
            localStorage.setItem('webglReloadCount', '0');
            setUseBasicRenderer(false);
          }}
          style={{
            padding: '10px 20px',
            margin: '20px',
            backgroundColor: '#4466ff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          נסה מצב גרפי מלא
        </button>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <Canvas 
        shadows 
        gl={{ 
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
          depth: true,
          alpha: false,
          logarithmicDepthBuffer: true,
          failIfMajorPerformanceCaveat: false
        }}
        style={{ background: '#000' }}
        dpr={Math.min(window.devicePixelRatio, 2)} // Limit pixel ratio for better performance
        onCreated={({ gl }) => {
          // Set clear color
          gl.setClearColor('#111111');
          
          // Add event listener for context loss
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost. Trying to recover...');
            
            // Increment reload counter
            const currentCount = parseInt(localStorage.getItem('webglReloadCount') || '0');
            localStorage.setItem('webglReloadCount', (currentCount + 1).toString());
            
            // Only reload if we haven't exceeded the threshold
            if (currentCount < 2) {
              setTimeout(() => window.location.reload(), 2000);
            } else {
              // Switch to basic renderer instead of reloading again
              setUseBasicRenderer(true);
            }
          }, false);
          
          // Listen for successful context restore
          canvas.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored!');
          }, false);
        }}
      >
        {gameStatus === 'playing' && <Stats />}
        
        {/* Post-processing effects */}
        <PostProcessingEffects />
        
        {/* Sky and environment based on current level */}
        <Sky sunPosition={[10, 5, 20]} distance={450000} />
        
        {/* Level-specific lighting */}
        <ambientLight intensity={1.5} />
        <hemisphereLight intensity={1.2} color="#aaccff" groundColor="#335577" />
        <directionalLight 
          position={[5, 10, 2]} 
          intensity={2.0} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 3, -10]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={1.5} color="#88ccff" />
        
        {/* Add dynamic lights that follow the player */}
        <pointLight 
          position={[playerPosition[0], playerPosition[1] + 3, playerPosition[2] + 2]} 
          intensity={1.2}
          color="#aaffff"
          distance={15}
          decay={2}
        />
        
        {/* Camera setup */}
        <PerspectiveCamera makeDefault fov={70} position={[-2, 4, 8]} />
        <CameraFollow />
        
        {/* Time control for slow-motion effects */}
        <TimeController />
        
        {/* Atmospheric fog with color tied to level */}
        <fog attach="fog" args={['#223344', 30, 60]} />
        
        {/* Star field for background depth */}
        <Stars radius={100} depth={50} count={5000} factor={4} fade />
        
        {/* Add star sparkles for visual interest */}
        <Sparkles 
          count={50} 
          scale={[50, 20, 10]} 
          size={1.5} 
          speed={0.3} 
          color="#aaaaff" 
          opacity={0.5}
        />
        
        {/* Physics system for collisions */}
        <Physics>
          <Suspense fallback={<mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" emissive="hotpink" emissiveIntensity={2} />
          </mesh>}>
            {/* Level environment geometry */}
            <LevelEnvironment levelId={currentLevel} />
            
            {/* Game entities */}
            <Player />
            <EnemyManager />
            <Floor />
            <ProjectileSystem />
            
            {/* Particle systems */}
            <ParticleSystemsManager />
            
            {/* Environment lighting */}
            <Environment preset="sunset" />
          </Suspense>
        </Physics>
      </Canvas>
      
      {/* HUD overlay for game UI */}
      <HUD />
    </ErrorBoundary>
  );
};

export default Scene; 