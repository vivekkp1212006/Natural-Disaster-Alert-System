const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkNotSuspended } = require('../middleware/suspendMiddleware');
const {
  createCamp,
  getCamps,
  createVolunteerProfile,
  getVolunteers,
  approveVolunteer,
  createTraining,
  getTrainings,
  certifyVolunteer,
  createOperation,
  assignVolunteerToOperation,
  getOperations,
  myVolunteerOperations,
  markTeamLeader,
  issueDisciplinaryAction,
  getDisciplinaryActions,
  getTeamLeaders,
  getCampOfficerTeamLeaders,
  getAdminUsers,
  getCampOfficerVolunteers,
  getAdminSummary,
  getCampDetail,
  getCampOfficerHomeStats,
  getTeamLeaderDashboard,
} = require('../controllers/volunteerController');

router.get('/camps', protect, checkNotSuspended, getCamps);
router.post('/camps', protect, checkNotSuspended, authorizeRoles(['admin']), createCamp);

router.post('/profiles', protect, checkNotSuspended, authorizeRoles(['user']), createVolunteerProfile);
router.get('/profiles', protect, checkNotSuspended, authorizeRoles(['admin', 'camp_officer']), getVolunteers);
router.post('/profiles/:volunteerId/approve', protect, checkNotSuspended, authorizeRoles(['camp_officer']), approveVolunteer);
router.post('/profiles/:volunteerId/certify', protect, checkNotSuspended, authorizeRoles(['camp_officer']), certifyVolunteer);
router.post('/profiles/:volunteerId/team-leader', protect, checkNotSuspended, authorizeRoles(['camp_officer']), markTeamLeader);

router.post('/trainings', protect, checkNotSuspended, authorizeRoles(['camp_officer']), createTraining);
router.get('/trainings', protect, checkNotSuspended, getTrainings);

router.post('/operations', protect, checkNotSuspended, authorizeRoles(['camp_officer']), createOperation);
router.get('/operations', protect, checkNotSuspended, getOperations);
router.get('/operations/me', protect, checkNotSuspended, authorizeRoles(['volunteer', 'team_leader']), myVolunteerOperations);
router.post(
  '/operations/:operationId/assign/:volunteerId',
  protect,
  checkNotSuspended,
  authorizeRoles(['camp_officer']),
  assignVolunteerToOperation
);

router.post('/disciplinary-actions', protect, checkNotSuspended, authorizeRoles(['camp_officer']), issueDisciplinaryAction);
router.get('/disciplinary-actions', protect, checkNotSuspended, authorizeRoles(['camp_officer']), getDisciplinaryActions);

router.get(
  '/team-leaders',
  protect,
  checkNotSuspended,
  authorizeRoles(['camp_officer', 'admin']),
  getTeamLeaders
);
router.get('/camp-officer/team-leaders', protect, checkNotSuspended, authorizeRoles(['camp_officer']), getCampOfficerTeamLeaders);
router.get('/admin/summary', protect, checkNotSuspended, authorizeRoles(['admin']), getAdminSummary);
router.get('/admin/users', protect, checkNotSuspended, authorizeRoles(['admin']), getAdminUsers);
router.get('/camps/:campId/detail', protect, checkNotSuspended, authorizeRoles(['admin']), getCampDetail);
router.get('/camp-officer/home-stats', protect, checkNotSuspended, authorizeRoles(['camp_officer']), getCampOfficerHomeStats);
router.get('/camp-officer/volunteers', protect, checkNotSuspended, authorizeRoles(['camp_officer']), getCampOfficerVolunteers);
router.get('/team-leader/dashboard', protect, checkNotSuspended, authorizeRoles(['team_leader']), getTeamLeaderDashboard);

module.exports = router;
