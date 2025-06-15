import {
  addScore, getScores, setGameDuration, getGameTime, getShotClock,
  startGame, stopGame, resetGame, startShotClock, stopShotClock, resetShotClock,
  getMatchHistory, clearMatchHistory, getTeamNames, setTeamName, setShotClock,
  getHalfCourt, 
} from './scoreboard.ts';

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
let isFreshStart = true;

// --- Audio ---
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let whistleBuffer, shotclockBuffer, preBeepBuffer, beepBuffer;

async function loadAudio(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

async function setupAudio() {
  whistleBuffer = await loadAudio('/000_score_board/assets/Whistle.mp3');
  shotclockBuffer = await loadAudio('/000_score_board/assets/Shotclock.mp3');
  preBeepBuffer = await loadAudio('/000_score_board/assets/Beep_1.mp3');
  beepBuffer = await loadAudio('/000_score_board/assets/Beep_2.mp3');
}
setupAudio();

function playBuffer(buffer) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}

// --- Utility Functions ---
function splitTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100);
  return {
    mm: `${minutes.toString().padStart(2, '0')}`,
    ss: `${secs.toString().padStart(2, '0')}`,
    ms: `${millis.toString().padStart(2, '0')}`,
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
  document.getElementById('game-timer-mmssms').textContent = gameSplit.mm + ':' + gameSplit.ss + '.' + gameSplit.ms;
  document.getElementById('shot-clock-mmssms').textContent = shotSplit.mm + ':' + shotSplit.ss + '.' + shotSplit.ms;
  document.getElementById('half-court-clock-mmssms').textContent = halfCourtSplit.mm + ':' + halfCourtSplit.ss + '.' + halfCourtSplit.ms;
  checkHalfCourtAudio();
  checkShotClockAudio();
  if (reconfiguring && shotSplit.ms == '00' && shotSplit.ss != '00') {
    playBuffer(preBeepBuffer);
  }
  else if (reconfiguring && shotSplit.ms == '00' && shotSplit.ss == '00') {
    playBuffer(beepBuffer);
  }
  else if (gameStarted && Math.floor(gameTime % 60) <= 3 && gameSplit.mm == "00" && gameSplit.ms == '00' && gameSplit.ss != '00') {
    playBuffer(preBeepBuffer);
  }
  else if (gameStarted && gameSplit.mm == "00" && gameSplit.ms == '00' && gameSplit.ss == '00') {
    playBuffer(beepBuffer);
  }
  else if (Math.floor(shotClock % 60) <= 3 && shotSplit.ms == '00' && shotSplit.ss != '00') {
    playBuffer(preBeepBuffer);
  }
  else if (!passedHalfCourt && Math.floor(halfCourt % 60) <= 3 && halfCourtSplit.ms == '00' && halfCourtSplit.ss != '00') {
    playBuffer(preBeepBuffer);
  }
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
  // sendMatchRecordToServer(latestRecord);
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
  if (isFreshStart) {
    isFreshStart = false;
    startCountdown(10);
  }
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

function startCountdown(time) {
  setAllButtonsDisabled(true);
  stopGame();
  stopShotClock();
  gameStarted = false;
  shotClockRunning = false;
  reconfiguring = true;
  passedHalfCourt = false;
  updateHalfCourtStatus()
  setShotClockLabel('Countdown:');
  resetShotClock();
  setShotClock(countdownTimeSetting); // Use setting
  updateTimers();

  if (reconfigTimer) clearInterval(reconfigTimer);

  reconfigTimer = setInterval(() => {
    setShotClock(getShotClock() - 0.01);
    if (getShotClock() <= 0) {
      clearInterval(reconfigTimer);
      reconfiguring = false;
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

function startReconfiguration() {
  setAllButtonsDisabled(true);
  stopGame();
  stopShotClock();
  gameStarted = false;
  shotClockRunning = false;
  reconfiguring = true;
  passedHalfCourt = false;
  updateHalfCourtStatus()
  setShotClockLabel('Reconfiguration:');
  resetShotClock();
  setShotClock(reconfigTimeSetting); // Use setting
  updateTimers();

  if (reconfigTimer) clearInterval(reconfigTimer);

  reconfigTimer = setInterval(() => {
    setShotClock(getShotClock() - 0.01);
    if (getShotClock() <= 0) {
      clearInterval(reconfigTimer);
      reconfiguring = false;
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
    playBuffer(whistleBuffer);
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
    playBuffer(shotclockBuffer);
    window.__shotclockPlayed = true;
    stopGame();
    stopShotClock();
    gameStarted = false;
    shotClockRunning = false;
    passedHalfCourt = false;
    updateHalfCourtStatus();
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

function updateHalfCourtStatus() {
  const el = document.getElementById('half-court-status');
  if (el) {
    el.textContent = passedHalfCourt ? 'Half Court: PASSED' : 'Half Court: NOT PASSED';
    el.style.color = passedHalfCourt ? 'limegreen' : 'red';
  }
}

// --- Fouls State ---
const fouls = {
  Andy: 0,
  Philip: 0,
  Ryan: 0,
  Henry: 0,
};

function updateFoulDisplay() {
  ['Andy', 'Philip', 'Ryan', 'Henry'].forEach(name => {
    const el = document.getElementById(`foul-count-${name}`);
    if (el) el.textContent = fouls[name];
  });
}

function changeFoul(name, delta) {
  fouls[name] = Math.max(0, fouls[name] + delta);
  updateFoulDisplay();
}

// --- Settings Modal State ---
let countdownTimeSetting = 10;
let reconfigTimeSetting = 10;

// --- Settings Modal Logic ---
function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.classList.add('visible');
  modal.classList.remove('hidden');
  // Set current values
  document.getElementById('countdown-time-input').value = countdownTimeSetting;
  document.getElementById('reconfig-time-input').value = reconfigTimeSetting;
  // Focus first input
  document.getElementById('countdown-time-input').focus();
}
function hideSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.classList.remove('visible');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

// --- ESC key to toggle settings modal ---
let settingsOpen = false;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('settings-modal');
    if (!settingsOpen) {
      showSettingsModal();
      settingsOpen = true;
    } else {
      hideSettingsModal();
      settingsOpen = false;
    }
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'e') {
    passedHalfCourt = true;
    updateHalfCourtStatus();
  }
  if (e.key === 'E') {
    passedHalfCourt = false;
    updateHalfCourtStatus();
  }
});

// --- Modal button handlers ---
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
      // playBuffer(beepBuffer)
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

  // Pass Half Court button for mobile
  const passBtn = document.getElementById('pass-half-court');
  if (passBtn) {
    passBtn.addEventListener('click', () => {
      passedHalfCourt = true;
      updateHalfCourtStatus();
    });
  }

  // Hide old buttons if present
  ['start-game', 'stop-game', 'start-shot', 'stop-shot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Reset Game button
  document.getElementById('reset-game').addEventListener('click', () => {
    resetGame();
    gameStarted = false;
    shotClockRunning = false;
    passedHalfCourt = false;
    isFreshStart = true;
    updateHalfCourtStatus();
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
    updateHalfCourtStatus();
    updateTimers();
  });

  // Settings button
  document.getElementById('settings').addEventListener('click', () => {
    if (!settingsOpen) {
      showSettingsModal();
      settingsOpen = true;
    } else {
      hideSettingsModal();
      settingsOpen = false;
    }
  });

  // Clear match history
  document.getElementById('clear-history').addEventListener('click', () => {
    if (window.confirm('You have unsaved data. Are you sure you want to clear the match history?')) {
      clearMatchHistory();
      renderMatchHistory();
    }
  });

  // Export match history
  document.getElementById('export-history').addEventListener('click', exportMatchHistoryToCSV);

  // 綁定犯規按鈕
  ['Andy', 'Philip', 'Ryan', 'Henry'].forEach(name => {
    document.getElementById(`foul-minus-${name}`).addEventListener('click', () => changeFoul(name, -1));
    document.getElementById(`foul-plus-${name}`).addEventListener('click', () => changeFoul(name, 1));
  });

  // Settings Save
  document.getElementById('settings-save').addEventListener('click', () => {
    const countdownVal = parseInt(document.getElementById('countdown-time-input').value, 10);
    const reconfigVal = parseInt(document.getElementById('reconfig-time-input').value, 10);
    if (Number.isInteger(countdownVal) && countdownVal > 0) {
      countdownTimeSetting = countdownVal;
    }
    if (Number.isInteger(reconfigVal) && reconfigVal > 0) {
      reconfigTimeSetting = reconfigVal;
    }
    hideSettingsModal();
    settingsOpen = false;
  });

  // Settings Cancel
  document.getElementById('settings-cancel').addEventListener('click', () => {
    hideSettingsModal();
    settingsOpen = false;
  });

  // Initial render
  updateTimers();
  updateToggleGameButton();
  updateToggleShotButton();
  renderMatchHistory();
  updateHalfCourtStatus();
  updateFoulDisplay();
});

function sendMatchRecordToServer(record) {
  fetch('/api/match-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
}

function exportMatchHistoryToCSV() {
  const history = getMatchHistory();
  if (!history.length) {
    alert('No match history to export.');
    return;
  }

  // 1. 犯規統計
  const foulRows = [
    ['Player', 'Fouls'],
    ...Object.entries(fouls).map(([name, count]) => [name, count])
  ];

  // 2. 開始與結束時間（本地時區，英文）
  const startTime = history[0]?.timestamp;
  const endTime = new Date().toISOString();

  const metaRows = [
    [
      `Start Time`,
      startTime
        ? new Date(startTime).toLocaleString('en-US', { hour12: false })
        : ''
    ],
    [
      `End Time`,
      new Date(endTime).toLocaleString('en-US', { hour12: false })
    ],
    []
  ];

  // 3. 比賽紀錄（timestamp 也轉本地時區）
  const headers = [
    'timestamp', 'redTeamName', 'redScore', 'blueTeamName', 'blueScore', 'timeUsed', 'endedBy'
  ];
  const matchRows = [
    headers,
    ...history.map(record =>
      [
        new Date(record.timestamp).toLocaleString('en-US', { hour12: false }),
        record.redTeamName,
        record.redScore,
        record.blueTeamName,
        record.blueScore,
        record.timeUsed || '',
        record.endedBy || ''
      ]
    )
  ];

  // 4. 組合所有資料
  const allRows = [
    ...metaRows,
    ['Foul Statistics'],
    ...foulRows,
    [],
    ['Match History'],
    ...matchRows
  ];

  // 5. 轉為 CSV 字串
  const csvContent = allRows
    .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // 6. 下載
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'match_history.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function unlockAudioContext() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  window.removeEventListener('click', unlockAudioContext);
  window.removeEventListener('keydown', unlockAudioContext);
}
window.addEventListener('click', unlockAudioContext);
window.addEventListener('keydown', unlockAudioContext);

window.addEventListener('beforeunload', function(e) {
  if (getMatchHistory().length > 0) {
    e.preventDefault();
    e.returnValue = 'You have unsaved data. Are you sure you want to leave?';
    return 'You have unsaved data. Are you sure you want to leave?';
  }
});