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

// class MatchRecordClass implements MatchRecord {
//   constructor(
//     private redScore: number,
//     private blueScore: number,
//     private redTeamName: string,
//     private blueTeamName: string,
//     private timestamp: string,
//     private timeUsed?: string,
//     private endedBy?: string
//   ) {}

//     getTimestamp(): string {
//         return this.timestamp;
//     }
// }

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMuFguQPwR7dPKRgCBjJH8PgMwGs9Bhvo",
  authDomain: "robocon-scoreboard.firebaseapp.com",
  projectId: "robocon-scoreboard",
  storageBucket: "robocon-scoreboard.firebasestorage.app",
  messagingSenderId: "203120698281",
  appId: "1:203120698281:web:53d3ff760ef34696af9ab8",
  measurementId: "G-FYCSFD8YH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// function saveMatchHistoryToDatabase(matchHistory: MatchRecord): void {
//     const db = getDatabase(app);
//     const matchHistoryRef = ref(db, 'matchHistory/' + matchHistory.);

//     set(matchHistoryRef, matchHistory)
//         .then(() => {
//             console.log('Match history saved successfully.');
//         })
//         .catch((error) => {
//             console.error('Error saving match history:', error);
//         });
// }