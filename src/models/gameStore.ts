import { create } from 'zustand';

// Snake game segment type
interface SnakeSegment {
  x: number;
  y: number;
}

// Food type
interface Food {
  x: number;
  y: number;
}

// Direction type
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Enemy type definition
interface Enemy {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  isDead: boolean;
  type: 'normal' | 'fast' | 'heavy';
  level: number;
  state: 'idle' | 'run' | 'attack' | 'damaged' | 'death';
  lastAttackTime: number;
  projectiles: any[];
  scoreValue: number;
  dropChance: number;
}

// Game state interface
interface GameState {
  // Snake game properties
  score: number;
  highScore: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver';
  snake: { x: number; y: number }[];
  direction: Direction;
  nextDirection: Direction; 
  food: { x: number; y: number };
  gridSize: number;
  speed: number;
  
  // Shooting game properties
  enemies: Enemy[];
  playerHealth: number;
  playerMaxHealth: number;
  playerAnimationState: string;
  currentWave: number;
  
  // Game actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  updateScore: (points: number) => void;
  moveSnake: () => void;
  changeDirection: (newDirection: Direction) => void;
  placeFood: () => void;
}

// Create game store
const useGameStore = create<GameState>((set, get) => ({
  // Initial game state
  score: 0,
  highScore: 0,
  gameStatus: 'menu',
  
  // Initial snake state - starts with one segment
  snake: [{ x: 10, y: 10 }],
  direction: 'RIGHT',
  nextDirection: 'RIGHT',
  
  // Initial food position
  food: { x: 5, y: 5 },
  
  // Game settings
  gridSize: 20,
  speed: 150, // התחלה עם מהירות איטית יותר 
  
  // Shooting game properties
  enemies: [],
  playerHealth: 100,
  playerMaxHealth: 100,
  playerAnimationState: '',
  currentWave: 1,
  
  // Game actions
  startGame: () => set({ 
    gameStatus: 'playing',
    score: 0,
    snake: [{ x: 10, y: 10 }],
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    speed: 150, // reset speed at start
    playerHealth: 100,
    playerMaxHealth: 100,
    currentWave: 1,
    // Force a valid food position on game start
    food: { 
      x: 15, // Place food a bit ahead of the snake
      y: 10  // Same y position as the snake
    }
  }),
  
  pauseGame: () => set({ gameStatus: 'paused' }),
  
  resumeGame: () => set({ gameStatus: 'playing' }),
  
  resetGame: () => {
    const state = get();
    set({
      gameStatus: 'menu',
      score: 0,
      snake: [{ x: 10, y: 10 }],
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
      // Update high score if current score is higher
      highScore: state.score > state.highScore ? state.score : state.highScore
    });
  },
  
  updateScore: (points) => set((state) => ({
    score: state.score + points
  })),
  
  moveSnake: () => set((state) => {
    // Get current state
    const { snake, nextDirection, food } = state;
    
    // Update direction for this move (גם אם משתמשים בכיוון הבא)
    const newDirection = nextDirection;
    
    // Get current head position
    const head = { ...snake[0] };
    
    // Move head in current direction
    switch (newDirection) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }
    
    // Create new snake array starting with new head
    const newSnake = [head, ...snake];
    
    // Check if food was eaten
    const ateFood = head.x === food.x && head.y === food.y;
    
    // Remove tail if no food was eaten
    if (!ateFood) {
      newSnake.pop();
    }
    
    // Return updated state
    return {
      snake: newSnake,
      direction: newDirection, // עדכן את הכיוון הנוכחי להיות הכיוון שזזנו אליו
      food: ateFood ? { x: -1, y: -1 } : food // אם נאכל מזון, סמן אותו לשחזור
    };
  }),
  
  changeDirection: (direction) => set((state) => {
    // Don't allow moving directly opposite to current direction
    const { direction: currentDirection } = state;
    
    if (
      (direction === 'UP' && currentDirection === 'DOWN') ||
      (direction === 'DOWN' && currentDirection === 'UP') ||
      (direction === 'LEFT' && currentDirection === 'RIGHT') ||
      (direction === 'RIGHT' && currentDirection === 'LEFT')
    ) {
      return {}; // No change
    }
    
    // Update next direction
    return { nextDirection: direction };
  }),
  
  placeFood: () => set((state) => {
    // Don't place food if one exists at a valid position
    if (state.food.x >= 0 && state.food.y >= 0) {
      return {};
    }
    
    // Get canvas dimensions from the current window size
    // This is an approximation - ideally we'd get these from the component
    const maxX = Math.floor(window.innerWidth * 0.8 / state.gridSize) - 2; // הוספת שוליים
    const maxY = Math.floor(window.innerHeight * 0.8 / state.gridSize) - 2; // הוספת שוליים
    
    // וודא שהמידות חיוביות
    const safeMaxX = Math.max(5, maxX);
    const safeMaxY = Math.max(5, maxY);
    
    // Find a position that's not occupied by the snake
    let newFood = { x: 0, y: 0 };
    let attempts = 0;
    const maxAttempts = 50; // הגבל את מספר הניסיונות
    
    do {
      newFood = {
        x: Math.floor(Math.random() * safeMaxX),
        y: Math.floor(Math.random() * safeMaxY)
      };
      
      // Make sure food is within bounds
      if (newFood.x < 0) newFood.x = 0;
      if (newFood.y < 0) newFood.y = 0;
      if (newFood.x >= safeMaxX) newFood.x = safeMaxX - 1;
      if (newFood.y >= safeMaxY) newFood.y = safeMaxY - 1;
      
      attempts++;
      if (attempts >= maxAttempts) {
        // אם לא מצאנו מיקום פנוי אחרי מספר ניסיונות, החזר מיקום אקראי
        break;
      }
    } while (state.snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y));
    
    console.log("New food placed at:", newFood, "after", attempts, "attempts");
    return { food: newFood };
  })
}));

export default useGameStore; 