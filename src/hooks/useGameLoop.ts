import { useRef, useEffect } from 'react';
import useGameStore from '../models/gameStore';

type GameLoopCallback = (deltaTime: number) => void;

const useGameLoop = (callback: GameLoopCallback) => {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const gameStatus = useGameStore(state => state.gameStatus);
  
  useEffect(() => {
    // Only run the game loop if the game is actively playing
    if (gameStatus !== 'playing') {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }
    
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, gameStatus]);
};

export default useGameLoop; 