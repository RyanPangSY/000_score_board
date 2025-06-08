// src/scripts/scoreboard.ts
var redScore = 0;
var blueScore = 0;
var gameTime = 120;
var shotClock = 20;
var halfCourt = 8;
var redTeamName = "Lebron James";
var blueTeamName = "Michael Jordan";
var isGameRunning = false;
var isShotClockRunning = false;
var gameInterval = null;
var shotClockInterval = null;
var matchHistory = [];
if (typeof window !== "undefined") {
  matchHistory = JSON.parse(localStorage.getItem("matchHistory") || "[]");
}
var initialGameDuration = 120;
var gameStartTimestamp = null;
function addScore(team, points) {
  if (team === "red") {
    redScore += points;
  } else {
    blueScore += points;
  }
}
function getScores() {
  return { red: redScore, blue: blueScore };
}
function setGameDuration(seconds) {
  gameTime = seconds;
  initialGameDuration = seconds;
}
function getGameTime() {
  return gameTime;
}
function getShotClock() {
  return shotClock;
}
function getHalfCourt() {
  return halfCourt;
}
function getTeamNames() {
  return { redTeamName, blueTeamName };
}
function setTeamName(team, name) {
  if (team === "red") {
    redTeamName = name;
    blueTeamName = name === "Lebron James" ? "Michael Jordan" : "Lebron James";
  } else {
    blueTeamName = name;
    redTeamName = name === "Lebron James" ? "Michael Jordan" : "Lebron James";
  }
}
function startGame() {
  if (!isGameRunning) {
    isGameRunning = true;
    if (!gameStartTimestamp) gameStartTimestamp = Date.now();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      if (gameTime > 0) {
        gameTime = Math.max(0, gameTime - 0.01);
      } else {
        stopGame();
        saveMatch("timer");
      }
    }, 10);
    startShotClock();
  }
}
function stopGame() {
  if (isGameRunning) {
    isGameRunning = false;
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
    stopShotClock();
  }
}
function resetGame() {
  stopGame();
  saveMatch("reset");
  redScore = 0;
  blueScore = 0;
  gameTime = initialGameDuration;
  shotClock = 20;
  halfCourt = 8;
  gameStartTimestamp = null;
}
function startShotClock() {
  if (!isShotClockRunning) {
    isShotClockRunning = true;
    if (shotClockInterval) clearInterval(shotClockInterval);
    shotClockInterval = setInterval(() => {
      if (shotClock > 0) {
        shotClock = Math.max(0, shotClock - 0.01);
        halfCourt = Math.max(0, shotClock - 12);
      } else {
        stopShotClock();
      }
    }, 10);
  }
}
function stopShotClock() {
  if (isShotClockRunning) {
    isShotClockRunning = false;
    if (shotClockInterval) {
      clearInterval(shotClockInterval);
      shotClockInterval = null;
    }
  }
}
function resetShotClock() {
  shotClock = 20;
  halfCourt = 8;
}
function setShotClock(seconds) {
  shotClock = seconds;
}
function saveMatch(endedBy2) {
  if (!gameStartTimestamp) return;
  let timeUsed = "";
  if (endedBy2 === "timer") {
    timeUsed = `${initialGameDuration}s`;
  } else if (endedBy2 === "reset") {
    const used = Math.round((Date.now() - gameStartTimestamp) / 10) / 100;
    timeUsed = `${used}s`;
  }
  const record = {
    redScore,
    blueScore,
    redTeamName,
    blueTeamName,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    timeUsed,
    endedBy: endedBy2,
    getTimestamp: function() {
      throw new Error("Function not implemented.");
    }
  };
  matchHistory.push(record);
  if (typeof window !== "undefined") {
    localStorage.setItem("matchHistory", JSON.stringify(matchHistory));
  }
  gameStartTimestamp = null;
}
function getMatchHistory() {
  return matchHistory;
}
function clearMatchHistory() {
  matchHistory = [];
  if (typeof window !== "undefined") {
    localStorage.setItem("matchHistory", "[]");
  }
}

