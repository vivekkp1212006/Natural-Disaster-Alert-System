const Team = require('../models/Team');
const Camp = require('../models/camp');
const Volunteer = require('../models/volunteer');
const { refreshVolunteerBadge } = require('./rankingService');

const MAX_MEMBERS = 5;

const assignVolunteerToCampTeamOrReserve = async (volunteerId, campId) => {
  const volunteer = await Volunteer.findById(volunteerId);
  const camp = await Camp.findById(campId);
  if (!volunteer || !camp) return;
  if (volunteer.assignedCamp && String(volunteer.assignedCamp) !== String(camp._id)) {
    throw new Error('Volunteer is already assigned to another camp');
  }

  await Camp.updateMany({ reserveVolunteers: volunteer._id }, { $pull: { reserveVolunteers: volunteer._id } });
  await Team.updateMany({ members: volunteer._id }, { $pull: { members: volunteer._id } });

  volunteer.assignedCamp = camp._id;
  volunteer.inReserve = false;
  volunteer.team = null;

  const teams = await Team.find({ camp: camp._id });
  teams.sort((a, b) => a.members.length - b.members.length);

  for (const team of teams) {
    if (team.members.length < MAX_MEMBERS) {
      team.members.push(volunteer._id);
      await team.save();
      volunteer.team = team._id;
      await volunteer.save();
      await refreshVolunteerBadge(Volunteer, volunteer._id);
      return;
    }
  }

  camp.reserveVolunteers = camp.reserveVolunteers || [];
  if (!camp.reserveVolunteers.some((id) => String(id) === String(volunteer._id))) {
    camp.reserveVolunteers.push(volunteer._id);
  }
  await camp.save();

  volunteer.inReserve = true;
  await volunteer.save();
  await refreshVolunteerBadge(Volunteer, volunteer._id);
};

const pullVolunteerFromTeam = async (volunteerId) => {
  const volunteer = await Volunteer.findById(volunteerId);
  if (!volunteer) return;

  await Team.updateMany({ members: volunteer._id }, { $pull: { members: volunteer._id } });
  if (volunteer.assignedCamp) {
    await Camp.updateOne({ _id: volunteer.assignedCamp }, { $pull: { reserveVolunteers: volunteer._id } });
  }
  volunteer.team = null;
  volunteer.inReserve = false;
  await volunteer.save();
};

const promoteFromReserveIfNeeded = async (campId) => {
  const camp = await Camp.findById(campId);
  if (!camp || !camp.reserveVolunteers?.length) return;

  const teams = await Team.find({ camp: camp._id });
  teams.sort((a, b) => a.members.length - b.members.length);

  for (const reserveId of [...camp.reserveVolunteers]) {
    for (const team of teams) {
      if (team.members.length < MAX_MEMBERS) {
        team.members.push(reserveId);
        await team.save();
        await Volunteer.findByIdAndUpdate(reserveId, {
          team: team._id,
          inReserve: false,
          assignedCamp: camp._id,
        });
        camp.reserveVolunteers = camp.reserveVolunteers.filter((id) => String(id) !== String(reserveId));
        await camp.save();
        return;
      }
    }
  }
};

module.exports = {
  assignVolunteerToCampTeamOrReserve,
  pullVolunteerFromTeam,
  promoteFromReserveIfNeeded,
  MAX_MEMBERS,
};
