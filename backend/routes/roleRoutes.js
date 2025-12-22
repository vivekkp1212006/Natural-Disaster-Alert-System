const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { requestRoleUpgrade, getPendingRoleRequests, approveRoleRequest, rejectRoleRequest } = require('../controllers/authController');

// @route   POST /api/roles/request
// @desc    Request role upgrade
// @access  Private (User)
router.post(
  '/request',
  protect,
  authorizeRoles(['user']),
  requestRoleUpgrade
);

// @route   GET /api/roles/pending
// @desc    View all pending role requests
// @access  Private (Admin)
router.get(
  '/pending',
  protect,
  authorizeRoles(['admin']),
  getPendingRoleRequests
);

// @route   POST /api/roles/approve/:userId
// @desc    Approve role request
// @access  Private (Admin)
router.post(
  '/approve/:userId',
  protect,
  authorizeRoles(['admin']),
  approveRoleRequest
);

// @route   POST /api/roles/reject/:userId
// @desc    Reject role request
// @access  Private (Admin)
router.post(
  '/reject/:userId',
  protect,
  authorizeRoles(['admin']),
  rejectRoleRequest
);


module.exports = router;
