const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>🌊🔥🌪️ Multi-Hazard Disaster Alert System - Backend Running!</h1>');
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend API is LIVE and working perfectly! 🚀',
    project: 'Natural Disaster Alert System',
    team: ['Vivek', 'Sayooj'],
    date: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/api/test in browser to test`);
});