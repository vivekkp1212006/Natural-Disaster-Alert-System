const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controllers/authController');
const {protect} = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', registerUser);
router.post('/login', loginUser);

//protected routes

router.get('/profile', protect ,getProfile);

module.exports = router;
