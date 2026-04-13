const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getMyActiveAlerts,
  getMyAlertHistory,
  getAllAlertsForAdmin
} = require('../controllers/alertController');

router.get('/me', protect, getMyActiveAlerts);
router.get('/me/history', protect, getMyAlertHistory);
router.get('/admin/all', protect, authorizeRoles(['admin']), getAllAlertsForAdmin);

module.exports = router;
