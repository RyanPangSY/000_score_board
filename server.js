import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();

app.use(express.json());
app.use(express.static('dist'));

app.post('/api/match-history', (req, res) => {
  const record = req.body;
  const date = new Date(record.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
  const filename = path.join(process.cwd(), 'match_history', `${date}.csv`);
  const headers = [
    'timestamp', 'redTeamName', 'redScore', 'blueTeamName', 'blueScore', 'timeUsed', 'endedBy'
  ];
  const row = [
    record.timestamp,
    record.redTeamName,
    record.redScore,
    record.blueTeamName,
    record.blueScore,
    record.timeUsed || '',
    record.endedBy || ''
  ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');

  // Ensure directory exists
  fs.mkdirSync(path.dirname(filename), { recursive: true });

  // If file doesn't exist, write headers first
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, headers.join(',') + '\n');
  }
  fs.appendFileSync(filename, row + '\n');
  res.sendStatus(200);
});

app.listen(4321, () => console.log('Server running on port 4321'));