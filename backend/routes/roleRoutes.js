const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { requestRoleUpgrade } = require('../controllers/authController');

// @route   POST /api/roles/request
// @desc    Request role upgrade
// @access  Private (User)
router.post(
  '/request',
  protect,
  authorizeRoles(['user']),
  requestRoleUpgrade
);

module.exports = router;
