const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyActiveAlerts } = require('../controllers/alertController');

router.get('/me', protect, getMyActiveAlerts);

module.exports = router;
