import React, { useRef, useEffect, useState } from 'react';
import useGameStore from '../../models/gameStore';

// Game constants
const GRID_SIZE = 20;
const GAME_SPEED = 150;

// Directions for snake movement
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type DirectionVector = { x: number; y: number };

const DIRECTIONS: Record<Direction, DirectionVector> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

// Main Snake Game Component
const SnakeGame: React.FC = () => {
  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  
  // Get state and actions from store
  const {
    score,
    highScore,
    gameStatus,
    snake,
    direction,
    food,
    speed,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    updateScore,
    moveSnake,
    changeDirection,
    placeFood
  } = useGameStore();
  
  // Local state for canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Initialize canvas and handle window resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateCanvasSize = () => {
      const width = Math.floor((window.innerWidth * 0.8) / GRID_SIZE) * GRID_SIZE;
      const height = Math.floor((window.innerHeight * 0.8) / GRID_SIZE) * GRID_SIZE;
      
      canvas.width = width;
      canvas.height = height;
      setCanvasSize({ width, height });
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);
  
  // Main game loop
  useEffect(() => {
    // Clear any existing game loop
    if (gameLoopRef.current !== null) {
      window.clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    // Only run if game is in playing state
    if (gameStatus !== 'playing') return;
    
    const runGameStep = () => {
      // Move the snake
      moveSnake();
      
      // Check for collisions and food
      const state = useGameStore.getState();
      
      // Wall collision check
      if (checkWallCollision(state.snake[0])) {
        useGameStore.setState({ gameStatus: 'gameOver' });
        return;
      }
      
      // Self collision check
      if (checkSelfCollision(state.snake)) {
        useGameStore.setState({ gameStatus: 'gameOver' });
        return;
      }
      
      // Check if food was eaten and update
      if (state.food.x === -1 && state.food.y === -1) {
        placeFood();
        updateScore(10);
        
        // Increase speed as snake eats
        if (state.speed > 50) {
          useGameStore.setState({ speed: state.speed - 5 });
        }
      }
    };
    
    // Helper functions for collision detection
    const checkWallCollision = (head: { x: number, y: number }) => {
      return (
        head.x < 0 || 
        head.y < 0 || 
        head.x >= canvasSize.width / GRID_SIZE || 
        head.y >= canvasSize.height / GRID_SIZE
      );
    };
    
    const checkSelfCollision = (snake: { x: number, y: number }[]) => {
      const head = snake[0];
      const body = snake.slice(1);
      return body.some(segment => segment.x === head.x && segment.y === head.y);
    };
    
    // Start new game loop with current speed
    gameLoopRef.current = window.setInterval(runGameStep, speed);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (gameLoopRef.current !== null) {
        window.clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameStatus, moveSnake, placeFood, updateScore, canvasSize, speed]);
  
  // Draw game elements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = '#4CAF50'; // Green head
      } else {
        // Gradient body effect
        const brightness = Math.max(0.7, 1 - index * 0.05);
        ctx.fillStyle = `rgb(${76 * brightness}, ${175 * brightness}, ${80 * brightness})`;
      }
      
      ctx.fillRect(
        segment.x * GRID_SIZE, 
        segment.y * GRID_SIZE, 
        GRID_SIZE, 
        GRID_SIZE
      );
      
      // Border for each segment
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        segment.x * GRID_SIZE, 
        segment.y * GRID_SIZE, 
        GRID_SIZE, 
        GRID_SIZE
      );
    });
    
    // Draw food
    if (food.x >= 0 && food.y >= 0) {
      ctx.fillStyle = '#F44336'; // Red
      ctx.beginPath();
      ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Add highlight to food
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 3,
        food.y * GRID_SIZE + GRID_SIZE / 3,
        GRID_SIZE / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw UI elements
    drawUI(ctx, canvas.width, canvas.height);
    
  }, [gameStatus, score, highScore, snake, food]);
  
  // Draw UI elements
  const drawUI = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`High Score: ${highScore}`, 10, 60);
    
    // Draw game state overlays
    if (gameStatus === 'menu') {
      drawMenuOverlay(ctx, width, height);
    } else if (gameStatus === 'paused') {
      drawPausedOverlay(ctx, width, height);
    } else if (gameStatus === 'gameOver') {
      drawGameOverOverlay(ctx, width, height);
    }
  };
  
  // Draw main menu overlay
  const drawMenuOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    
    ctx.font = '40px Arial';
    ctx.fillText('Snake Game', width / 2, height / 2 - 60);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to start', width / 2, height / 2);
    ctx.fillText('Use arrow keys to move', width / 2, height / 2 + 40);
    
    if (highScore > 0) {
      ctx.fillText(`Current High Score: ${highScore}`, width / 2, height / 2 + 80);
    }
  };
  
  // Draw pause overlay
  const drawPausedOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    
    ctx.font = '30px Arial';
    ctx.fillText('GAME PAUSED', width / 2, height / 2 - 15);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to continue', width / 2, height / 2 + 30);
  };
  
  // Draw game over overlay
  const drawGameOverOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    
    ctx.font = '40px Arial';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 50);
    
    ctx.font = '25px Arial';
    ctx.fillText(`Final Score: ${score}`, width / 2, height / 2);
    
    if (score > highScore) {
      ctx.fillStyle = '#FFEB3B'; // Yellow
      ctx.fillText('NEW HIGH SCORE!', width / 2, height / 2 + 40);
      ctx.fillStyle = 'white';
    }
    
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to restart', width / 2, height / 2 + 80);
  };
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default only for game control keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      
      // Handle space key based on game state
      if (e.key === " ") {
        if (gameStatus === 'menu') {
          startGame();
          return;
        } else if (gameStatus === 'paused') {
          resumeGame();
          return;
        } else if (gameStatus === 'gameOver') {
          resetGame();
          startGame();
          return;
        } else if (gameStatus === 'playing') {
          pauseGame();
          return;
        }
      }
      
      // Only handle direction changes if game is playing
      if (gameStatus !== 'playing') return;
      
      // Handle direction changes
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') {
            changeDirection('UP');
          }
          break;
        case 'ArrowDown':
          if (direction !== 'UP') {
            changeDirection('DOWN');
          }
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') {
            changeDirection('LEFT');
          }
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') {
            changeDirection('RIGHT');
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, direction, changeDirection, startGame, pauseGame, resumeGame, resetGame]);
  
  // Handle touch controls for mobile
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return;
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      
      // Only process if movement is significant
      if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) return;
      
      // Determine swipe direction
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && direction !== 'RIGHT') {
          changeDirection('LEFT');
        } else if (diffX < 0 && direction !== 'LEFT') {
          changeDirection('RIGHT');
        }
      } else {
        // Vertical swipe
        if (diffY > 0 && direction !== 'DOWN') {
          changeDirection('UP');
        } else if (diffY < 0 && direction !== 'UP') {
          changeDirection('DOWN');
        }
      }
      
      // Reset touch positions
      touchStartX = 0;
      touchStartY = 0;
    };
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      
      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [direction, changeDirection]);
  
  // Handle button clicks for mobile
  const handleButtonClick = (action: string) => {
    switch (action) {
      case 'start':
        startGame();
        break;
      case 'pause':
        pauseGame();
        break;
      case 'resume':
        resumeGame();
        break;
      case 'restart':
        resetGame();
        startGame();
        break;
    }
  };
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#212121',
      position: 'relative'
    }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>Snake Game</h1>
      
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '2px solid #333',
          borderRadius: '8px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
        }}
      />
      
      {/* Mobile controls */}
      {gameStatus === 'menu' && (
        <button
          onClick={() => handleButtonClick('start')}
          style={{
            marginTop: '20px',
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Start Game
        </button>
      )}
      
      {gameStatus === 'playing' && (
        <button
          onClick={() => handleButtonClick('pause')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Pause
        </button>
      )}
      
      {gameStatus === 'paused' && (
        <button
          onClick={() => handleButtonClick('resume')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Resume
        </button>
      )}
      
      {gameStatus === 'gameOver' && (
        <button
          onClick={() => handleButtonClick('restart')}
          style={{
            marginTop: '20px',
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Play Again
        </button>
      )}
      
      {/* Mobile control instructions */}
      <div style={{ 
        color: 'white', 
        marginTop: '15px',
        fontSize: '14px',
        textAlign: 'center' 
      }}>
        <p>Use arrow keys or swipe on screen to control</p>
        <p style={{ marginTop: '5px' }}>SPACE = Start/Pause/Resume</p>
      </div>
    </div>
  );
};

export default SnakeGame; 