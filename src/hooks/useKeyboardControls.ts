import { useEffect, useState, useRef } from 'react';
import useGameStore from '../models/gameStore';

interface KeyState {
  left: boolean;
  right: boolean;
  attack: boolean;
}

const useKeyboardControls = () => {
  const [keys, setKeys] = useState<KeyState>({
    left: false,
    right: false,
    attack: false
  });
  
  const movePlayer = useGameStore(state => state.movePlayer);
  const playerAttack = useGameStore(state => state.playerAttack);
  const gameStatus = useGameStore(state => state.gameStatus);
  const attackCooldownRef = useRef<number | null>(null);
  
  // Handle keydown events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Process inputs for menu/pause toggle regardless of game state
      if (e.key === 'Escape') {
        if (gameStatus === 'playing') {
          useGameStore.getState().pauseGame();
        } else if (gameStatus === 'paused') {
          useGameStore.getState().pauseGame(); // Toggle back to playing
        }
        return;
      }
      
      // Only process movement/attack inputs if the game is actively playing
      if (gameStatus !== 'playing') return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setKeys(prev => ({ ...prev, left: true }));
      }
      
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setKeys(prev => ({ ...prev, right: true }));
      }
      
      if ((e.key === ' ' || e.key === 'Space') && !keys.attack) {
        // Only trigger attack if not already attacking and cooldown is over
        if (!attackCooldownRef.current) {
          setKeys(prev => ({ ...prev, attack: true }));
          console.log('Attack key pressed!');
          
          // Set attack cooldown to prevent spam
          attackCooldownRef.current = window.setTimeout(() => {
            attackCooldownRef.current = null;
          }, 500);
        }
      }
    };
    
    // Handle keyup events
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setKeys(prev => ({ ...prev, left: false }));
      }
      
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setKeys(prev => ({ ...prev, right: false }));
      }
      
      if (e.key === ' ' || e.key === 'Space') {
        setKeys(prev => ({ ...prev, attack: false }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Clear any pending timeouts
      if (attackCooldownRef.current) {
        clearTimeout(attackCooldownRef.current);
      }
    };
  }, [gameStatus, keys.attack]);
  
  // Update player movement based on key presses
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    if (keys.left && !keys.right) {
      movePlayer('left');
    } else if (keys.right && !keys.left) {
      movePlayer('right');
    } else {
      movePlayer('none');
    }
    
    if (keys.attack) {
      playerAttack();
      console.log('Executing attack!');
    }
  }, [keys, movePlayer, playerAttack, gameStatus]);
  
  return keys;
};

export default useKeyboardControls; 