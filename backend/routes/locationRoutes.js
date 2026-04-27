const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkNotSuspended } = require('../middleware/suspendMiddleware');
const { searchNominatim } = require('../controllers/locationController');

router.get('/search', protect, checkNotSuspended, searchNominatim);

module.exports = router;
