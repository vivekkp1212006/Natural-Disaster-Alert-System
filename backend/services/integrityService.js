const Team = require('../models/Team');
const Volunteer = require('../models/volunteer');

const normalizeTeamLeaderAssignments = async () => {
  const leaders = await Volunteer.find({ teamLeader: true }).select('_id user assignedCamp').lean();

  for (const leader of leaders) {
    const leaderId = leader.user;
    if (!leaderId) continue;

    const teams = await Team.find({ leader: leaderId }).sort({ createdAt: 1 }).select('_id camp');
    if (!teams.length) continue;

    let canonicalCamp = leader.assignedCamp;
    if (!canonicalCamp) {
      canonicalCamp = teams[0].camp;
      await Volunteer.updateOne({ _id: leader._id }, { $set: { assignedCamp: canonicalCamp } });
    }

    await Team.deleteMany({
      leader: leaderId,
      camp: { $ne: canonicalCamp },
    });
  }
};

module.exports = { normalizeTeamLeaderAssignments };
