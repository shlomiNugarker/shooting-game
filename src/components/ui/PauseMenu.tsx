import { useEffect } from 'react';
import useGameStore from '../../models/gameStore';
import './Menu.css';

const PauseMenu = () => {
  const gameStatus = useGameStore(state => state.gameStatus);
  const pauseGame = useGameStore(state => state.pauseGame);
  const resetGame = useGameStore(state => state.resetGame);
  
  // Add escape key handler for toggling pause
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Only toggle pause if game is playing or paused
        if (gameStatus === 'playing' || gameStatus === 'paused') {
          pauseGame();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, pauseGame]);
  
  if (gameStatus !== 'paused') {
    return null;
  }
  
  return (
    <div className="menu-container">
      <div className="menu-content">
        <h1 className="pause-title">PAUSED</h1>
        
        <div className="menu-buttons">
          <button 
            className="menu-button resume-button"
            onClick={pauseGame} // Unpause the game
          >
            Resume Game
          </button>
          
          <button 
            className="menu-button"
            onClick={resetGame}
          >
            Quit to Menu
          </button>
        </div>
        
        <div className="controls-reminder">
          <h3>Controls</h3>
          <ul className="controls-list-small">
            <li><span className="key">A</span> / <span className="key">←</span> Move Left</li>
            <li><span className="key">D</span> / <span className="key">→</span> Move Right</li>
            <li><span className="key">SPACE</span> Attack</li>
            <li><span className="key">ESC</span> Pause/Resume</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu; 