import useGameStore from '../../models/gameStore';
import './Menu.css';

const GameOver = () => {
  const gameStatus = useGameStore(state => state.gameStatus);
  const score = useGameStore(state => state.score);
  const currentWave = useGameStore(state => state.currentWave);
  const resetGame = useGameStore(state => state.resetGame);
  
  if (gameStatus !== 'gameOver') {
    return null;
  }
  
  return (
    <div className="menu-container game-over">
      <div className="menu-content">
        <h1 className="game-over-title">GAME OVER</h1>
        
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">FINAL SCORE</span>
            <span className="stat-value">{score}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">WAVE REACHED</span>
            <span className="stat-value">{currentWave}</span>
          </div>
        </div>
        
        <div className="menu-buttons">
          <button 
            className="menu-button"
            onClick={resetGame}
          >
            Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver; 