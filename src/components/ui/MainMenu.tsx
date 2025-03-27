import { useState, useEffect } from 'react';
import useGameStore from '../../models/gameStore';
import './Menu.css';

const MainMenu = () => {
  const gameStatus = useGameStore(state => state.gameStatus);
  const startGame = useGameStore(state => state.startGame);
  const [showControls, setShowControls] = useState(false);
  
  // Ensure keyboard events don't trigger while on menu screen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowControls(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  if (gameStatus !== 'menu') {
    return null;
  }
  
  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1 className="game-title">SHADOW STRIKE</h1>
        <div className="game-subtitle">A Side-Scrolling Action Adventure</div>
        
        {showControls ? (
          <>
            <div className="controls-container">
              <h2>CONTROLS</h2>
              <ul className="controls-list">
                <li><span className="key">A</span> / <span className="key">←</span> Move Left</li>
                <li><span className="key">D</span> / <span className="key">→</span> Move Right</li>
                <li><span className="key">SPACE</span> Attack</li>
                <li><span className="key">ESC</span> Pause Game</li>
              </ul>
              <button 
                className="menu-button"
                onClick={() => setShowControls(false)}
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="menu-buttons">
              <button 
                className="menu-button start-button"
                onClick={startGame}
              >
                Start Game
              </button>
              <button 
                className="menu-button"
                onClick={() => setShowControls(true)}
              >
                Controls
              </button>
            </div>
            
            <div className="game-description">
              Battle waves of enemies in this action-packed adventure.
              Defeat enemies to increase your score and survive as long as possible!
            </div>
          </>
        )}
      </div>
      
      <div className="version-info">v0.1.0</div>
    </div>
  );
};

export default MainMenu; 