import { useEffect, useState } from 'react';
import useGameStore from '../../models/gameStore';
import './HUD.css';

const HUD = () => {
  const playerHealth = useGameStore(state => state.playerHealth);
  const playerMaxHealth = useGameStore(state => state.playerMaxHealth);
  const score = useGameStore(state => state.score);
  const currentWave = useGameStore(state => state.currentWave);
  const gameStatus = useGameStore(state => state.gameStatus);
  
  const [showDamage, setShowDamage] = useState(false);
  
  // Show damage vignette effect when health changes
  useEffect(() => {
    if (playerHealth < playerMaxHealth) {
      setShowDamage(true);
      const timer = setTimeout(() => {
        setShowDamage(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [playerHealth, playerMaxHealth]);
  
  if (gameStatus !== 'playing') {
    return null;
  }
  
  return (
    <div className="hud-container">
      {/* Health bar */}
      <div className="health-container">
        <div className="health-label">HEALTH</div>
        <div className="health-bar-bg">
          <div 
            className="health-bar-fill" 
            style={{ 
              width: `${(playerHealth / playerMaxHealth) * 100}%`,
              backgroundColor: playerHealth > 50 ? '#00ff00' : playerHealth > 25 ? '#ffff00' : '#ff0000'
            }}
          />
        </div>
        <div className="health-text">{playerHealth} / {playerMaxHealth}</div>
      </div>
      
      {/* Score and wave display */}
      <div className="info-container">
        <div className="score">SCORE: {score}</div>
        <div className="wave">WAVE: {currentWave}</div>
      </div>
      
      {/* Damage vignette effect */}
      {showDamage && (
        <div className="damage-vignette" />
      )}
    </div>
  );
};

export default HUD; 