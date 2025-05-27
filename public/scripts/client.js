import { addScore, getScores, setGameDuration, getGameTime, getShotClock, startGame, stopGame, resetGame, startShotClock, stopShotClock, getMatchHistory, clearMatchHistory } from '../../src/scripts/scoreboard.ts';

window.addEventListener('DOMContentLoaded', () => {
  // Update scores on button click
  document.querySelectorAll('button[data-team]').forEach(button => {
    button.addEventListener('click', () => {
      const team = button.getAttribute('data-team');
      const points = parseInt(button.getAttribute('data-points'));
      addScore(team, points);
      document.getElementById(`${team}-score`).textContent = getScores()[team].toString();
    });
  });

  // Update game duration
  document.getElementById('game-duration').addEventListener('change', (e) => {
    const duration = parseInt(e.target.value);
    setGameDuration(duration);
    document.getElementById('game-timer').textContent = duration.toString();
  });

  // Timer controls
  document.getElementById('start-game').addEventListener('click', () => {
    startGame();
    const updateTimer = setInterval(() => {
      document.getElementById('game-timer').textContent = getGameTime().toString();
      document.getElementById('shot-clock').textContent = getShotClock().toString();
      if (getGameTime() <= 0) clearInterval(updateTimer);
    }, 1000);
  });

  document.getElementById('stop-game').addEventListener('click', () => {
    stopGame();
  });

  document.getElementById('reset-game').addEventListener('click', () => {
    resetGame();
    document.getElementById('red-score').textContent = '0';
    document.getElementById('blue-score').textContent = '0';
    document.getElementById('game-timer').textContent = getGameTime().toString();
    document.getElementById('shot-clock').textContent = getShotClock().toString();
  });

  document.getElementById('start-shot').addEventListener('click', () => {
    startShotClock();
    const updateShotClock = setInterval(() => {
      document.getElementById('shot-clock').textContent = getShotClock().toString();
      if (getShotClock() <= 0) clearInterval(updateShotClock);
    }, 1000);
  });

  document.getElementById('stop-shot').addEventListener('click', () => {
    stopShotClock();
    document.getElementById('shot-clock').textContent = getShotClock().toString();
  });

  // Clear match history
  document.getElementById('clear-history').addEventListener('click', () => {
    clearMatchHistory();
    document.getElementById('match-history').innerHTML = '';
  });
});