interface MatchRecord {
  redScore: number;
  blueScore: number;
  redTeamName: string;
  blueTeamName: string;
  timestamp: string;
  timeUsed?: string;
  endedBy?: string;

  getTimestamp(): string;
}

class MatchRecordClass implements MatchRecord {
  constructor(
    public redScore: number,
    public blueScore: number,
    public redTeamName: string,
    public blueTeamName: string,
    public timestamp: string,
    public timeUsed?: string,
    public endedBy?: string
  ) {}

    getTimestamp(): string {
        return this.timestamp;
    }
}

let redScore: number = 0;
let blueScore: number = 0;
let gameTime: number = 120; // Default to preliminary round (120s)
let shotClock: number = 20; // 20s per possession
let halfCourt: number = 8;
let redTeamName: string = 'Lebron James'; // Default team name
let blueTeamName: string = 'Michael Jordan'; // Default team name
let isGameRunning: boolean = false;
let isShotClockRunning: boolean = false;
let gameInterval: number | null = null;
let shotClockInterval: number | null = null;
let matchHistory: MatchRecord[] = [];

// Initialize matchHistory only in browser
if (typeof window !== 'undefined') {
  matchHistory = JSON.parse(localStorage.getItem('matchHistory') || '[]');
}

let initialGameDuration: number = 120;
let gameStartTimestamp: number | null = null;

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
  initialGameDuration = seconds;
}

export function getGameTime(): number {
  return gameTime;
}

export function getShotClock(): number {
  return shotClock;
}

export function getHalfCourt(): number {
  return halfCourt;
}

export function getTeamNames(): { redTeamName: string; blueTeamName: string } {
  return { redTeamName, blueTeamName };
}

export function setTeamName(team: 'red' | 'blue', name: string): void {
  if (team === 'red') {
    redTeamName = name;
    blueTeamName = name === 'Lebron James' ? 'Michael Jordan' : 'Lebron James';
  } else {
    blueTeamName = name;
    redTeamName = name === 'Lebron James' ? 'Michael Jordan' : 'Lebron James';
  }
}

export function startGame(): void {
  if (!isGameRunning) {
    isGameRunning = true;
    if (!gameStartTimestamp) gameStartTimestamp = Date.now();
    // Prevent multiple intervals
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      if (gameTime > 0) {
        gameTime = Math.max(0, gameTime - 0.01); // Decrement by 10ms
      } else {
        stopGame();
        saveMatch('timer');
      }
    }, 10) as unknown as number;
    startShotClock();
  }
}

export function stopGame(): void {
  if (isGameRunning) {
    isGameRunning = false;
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
    stopShotClock();
  }
}

export function resetGame(): void {
  stopGame();
  saveMatch('reset');
  redScore = 0;
  blueScore = 0;
  gameTime = initialGameDuration;
  shotClock = 20;
  halfCourt = 8; // Reset halfCourt to default
  // redTeamName = 'Lebron James';
  // blueTeamName = 'Michael Jordan';
  gameStartTimestamp = null;
}

// Prevent multiple shot clock intervals
export function startShotClock(): void {
  if (!isShotClockRunning) {
    isShotClockRunning = true;
    if (shotClockInterval) clearInterval(shotClockInterval);
    shotClockInterval = setInterval(() => {
      if (shotClock > 0) {
        shotClock = Math.max(0, shotClock - 0.01); // Decrement by 10ms
        halfCourt = Math.max(0, shotClock - 12); // Update halfCourt based on shotClock
        // if (halfCourt == 0 && !clockTriggered) {
          
        //   clockTriggered = true; // Reset clockTriggered when halfCourt reaches 0
        // }
      } else {
        stopShotClock();
        // Do NOT reset or restart shot clock automatically here
      }
    }, 10) as unknown as number;
  }
}

export function stopShotClock(): void {
  if (isShotClockRunning) {
    isShotClockRunning = false;
    if (shotClockInterval) {
      clearInterval(shotClockInterval);
      shotClockInterval = null;
    }
    // Do NOT reset shotClock here
  }
}

export function resetShotClock(): void {
  shotClock = 20;
  halfCourt = 8; // Reset halfCourt to default
}

// Allow direct shotClock override for reconfiguration
export function setShotClock(seconds: number): void {
  shotClock = seconds;
}

export function saveMatch(endedBy?: string): void {
  if (!gameStartTimestamp) return;
  let timeUsed = '';
  if (endedBy === 'timer') {
    timeUsed = `${initialGameDuration}s`;
  } else if (endedBy === 'reset') {
    const used = Math.round((Date.now() - gameStartTimestamp) / 10) / 100;
    timeUsed = `${used}s`;
  }
  const record: MatchRecord = {
    redScore,
    blueScore,
    redTeamName,
    blueTeamName,
    timestamp: new Date().toISOString(),
    timeUsed,
    endedBy,
    getTimestamp: function (): string {
      throw new Error("Function not implemented.");
    }
  };
  matchHistory.push(record);
  if (typeof window !== 'undefined') {
    localStorage.setItem('matchHistory', JSON.stringify(matchHistory));
  }
  gameStartTimestamp = null;
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