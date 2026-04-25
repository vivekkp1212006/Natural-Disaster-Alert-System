const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
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
  getDisciplinaryActions
} = require("../controllers/volunteerController");

router.get("/camps", protect, getCamps);
router.post("/camps", protect, authorizeRoles(["admin", "camp_officer"]), createCamp);

router.post("/profiles", protect, authorizeRoles(["user"]), createVolunteerProfile);
router.get("/profiles", protect, authorizeRoles(["admin", "camp_officer"]), getVolunteers);
router.post("/profiles/:volunteerId/approve", protect, authorizeRoles(["admin", "camp_officer"]), approveVolunteer);
router.post("/profiles/:volunteerId/certify", protect, authorizeRoles(["admin", "camp_officer"]), certifyVolunteer);
router.post("/profiles/:volunteerId/team-leader", protect, authorizeRoles(["admin", "camp_officer"]), markTeamLeader);

router.post("/trainings", protect, authorizeRoles(["admin", "camp_officer"]), createTraining);
router.get("/trainings", protect, getTrainings);

router.post("/operations", protect, authorizeRoles(["admin", "camp_officer"]), createOperation);
router.get("/operations", protect, getOperations);
router.get("/operations/me", protect, authorizeRoles(["volunteer", "team_leader"]), myVolunteerOperations);
router.post("/operations/:operationId/assign/:volunteerId", protect, authorizeRoles(["admin", "camp_officer"]), assignVolunteerToOperation);

router.post("/disciplinary-actions", protect, authorizeRoles(["admin", "camp_officer"]), issueDisciplinaryAction);
router.get("/disciplinary-actions", protect, authorizeRoles(["admin", "camp_officer"]), getDisciplinaryActions);

module.exports = router;
