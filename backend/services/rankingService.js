const DisciplinaryAction = require('../models/disciplinaryAction');
const VolunteerTrainingProgress = require('../models/VolunteerTrainingProgress');

const computeBadge = async (volunteerDoc) => {
  if (!volunteerDoc) return 'None';

  const trainings = await VolunteerTrainingProgress.countDocuments({
    user: volunteerDoc.user,
    completed: true,
  });
  const ops = volunteerDoc.operationsParticipatedCount || 0;

  const warnings = await DisciplinaryAction.countDocuments({
    volunteer: volunteerDoc._id,
    actionType: 'warning',
  });

  let score = trainings * 4 + ops * 3;
  score -= warnings * 5;
  if (volunteerDoc.status === 'suspended') score -= 10;

  if (score >= 18) return 'Gold';
  if (score >= 10) return 'Silver';
  if (score >= 4) return 'Bronze';
  return 'None';
};

const refreshVolunteerBadge = async (Volunteer, volunteerId) => {
  const v = await Volunteer.findById(volunteerId);
  if (!v) return null;
  const badge = await computeBadge(v);
  v.rankingBadge = badge;
  await v.save();
  return badge;
};

module.exports = { computeBadge, refreshVolunteerBadge };
