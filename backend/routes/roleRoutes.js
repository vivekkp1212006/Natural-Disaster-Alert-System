const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkNotSuspended } = require('../middleware/suspendMiddleware');
const { requestRoleUpgrade, getPendingRoleRequests, approveRoleRequest, rejectRoleRequest } = require('../controllers/authController');
const {
  getPendingVolunteerRequests,
  toggleVolunteerTrainingModule,
  rejectVolunteerRequestByOfficer,
} = require('../controllers/campOfficerRoleController');

// @route   POST /api/roles/request
// @desc    Request role upgrade
// @access  Private (User)
router.post(
  '/request',
  protect,
  checkNotSuspended,
  authorizeRoles(['user']),
  requestRoleUpgrade
);

router.get(
  '/volunteer-requests/pending',
  protect,
  checkNotSuspended,
  authorizeRoles(['camp_officer']),
  getPendingVolunteerRequests
);

router.post(
  '/volunteer-requests/:userId/training/:moduleKey',
  protect,
  checkNotSuspended,
  authorizeRoles(['camp_officer']),
  toggleVolunteerTrainingModule
);

router.post(
  '/volunteer-requests/:userId/reject',
  protect,
  checkNotSuspended,
  authorizeRoles(['camp_officer']),
  rejectVolunteerRequestByOfficer
);

// @route   GET /api/roles/pending
// @desc    View all pending role requests
// @access  Private (Admin)
router.get(
  '/pending',
  protect,
  checkNotSuspended,
  authorizeRoles(['admin']),
  getPendingRoleRequests
);

// @route   POST /api/roles/approve/:userId
// @desc    Approve role request
// @access  Private (Admin)
router.post(
  '/approve/:userId',
  protect,
  checkNotSuspended,
  authorizeRoles(['admin']),
  approveRoleRequest
);

// @route   POST /api/roles/reject/:userId
// @desc    Reject role request
// @access  Private (Admin)
router.post(
  '/reject/:userId',
  protect,
  checkNotSuspended,
  authorizeRoles(['admin']),
  rejectRoleRequest
);


module.exports = router;
