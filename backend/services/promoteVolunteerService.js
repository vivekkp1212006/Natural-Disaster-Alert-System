const User = require('../models/User');
const Volunteer = require('../models/volunteer');
const VolunteerTrainingProgress = require('../models/VolunteerTrainingProgress');
const { findNearestCamp } = require('./nearestCampService');
const { assignVolunteerToCampTeamOrReserve } = require('./teamAssignmentService');
const { refreshVolunteerBadge } = require('./rankingService');

const countCompletedTrainings = async (userId) => {
  return VolunteerTrainingProgress.countDocuments({ user: userId, completed: true });
};

const tryPromoteAfterTraining = async (userId, campOfficerId) => {
  const user = await User.findById(userId);
  if (!user) return { promoted: false, message: 'User not found' };

  if (user.role !== 'user' || user.requestStatus !== 'pending') {
    return { promoted: false, message: 'No pending volunteer request' };
  }

  const completed = await countCompletedTrainings(user._id);
  if (completed < 1) {
    return { promoted: false, message: 'At least one training must be completed' };
  }

  const volunteer = await Volunteer.findOne({ user: user._id });
  if (!volunteer) {
    return { promoted: false, message: 'Volunteer enrollment missing' };
  }

  const lat = user.location?.lat;
  const lng = user.location?.lng;
  const nearest = await findNearestCamp(lat, lng);
  if (!nearest?.camp) {
    return { promoted: false, message: 'No camp available for assignment' };
  }

  user.role = 'volunteer';
  user.requestedRole = null;
  user.requestStatus = null;
  user.roleRequestedAt = null;
  await user.save();

  volunteer.status = 'approved';
  volunteer.approvedBy = campOfficerId;
  volunteer.approvedAt = new Date();
  await volunteer.save();

  await assignVolunteerToCampTeamOrReserve(volunteer._id, nearest.camp._id);
  await refreshVolunteerBadge(Volunteer, volunteer._id);

  return { promoted: true, message: 'User promoted to volunteer', camp: nearest.camp };
};

module.exports = { tryPromoteAfterTraining, countCompletedTrainings };
