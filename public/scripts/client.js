import {
  addScore, getScores, setGameDuration, getGameTime, getShotClock,
  startGame, stopGame, resetGame, startShotClock, stopShotClock, resetShotClock,
  getMatchHistory, clearMatchHistory, getTeamNames, setTeamName, setShotClock,
  getHalfCourt, 
} from '../../src/scripts/scoreboard.ts';

// import { saveMatchHistoryToDatabase } from '../../src/scripts/database.ts';

// Format time with milliseconds (MM:SS.mmm)
function splitTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return {
    mmss: `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
    ms: `.${millis.toString().padStart(3, '0')}`,
  };
}

let gameStarted = false;
let updateTimer = null;
let endedBy = null;
let initialGameDuration = 120;
let reconfiguring = false;
let reconfigTimer = null;
let shotClockRunning = false;

// Prepare the shot clock audio
const shotclockAudio = new Audio('src/assets/Shotclock.mp3');

function updateTimers() {
  const gameTime = getGameTime();
  const shotClock = getShotClock();
  const halfCourt = getHalfCourt();
  const gameSplit = splitTime(gameTime);
  const shotSplit = splitTime(shotClock);
  const halfCourtSplit = splitTime(halfCourt);
  document.getElementById('game-timer-mmss').textContent = gameSplit.mmss;
  document.getElementById('game-timer-ms').textContent = gameSplit.ms;
  document.getElementById('shot-clock-mmss').textContent = shotSplit.mmss;
  document.getElementById('shot-clock-ms').textContent = shotSplit.ms;
  document.getElementById('half-court-clock-mmss').textContent = halfCourtSplit.mmss;
  document.getElementById('half-court-clock-ms').textContent = halfCourtSplit.ms;

  // Play audio if needed
  checkHalfCourtAudio();
}

function checkHalfCourtAudio() {
  if (getHalfCourt() === 0 && !window.__shotclockPlayed) {
    shotclockAudio.currentTime = 0;
    shotclockAudio.play();
    window.__shotclockPlayed = true;
  }
  if (getHalfCourt() > 0) {
    window.__shotclockPlayed = false;
  }
}

function lockGameDuration(lock) {
  const select = document.getElementById('game-duration');
  if (lock) {
    select.setAttribute('disabled', 'disabled');
    select.classList.add('disabled');
  } else {
    select.removeAttribute('disabled');
    select.classList.remove('disabled');
  }
}

function renderMatchHistory() {
  const history = getMatchHistory();
  const tbody = document.getElementById('match-history');
  tbody.innerHTML = '';
  history.forEach(record => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-700';
    tr.innerHTML = `
      <td class="p-2">${new Date(record.timestamp).toLocaleString()}</td>
      <td class="p-2">${record.redTeamName}</td>
      <td class="p-2">${record.redScore}</td>
      <td class="p-2">${record.blueTeamName}</td>
      <td class="p-2">${record.blueScore}</td>
      <td class="p-2">${record.timeUsed ? record.timeUsed : ''}</td>
      <td class="p-2">${record.endedBy ? record.endedBy : ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

function setShotClockLabel(label) {
  const el = document.getElementById('shot-clock-label');
  if (el) el.textContent = label;
}

function clearAllIntervals() {
  if (updateTimer) clearInterval(updateTimer);
}

function startReconfiguration() {
  // Stop game and shot clock
  stopGame();
  stopShotClock();
  gameStarted = false;
  shotClockRunning = false;
  reconfiguring = true;
  setShotClockLabel('Reconfiguration:');
  // Set shot clock to 10s for reconfiguration
  resetShotClock();
  setShotClock(10);
  updateTimers();

  // Clear any previous reconfig timer
  if (reconfigTimer) clearInterval(reconfigTimer);

  // Start reconfiguration countdown immediately
  reconfigTimer = setInterval(() => {
    // Decrement the shot clock by 0.01s every 10ms
    setShotClock(getShotClock() - 0.01);
    updateTimers();
    if (getShotClock() <= 0) {
      clearInterval(reconfigTimer);
      reconfiguring = false;
      setShotClockLabel('Shot Clock:');
      // Reset shot clock to 20s and start both timers
      resetShotClock();
      startGame();
      startShotClock();
      gameStarted = true;
      shotClockRunning = true;
      startBothTimers();
    }
  }, 10);
}

window.addEventListener('DOMContentLoaded', () => {
  // Score buttons
  document.querySelectorAll('button[data-team]').forEach(button => {
    button.addEventListener('click', () => {
      const team = button.getAttribute('data-team');
      const points = parseInt(button.getAttribute('data-points'));
      addScore(team, points);
      document.getElementById(`${team}-score`).textContent = getScores()[team].toString();
      // Start reconfiguration mode after scoring
      startReconfiguration();
    });
  });

  // Game duration
  document.getElementById('game-duration').addEventListener('change', (e) => {
    const duration = parseInt(e.target.value);
    setGameDuration(duration);
    initialGameDuration = duration;
    updateTimers();
  });

  // Team name selection
  document.getElementById('red-team-name').addEventListener('change', (e) => {
    const name = e.target.value;
    setTeamName('red', name);
    const { redTeamName, blueTeamName } = getTeamNames();
    document.getElementById('red-team-title').textContent = redTeamName;
    document.getElementById('blue-team-title').textContent = blueTeamName;
    document.getElementById('blue-team-name').value = blueTeamName;
  });

  document.getElementById('blue-team-name').addEventListener('change', (e) => {
    const name = e.target.value;
    setTeamName('blue', name);
    const { redTeamName, blueTeamName } = getTeamNames();
    document.getElementById('red-team-title').textContent = redTeamName;
    document.getElementById('blue-team-title').textContent = blueTeamName;
    document.getElementById('red-team-name').value = redTeamName;
  });

  // --- Accurate timer start ---
  function startBothTimers() {
    clearAllIntervals();
    updateTimers();
    updateTimer = setInterval(() => {
      updateTimers();
      if (getGameTime() <= 0) {
        clearAllIntervals();
        gameStarted = false;
        shotClockRunning = false;
        lockGameDuration(false);
        renderMatchHistory();
        updateToggleGameButton();
        updateToggleShotButton();
      }
      if (getShotClock() <= 0) {
        shotClockRunning = false;
        updateToggleShotButton();
      }
    }, 10);
  }

  function updateToggleGameButton() {
    const btn = document.getElementById('toggle-game');
    if (!btn) return;
    if (gameStarted) {
      btn.textContent = 'Stop Game';
      btn.classList.remove('bg-green-500', 'hover:bg-green-600');
      btn.classList.add('bg-red-500', 'hover:bg-red-600');
    } else {
      btn.textContent = 'Start Game';
      btn.classList.remove('bg-red-500', 'hover:bg-red-600');
      btn.classList.add('bg-green-500', 'hover:bg-green-600');
    }
  }

  function updateToggleShotButton() {
    const btn = document.getElementById('toggle-shot');
    if (!btn) return;
    if (shotClockRunning) {
      btn.textContent = 'Stop Shot Clock';
      btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
      btn.classList.add('bg-red-500', 'hover:bg-red-600');
    } else {
      btn.textContent = 'Start Shot Clock';
      btn.classList.remove('bg-red-500', 'hover:bg-red-600');
      btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
    }
  }

  // Toggle Game button
  const toggleGameBtn = document.getElementById('toggle-game');
  updateToggleGameButton();

  toggleGameBtn.addEventListener('click', () => {
    if (!gameStarted) {
      startGame();
      startShotClock();
      gameStarted = true;
      shotClockRunning = true;
      lockGameDuration(true);
      endedBy = null;
      startBothTimers();
      updateToggleShotButton();
    } else {
      stopGame();
      stopShotClock();
      gameStarted = false;
      shotClockRunning = false;
      clearAllIntervals();
      updateToggleShotButton();
    }
    updateToggleGameButton();
  });

  // Toggle Shot Clock button
  const toggleShotBtn = document.getElementById('toggle-shot');
  updateToggleShotButton();

  toggleShotBtn.addEventListener('click', () => {
    if (!shotClockRunning) {
      startShotClock();
      shotClockRunning = true;
      if (!gameStarted) {
        startGame();
        gameStarted = true;
        lockGameDuration(true);
        endedBy = null;
      }
      startBothTimers();
    } else {
      stopShotClock();
      stopGame();
      shotClockRunning = false;
      gameStarted = false;
      clearAllIntervals();
      updateToggleGameButton();
    }
    updateToggleShotButton();
  });

  // Hide old buttons if present
  ['start-game', 'stop-game', 'start-shot', 'stop-shot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Reset Game button
  document.getElementById('reset-game').addEventListener('click', () => {
    resetGame();
    gameStarted = false;
    shotClockRunning = false; // Ensure shot clock is also stopped
    lockGameDuration(false);
    document.getElementById('red-score').textContent = '0';
    document.getElementById('blue-score').textContent = '0';
    updateTimers();
    const { redTeamName, blueTeamName } = getTeamNames();
    document.getElementById('red-team-title').textContent = redTeamName;
    document.getElementById('blue-team-title').textContent = blueTeamName;
    document.getElementById('red-team-name').value = redTeamName;
    document.getElementById('blue-team-name').value = blueTeamName;
    clearAllIntervals();
    renderMatchHistory(); // update match history table
    updateToggleGameButton(); // Always switch to "Start Game" button
  });

  // Reset Shot Clock button (always set to 20s)
  document.getElementById('reset-shot').addEventListener('click', () => {
    resetShotClock(); // always sets to 20s, even if running
    updateTimers();
  });

  // Clear match history
  document.getElementById('clear-history').addEventListener('click', () => {
    clearMatchHistory();
    document.getElementById('match-history').innerHTML = '';
  });

  // Initial render
  updateTimers();
  updateToggleGameButton();
  updateToggleShotButton();
  renderMatchHistory();
});