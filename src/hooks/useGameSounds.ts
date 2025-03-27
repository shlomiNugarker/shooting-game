import { useEffect, useRef, useCallback } from 'react';
import useGameStore from '../models/gameStore';

// Sound categories and their respective file paths
const SOUNDS = {
  attack: '/sounds/attack.mp3',
  damaged: '/sounds/damaged.mp3',
  death: '/sounds/death.mp3',
  shoot: '/sounds/shoot.mp3',
  enemyDeath: '/sounds/enemy-death.mp3',
  levelUp: '/sounds/level-up.mp3',
  powerUp: '/sounds/power-up.mp3',
  background: '/sounds/background.mp3',
  gameStart: '/sounds/game-start.mp3',
  gameOver: '/sounds/game-over.mp3',
  waveStart: '/sounds/wave-start.mp3',
  waveIncoming: '/sounds/wave-incoming.mp3',
  levelComplete: '/sounds/level-complete.mp3',
  gameMusic: '/sounds/game-music.mp3',
};

const useGameSounds = () => {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const gameStatus = useGameStore((state) => state.gameStatus);
  const playerAnimationState = useGameStore((state) => state.playerAnimationState);
  const previousPlayerState = useRef(playerAnimationState);
  
  // Initialize sound system
  const initSounds = useCallback(() => {
    // Create audio elements for each sound
    Object.entries(SOUNDS).forEach(([key, path]) => {
      if (!audioRefs.current[key]) {
        const audio = new Audio();
        audio.src = path;
        
        // Set properties based on sound type
        if (key === 'gameMusic' || key === 'background') {
          audio.loop = true;
          audio.volume = 0.3;
        } else {
          audio.volume = 0.5;
        }
        
        audioRefs.current[key] = audio;
      }
    });
    
    console.log('Game sound system initialized');
  }, []);
  
  // Control background music based on game status
  useEffect(() => {
    const backgroundMusic = audioRefs.current?.gameMusic;
    
    if (backgroundMusic) {
      if (gameStatus === 'playing') {
        backgroundMusic.play().catch(() => {
          console.log('Background music playback prevented by browser');
        });
      } else {
        backgroundMusic.pause();
      }
    }
  }, [gameStatus]);
  
  // Play sounds based on player state changes
  useEffect(() => {
    if (previousPlayerState.current !== playerAnimationState) {
      if (playerAnimationState === 'attack') {
        playSound('attack');
      } else if (playerAnimationState === 'damaged') {
        playSound('damaged');
      } else if (playerAnimationState === 'death') {
        playSound('death');
      }
      
      previousPlayerState.current = playerAnimationState;
    }
  }, [playerAnimationState]);
  
  // Function to play a sound
  const playSound = useCallback((soundName: keyof typeof SOUNDS, loop = false) => {
    const audio = audioRefs.current[soundName];
    
    if (audio) {
      // Reset audio to beginning if it's already playing
      audio.currentTime = 0;
      audio.loop = loop;
      
      audio.play().catch(error => {
        console.log(`Error playing ${soundName} sound:`, error);
      });
    }
  }, []);
  
  // Function to stop a sound
  const stopSound = useCallback((soundName: keyof typeof SOUNDS) => {
    const audio = audioRefs.current[soundName];
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);
  
  // Clean up audio resources on component unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);
  
  return {
    initSounds,
    playSound,
    stopSound
  };
};

export default useGameSounds; 