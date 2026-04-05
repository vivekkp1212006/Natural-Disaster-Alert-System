const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
dotenv.config();
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const disasterRoutes = require('./routes/disasterRoutes');
const weatherRoutes= require('./routes/weatherRoutes');
const alertRoutes = require('./routes/alertRoute');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();
require('./cron/alertCron');


app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/weather',weatherRoutes);
app.use('/api/alerts', alertRoutes);

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