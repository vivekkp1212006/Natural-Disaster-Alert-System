require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
const PORT = 3000;

// Connect to MongoDB Atlas (updated for latest Mongoose)
mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.DB_NAME,
})
.then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Basic route
const User = require('./models/User');

// Create a new user (POST /users)
app.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all users (GET /users)
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Keep the home route for testing
app.get('/', (req, res) => {
  res.send(`
    <h1>Express + MongoDB Atlas is Working! 🚀</h1>
    <p>Use Postman or curl to test:</p>
    <ul>
      <li>POST http://localhost:3000/users → { "name": "John", "email": "john@example.com" }</li>
      <li>GET http://localhost:3000/users → see all users</li>
    </ul>
  `);
});
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});