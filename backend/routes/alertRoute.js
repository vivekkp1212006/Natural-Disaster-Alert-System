const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkNotSuspended } = require('../middleware/suspendMiddleware');
const {
  getMyActiveAlerts,
  getMyAlertHistory,
  getAllAlertsForAdmin
} = require('../controllers/alertController');

router.get('/me', protect, checkNotSuspended, getMyActiveAlerts);
router.get('/me/history', protect, checkNotSuspended, getMyAlertHistory);
router.get('/admin/all', protect, checkNotSuspended, authorizeRoles(['admin']), getAllAlertsForAdmin);

module.exports = router;
