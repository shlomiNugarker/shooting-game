import { Howl } from 'howler';

// Sound configuration
interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  rate?: number;
  autoplay?: boolean;
}

// Define all game sounds
const SOUNDS: { [key: string]: SoundConfig } = {
  // Background music
  bgm: {
    src: ['/sounds/bgm.mp3'],
    volume: 0.5,
    loop: true,
  },
  
  // Player sounds
  playerAttack: {
    src: ['/sounds/attack.mp3'],
    volume: 0.7,
  },
  playerDamaged: {
    src: ['/sounds/hit.mp3'],
    volume: 0.8,
  },
  playerDeath: {
    src: ['/sounds/death.mp3'],
    volume: 0.8,
  },
  
  // Enemy sounds
  enemyHit: {
    src: ['/sounds/enemy_hit.mp3'],
    volume: 0.6,
  },
  enemyDeath: {
    src: ['/sounds/enemy_death.mp3'],
    volume: 0.7,
  },
  
  // UI sounds
  menuSelect: {
    src: ['/sounds/select.mp3'],
    volume: 0.5,
  },
  gameStart: {
    src: ['/sounds/game_start.mp3'],
    volume: 0.7,
  },
  gameOver: {
    src: ['/sounds/game_over.mp3'],
    volume: 0.7,
  },
};

// Sound manager
class SoundManager {
  private sounds: Map<string, Howl>;
  private muted: boolean;
  
  constructor() {
    this.sounds = new Map();
    this.muted = false;
    this.initSounds();
  }
  
  // Initialize all sound objects
  private initSounds(): void {
    for (const [key, config] of Object.entries(SOUNDS)) {
      this.sounds.set(key, new Howl(config));
    }
  }
  
  // Play a sound
  play(name: string): number | undefined {
    if (!this.sounds.has(name)) {
      console.warn(`Sound "${name}" not found.`);
      return undefined;
    }
    
    if (this.muted) return undefined;
    
    const sound = this.sounds.get(name);
    return sound?.play();
  }
  
  // Stop a specific sound
  stop(name: string): void {
    if (!this.sounds.has(name)) {
      console.warn(`Sound "${name}" not found.`);
      return;
    }
    
    const sound = this.sounds.get(name);
    sound?.stop();
  }
  
  // Stop all sounds
  stopAll(): void {
    this.sounds.forEach(sound => sound.stop());
  }
  
  // Toggle mute state
  toggleMute(): boolean {
    this.muted = !this.muted;
    
    if (this.muted) {
      Howler.volume(0);
    } else {
      Howler.volume(1);
    }
    
    return this.muted;
  }
  
  // Set global volume (0.0 to 1.0)
  setVolume(volume: number): void {
    Howler.volume(Math.max(0, Math.min(1, volume)));
  }
}

// Create and export a singleton instance
export const soundManager = new SoundManager();

// Helper hook for using sound in React components
export const playSound = (name: string): number | undefined => {
  return soundManager.play(name);
}; 