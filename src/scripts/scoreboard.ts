interface MatchRecord {
  redScore: number;
  blueScore: number;
  timestamp: string;
}

let redScore: number = 0;
let blueScore: number = 0;
let gameTime: number = 120; // Default to preliminary round (120s)
let shotClock: number = 20; // 20s per possession
let isGameRunning: boolean = false;
let isShotClockRunning: boolean = false;
let gameInterval: number | null = null;
let shotClockInterval: number | null = null;
let matchHistory: MatchRecord[] = [];

// Initialize matchHistory only in browser
if (typeof window !== 'undefined') {
  matchHistory = JSON.parse(localStorage.getItem('matchHistory') || '[]');
}

export function addScore(team: 'red' | 'blue', points: number): void {
  if (team === 'red') {
    redScore += points;
  } else {
    blueScore += points;
  }
}

export function getScores(): { red: number; blue: number } {
  return { red: redScore, blue: blueScore };
}

export function setGameDuration(seconds: number): void {
  gameTime = seconds;
}

export function getGameTime(): number {
  return gameTime;
}

export function getShotClock(): number {
  return shotClock;
}

export function startGame(): void {
  if (!isGameRunning) {
    isGameRunning = true;
    gameInterval = setInterval(() => {
      if (gameTime > 0) {
        gameTime--;
      } else {
        stopGame();
        saveMatch();
      }
    }, 1000) as unknown as number;
    startShotClock();
  }
}

export function stopGame(): void {
  if (isGameRunning) {
    isGameRunning = false;
    if (gameInterval) clearInterval(gameInterval);
    stopShotClock();
  }
}

export function resetGame(): void {
  stopGame();
  redScore = 0;
  blueScore = 0;
  gameTime = 120; // Reset to preliminary round duration
  shotClock = 20;
}

export function startShotClock(): void {
  if (!isShotClockRunning) {
    isShotClockRunning = true;
    shotClockInterval = setInterval(() => {
      if (shotClock > 0) {
        shotClock--;
      } else {
        stopShotClock();
        startShotClock(); // Reset shot clock for next possession
      }
    }, 1000) as unknown as number;
  }
}

export function stopShotClock(): void {
  if (isShotClockRunning) {
    isShotClockRunning = false;
    if (shotClockInterval) clearInterval(shotClockInterval);
    shotClock = 20; // Reset shot clock
  }
}

export function saveMatch(): void {
  const record: MatchRecord = {
    redScore,
    blueScore,
    timestamp: new Date().toISOString(),
  };
  matchHistory.push(record);
  if (typeof window !== 'undefined') {
    localStorage.setItem('matchHistory', JSON.stringify(matchHistory));
  }
}

export function getMatchHistory(): MatchRecord[] {
  return matchHistory;
}

export function clearMatchHistory(): void {
  matchHistory = [];
  if (typeof window !== 'undefined') {
    localStorage.setItem('matchHistory', '[]');
  }
}