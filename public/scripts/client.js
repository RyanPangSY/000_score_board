import {
  addScore, getScores, setGameDuration, getGameTime, getShotClock,
  startGame, stopGame, resetGame, startShotClock, stopShotClock, resetShotClock,
  getMatchHistory, clearMatchHistory, getTeamNames, setTeamName, setShotClock,
  getHalfCourt, 
} from '../../src/scripts/scoreboard.ts';

// import { saveMatchHistoryToDatabase } from '../../src/scripts/database.ts';

// --- State Variables ---
let gameStarted = false;
let updateTimer = null;
let endedBy = null;
let initialGameDuration = 120;
let reconfiguring = false;
let reconfigTimer = null;
let shotClockRunning = false;
let passedHalfCourt = false;

// --- Audio ---
const whistleAudio = new Audio('src/assets/Whistle.mp3');
const shotclockAudio = new Audio('src/assets/Shotclock.mp3');

// --- Utility Functions ---
function splitTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100);
  return {
    mmssms: `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`,
  };
}

function setShotClockLabel(label) {
  const el = document.getElementById('shot-clock-label');
  if (el) el.textContent = label;
}

function setAllButtonsDisabled(disabled) {
  document.querySelectorAll('button').forEach(btn => {
    btn.disabled = disabled;
  });
}

function clearAllIntervals() {
  if (updateTimer) clearInterval(updateTimer);
}

// --- UI Update Functions ---
function updateTimers() {
  const gameTime = getGameTime();
  const shotClock = getShotClock();
  const halfCourt = getHalfCourt();
  const gameSplit = splitTime(gameTime);
  const shotSplit = splitTime(shotClock);
  const halfCourtSplit = splitTime(halfCourt);
  document.getElementById('game-timer-mmssms').textContent = gameSplit.mmssms;
  document.getElementById('shot-clock-mmssms').textContent = shotSplit.mmssms;
  document.getElementById('half-court-clock-mmssms').textContent = halfCourtSplit.mmssms;
  checkHalfCourtAudio();
  checkShotClockAudio();
}

function updateToggleGameButton() {
  const btn = document.getElementById('toggle-game');
  if (!btn) return;
  btn.textContent = gameStarted ? 'Stop Game' : 'Start Game';
  btn.classList.toggle('bg-green-500', !gameStarted);
  btn.classList.toggle('hover:bg-green-600', !gameStarted);
  btn.classList.toggle('bg-red-500', gameStarted);
  btn.classList.toggle('hover:bg-red-600', gameStarted);
}

function updateToggleShotButton() {
  const btn = document.getElementById('toggle-shot');
  if (!btn) return;
  btn.textContent = shotClockRunning ? 'Stop Shot Clock' : 'Start Shot Clock';
  btn.classList.toggle('bg-blue-500', !shotClockRunning);
  btn.classList.toggle('hover:bg-blue-600', !shotClockRunning);
  btn.classList.toggle('bg-red-500', shotClockRunning);
  btn.classList.toggle('hover:bg-red-600', shotClockRunning);
}

function renderMatchHistory() {
  const history = getMatchHistory();
  const tbody = document.getElementById('match-history');
  const latestRecord = history[history.length - 1];
  sendMatchRecordToServer(latestRecord);
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
      <td class="p-2">${record.timeUsed || ''}</td>
      <td class="p-2">${record.endedBy || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Timer Functions ---
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

function startReconfiguration() {
  setAllButtonsDisabled(true);
  stopGame();
  stopShotClock();
  gameStarted = false;
  shotClockRunning = false;
  reconfiguring = true;
  passedHalfCourt = false;
  setShotClockLabel('Reconfiguration:');
  resetShotClock();
  setShotClock(10);
  updateTimers();

  if (reconfigTimer) clearInterval(reconfigTimer);

  reconfigTimer = setInterval(() => {
    setShotClock(getShotClock() - 0.01);
    if (getShotClock() <= 0) {
      clearInterval(reconfigTimer);
      reconfiguring = false;
      passedHalfCourt = false;
      gameStarted = true;
      shotClockRunning = true;
      setAllButtonsDisabled(false);
      setShotClockLabel('Shot Clock:');
      resetShotClock();
      setShotClock(20);
      startGame();
      startShotClock();
      startBothTimers();
      updateToggleGameButton();
      updateToggleShotButton();
    }
    updateTimers();
  }, 10);
}

// --- Audio Functions ---
function checkHalfCourtAudio() {
  if (!passedHalfCourt && getHalfCourt() === 0 && !window.__shotclockPlayed) {
    whistleAudio.currentTime = 0;
    whistleAudio.play();
    window.__shotclockPlayed = true;
    stopGame();
    stopShotClock();
    gameStarted = false;
    shotClockRunning = false;
    resetShotClock();
    updateTimers();
    updateToggleGameButton();
    updateToggleShotButton();
  }
  if (getHalfCourt() > 0) window.__shotclockPlayed = false;
}

function checkShotClockAudio() {
  if (shotClockRunning && getShotClock() <= 0 && !window.__shotclockPlayed) {
    shotclockAudio.currentTime = 0;
    shotclockAudio.play();
    window.__shotclockPlayed = true;
    stopGame();
    stopShotClock();
    gameStarted = false;
    shotClockRunning = false;
    resetShotClock();
    updateTimers();
    updateToggleGameButton();
    updateToggleShotButton();
  } else if (getShotClock() > 0) {
    window.__shotclockPlayed = false;
  }
}

// --- Misc UI ---
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

// --- Keyboard Events ---
document.addEventListener('keydown', e => {
  if (e.key === 'e') passedHalfCourt = true;
  if (e.key === 'E') passedHalfCourt = false;
});

// --- DOMContentLoaded: Event Listeners & Initial Render ---
window.addEventListener('DOMContentLoaded', () => {
  // Score buttons
  document.querySelectorAll('button[data-team]').forEach(button => {
    button.addEventListener('click', () => {
      const team = button.getAttribute('data-team');
      const points = parseInt(button.getAttribute('data-points'));
      addScore(team, points);
      document.getElementById(`${team}-score`).textContent = getScores()[team].toString();
      startReconfiguration();
    });
  });

  // Game duration
  document.getElementById('game-duration').addEventListener('change', e => {
    const duration = parseInt(e.target.value);
    setGameDuration(duration);
    initialGameDuration = duration;
    updateTimers();
  });

  // Team name selection
  document.getElementById('red-team-name').addEventListener('change', e => {
    const name = e.target.value;
    setTeamName('red', name);
    const { redTeamName, blueTeamName } = getTeamNames();
    document.getElementById('red-team-title').textContent = redTeamName;
    document.getElementById('blue-team-title').textContent = blueTeamName;
    document.getElementById('blue-team-name').value = blueTeamName;
  });

  document.getElementById('blue-team-name').addEventListener('change', e => {
    const name = e.target.value;
    setTeamName('blue', name);
    const { redTeamName, blueTeamName } = getTeamNames();
    document.getElementById('red-team-title').textContent = redTeamName;
    document.getElementById('blue-team-title').textContent = blueTeamName;
    document.getElementById('red-team-name').value = redTeamName;
  });

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
    passedHalfCourt = false;
    shotClockRunning = false;
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
    renderMatchHistory();
    updateToggleGameButton();
  });

  // Reset Shot Clock button
  document.getElementById('reset-shot').addEventListener('click', () => {
    resetShotClock();
    passedHalfCourt = false;
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

function sendMatchRecordToServer(record) {
  fetch('/api/match-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}