// src/scripts/client.js
var gameStarted = false;
var updateTimer = null;
var endedBy = null;
var initialGameDuration2 = 120;
var reconfiguring = false;
var reconfigTimer = null;
var shotClockRunning = false;
var passedHalfCourt = false;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var whistleBuffer;
var shotclockBuffer;
var preBeepBuffer;
var beepBuffer;
async function loadAudio(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}
async function setupAudio() {
  whistleBuffer = await loadAudio("/src/assets/Whistle.mp3");
  shotclockBuffer = await loadAudio("/src/assets/Shotclock.mp3");
  preBeepBuffer = await loadAudio("/src/assets/Beep_1.mp3");
  beepBuffer = await loadAudio("/src/assets/Beep_2.mp3");
}
setupAudio();
function playBuffer(buffer) {
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}
function splitTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor(seconds % 1 * 100);
  return {
    mm: `${minutes.toString().padStart(2, "0")}`,
    ss: `${secs.toString().padStart(2, "0")}`,
    ms: `${millis.toString().padStart(2, "0")}`
  };
}
function setShotClockLabel(label) {
  const el = document.getElementById("shot-clock-label");
  if (el) el.textContent = label;
}
function setAllButtonsDisabled(disabled) {
  document.querySelectorAll("button").forEach((btn) => {
    btn.disabled = disabled;
  });
}
function clearAllIntervals() {
  if (updateTimer) clearInterval(updateTimer);
}
function updateTimers() {
  const gameTime2 = getGameTime();
  const shotClock2 = getShotClock();
  const halfCourt2 = getHalfCourt();
  const gameSplit = splitTime(gameTime2);
  const shotSplit = splitTime(shotClock2);
  const halfCourtSplit = splitTime(halfCourt2);
  document.getElementById("game-timer-mmssms").textContent = gameSplit.mm + ":" + gameSplit.ss + "." + gameSplit.ms;
  document.getElementById("shot-clock-mmssms").textContent = shotSplit.mm + ":" + shotSplit.ss + "." + shotSplit.ms;
  document.getElementById("half-court-clock-mmssms").textContent = halfCourtSplit.mm + ":" + halfCourtSplit.ss + "." + halfCourtSplit.ms;
  checkHalfCourtAudio();
  checkShotClockAudio();
  if (reconfiguring && shotSplit.ms == "00" && shotSplit.ss != "00") {
    playBuffer(preBeepBuffer);
  } else if (gameStarted && Math.floor(gameTime2 % 60) <= 3 && gameSplit.mm == "00" && gameSplit.ms == "00" && gameSplit.ss != "00") {
    playBuffer(preBeepBuffer);
  } else if (gameStarted && gameSplit.mm == "00" && gameSplit.ms == "00" && gameSplit.ss == "00") {
    playBuffer(beepBuffer);
  } else if (Math.floor(shotClock2 % 60) <= 3 && shotSplit.ms == "00" && shotSplit.ss != "00") {
    playBuffer(preBeepBuffer);
  } else if (!passedHalfCourt && Math.floor(halfCourt2 % 60) <= 3 && halfCourtSplit.ms == "00" && halfCourtSplit.ss != "00") {
    playBuffer(preBeepBuffer);
  }
}
function updateToggleGameButton() {
  const btn = document.getElementById("toggle-game");
  if (!btn) return;
  btn.textContent = gameStarted ? "Stop Game" : "Start Game";
  btn.classList.toggle("bg-green-500", !gameStarted);
  btn.classList.toggle("hover:bg-green-600", !gameStarted);
  btn.classList.toggle("bg-red-500", gameStarted);
  btn.classList.toggle("hover:bg-red-600", gameStarted);
}
function updateToggleShotButton() {
  const btn = document.getElementById("toggle-shot");
  if (!btn) return;
  btn.textContent = shotClockRunning ? "Stop Shot Clock" : "Start Shot Clock";
  btn.classList.toggle("bg-blue-500", !shotClockRunning);
  btn.classList.toggle("hover:bg-blue-600", !shotClockRunning);
  btn.classList.toggle("bg-red-500", shotClockRunning);
  btn.classList.toggle("hover:bg-red-600", shotClockRunning);
}
function renderMatchHistory() {
  const history = getMatchHistory();
  const tbody = document.getElementById("match-history");
  const latestRecord = history[history.length - 1];
  sendMatchRecordToServer(latestRecord);
  tbody.innerHTML = "";
  history.forEach((record) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-gray-700";
    tr.innerHTML = `
      <td class="p-2">${new Date(record.timestamp).toLocaleString()}</td>
      <td class="p-2">${record.redTeamName}</td>
      <td class="p-2">${record.redScore}</td>
      <td class="p-2">${record.blueTeamName}</td>
      <td class="p-2">${record.blueScore}</td>
      <td class="p-2">${record.timeUsed || ""}</td>
      <td class="p-2">${record.endedBy || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}
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
  updateHalfCourtStatus();
  setShotClockLabel("Reconfiguration:");
  resetShotClock();
  setShotClock(10);
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
      setShotClockLabel("Shot Clock:");
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
function lockGameDuration(lock) {
  const select = document.getElementById("game-duration");
  if (lock) {
    select.setAttribute("disabled", "disabled");
    select.classList.add("disabled");
  } else {
    select.removeAttribute("disabled");
    select.classList.remove("disabled");
  }
}
function updateHalfCourtStatus() {
  const el = document.getElementById("half-court-status");
  if (el) {
    el.textContent = passedHalfCourt ? "Half Court: PASSED" : "Half Court: NOT PASSED";
    el.style.color = passedHalfCourt ? "limegreen" : "red";
  }
}
document.addEventListener("keydown", (e) => {
  if (e.key === "e") {
    passedHalfCourt = true;
    updateHalfCourtStatus();
  }
  if (e.key === "E") {
    passedHalfCourt = false;
    updateHalfCourtStatus();
  }
});
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("button[data-team]").forEach((button) => {
    button.addEventListener("click", () => {
      const team = button.getAttribute("data-team");
      const points = parseInt(button.getAttribute("data-points"));
      addScore(team, points);
      document.getElementById(`${team}-score`).textContent = getScores()[team].toString();
      startReconfiguration();
    });
  });
  document.getElementById("game-duration").addEventListener("change", (e) => {
    const duration = parseInt(e.target.value);
    setGameDuration(duration);
    initialGameDuration2 = duration;
    updateTimers();
  });
  document.getElementById("red-team-name").addEventListener("change", (e) => {
    const name = e.target.value;
    setTeamName("red", name);
    const { redTeamName: redTeamName2, blueTeamName: blueTeamName2 } = getTeamNames();
    document.getElementById("red-team-title").textContent = redTeamName2;
    document.getElementById("blue-team-title").textContent = blueTeamName2;
    document.getElementById("blue-team-name").value = blueTeamName2;
  });
  document.getElementById("blue-team-name").addEventListener("change", (e) => {
    const name = e.target.value;
    setTeamName("blue", name);
    const { redTeamName: redTeamName2, blueTeamName: blueTeamName2 } = getTeamNames();
    document.getElementById("red-team-title").textContent = redTeamName2;
    document.getElementById("blue-team-title").textContent = blueTeamName2;
    document.getElementById("red-team-name").value = redTeamName2;
  });
  const toggleGameBtn = document.getElementById("toggle-game");
  updateToggleGameButton();
  toggleGameBtn.addEventListener("click", () => {
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
  const toggleShotBtn = document.getElementById("toggle-shot");
  updateToggleShotButton();
  toggleShotBtn.addEventListener("click", () => {
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
  ["start-game", "stop-game", "start-shot", "stop-shot"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  document.getElementById("reset-game").addEventListener("click", () => {
    resetGame();
    gameStarted = false;
    shotClockRunning = false;
    passedHalfCourt = false;
    updateHalfCourtStatus();
    lockGameDuration(false);
    document.getElementById("red-score").textContent = "0";
    document.getElementById("blue-score").textContent = "0";
    updateTimers();
    const { redTeamName: redTeamName2, blueTeamName: blueTeamName2 } = getTeamNames();
    document.getElementById("red-team-title").textContent = redTeamName2;
    document.getElementById("blue-team-title").textContent = blueTeamName2;
    document.getElementById("red-team-name").value = redTeamName2;
    document.getElementById("blue-team-name").value = blueTeamName2;
    clearAllIntervals();
    renderMatchHistory();
    updateToggleGameButton();
  });
  document.getElementById("reset-shot").addEventListener("click", () => {
    resetShotClock();
    passedHalfCourt = false;
    updateHalfCourtStatus();
    updateTimers();
  });
  document.getElementById("clear-history").addEventListener("click", () => {
    clearMatchHistory();
    document.getElementById("match-history").innerHTML = "";
  });
  updateTimers();
  updateToggleGameButton();
  updateToggleShotButton();
  renderMatchHistory();
  updateHalfCourtStatus();
});
function sendMatchRecordToServer(record) {
  fetch("/api/match-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  });
}
function unlockAudio() {
  whistleBuffer.play().then(() => whistleBuffer.pause());
  shotclockBuffer.play().then(() => shotclockBuffer.pause());
  preBeepBuffer.play().then(() => preBeepBuffer.pause());
  beepBuffer.play().then(() => beepBuffer.pause());
  window.removeEventListener("click", unlockAudio);
}
window.addEventListener("click", unlockAudio);
