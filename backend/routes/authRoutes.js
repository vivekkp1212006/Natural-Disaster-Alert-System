const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, adminRoute, volunteerRoute, verifyEmailOtp, forgotPassword, resetPassword } = require('../controllers/authController');
const {protect} = require('../middleware/authMiddleware');
const {authorizeRoles} = require('../middleware/roleMiddleware');
const {limit} = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', limit, verifyEmailOtp);
router.post('/forgot-password', limit, forgotPassword);
router.post('/reset-password', limit, resetPassword);

//protected routes

router.get('/profile', protect ,getProfile);

//admin only route

router.get('/admin',protect,authorizeRoles(['admin']),adminRoute);

//volanteer only route

router.get('/volunteer',protect,authorizeRoles(['volunteer']),volunteerRoute);

module.exports = router;
