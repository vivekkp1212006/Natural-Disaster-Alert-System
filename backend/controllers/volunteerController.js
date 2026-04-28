const User = require('../models/User');
const Volunteer = require('../models/volunteer');
const Camp = require('../models/camp');
const Team = require('../models/Team');
const TrainingSession = require('../models/trainingSession');
const DisasterOperation = require('../models/disasterOperation');
const DisciplinaryAction = require('../models/disciplinaryAction');
const Alert = require('../models/Alert');
const VolunteerTrainingProgress = require('../models/VolunteerTrainingProgress');
const { sendStructuredEmail } = require('../utils/sendEmail');
const { assertNotPastDate, assertNotPastDateTime, assertEndAfterStart } = require('../utils/dateValidation');
const { TRAINING_TYPES } = require('../constants/trainingTypes');
const { findNearestCamp } = require('../services/nearestCampService');
const {
  assignVolunteerToCampTeamOrReserve,
  pullVolunteerFromTeam,
  promoteFromReserveIfNeeded,
} = require('../services/teamAssignmentService');
const { computeBadge, refreshVolunteerBadge } = require('../services/rankingService');

const createCamp = async (req, res) => {
  try {
    const { name, lat, lng, campOfficerId } = req.body;
    if (!name || lat === undefined || lng === undefined || !campOfficerId) {
      return res.status(400).json({ message: 'name, lat, lng and campOfficerId are required' });
    }
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      return res.status(400).json({ message: 'lat and lng must be valid numbers' });
    }

    const officer = await User.findOne({ $or: [{ _id: campOfficerId }, { AGS_ID: campOfficerId }] });
    if (!officer || officer.role !== 'team_leader') {
      return res.status(400).json({ message: 'Camp officer must be an existing team leader' });
    }

    const camp = await Camp.create({
      name,
      lat: Number(lat),
      lng: Number(lng),
      campOfficer: campOfficerId,
    });

    officer.role = 'camp_officer';
    await officer.save();

    await Team.deleteMany({ leader: campOfficerId });

    const officerVolunteer = await Volunteer.findOne({ user: officer._id });
    if (officerVolunteer) {
      await pullVolunteerFromTeam(officerVolunteer._id);
    }

    res.status(201).json({ message: 'Camp created', camp });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCamps = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const filter = {};
    if (search) {
      const officers = await User.find({ AGS_ID: new RegExp(`^${search}`, 'i') }).select('_id');
      filter.campOfficer = { $in: officers.map((o) => o._id) };
    }

    const total = await Camp.countDocuments(filter);
    const camps = await Camp.find(filter)
      .populate('campOfficer', 'name email role AGS_ID')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ camps, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();

    const filter = {};
    if (search) {
      filter.AGS_ID = new RegExp(`^${search}`, 'i');
    }
    if (role) {
      filter.role = role;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('name email role AGS_ID location suspension createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ users, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCampOfficerVolunteers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const camp = await Camp.findOne({ campOfficer: req.user.id });
    if (!camp) {
      return res.json({ volunteers: [], page, limit, total: 0, totalPages: 0 });
    }

    const filter = { assignedCamp: camp._id };
    if (search) {
      const users = await User.find({ AGS_ID: new RegExp(`^${search}`, 'i') }).select('_id');
      filter.user = { $in: users.map((u) => u._id) };
    }

    const total = await Volunteer.countDocuments(filter);
    const volunteers = await Volunteer.find(filter)
      .populate('user', 'name email role AGS_ID')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ volunteers, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createVolunteerProfile = async (req, res) => {
  try {
    const { age, phone, address, skills, experienceYears, region, district } = req.body;
    if (!age || !phone || !address) {
      return res.status(400).json({ message: 'Age, phone and address are required' });
    }
    if (!Number.isFinite(Number(age)) || Number(age) < 16 || Number(age) > 100) {
      return res.status(400).json({ message: 'Age must be a valid number between 16 and 100' });
    }
    if (!/^\+?[0-9]{8,15}$/.test(String(phone).trim())) {
      return res.status(400).json({ message: 'Phone must contain 8-15 digits (optional + prefix)' });
    }

    const existing = await Volunteer.findOne({ user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Volunteer profile already exists' });
    }

    const volunteer = await Volunteer.create({
      user: req.user.id,
      age,
      phone,
      address,
      skills: Array.isArray(skills) ? skills : [],
      experienceYears: experienceYears || 0,
      region: region || '',
      district: district || '',
      status: 'pending',
    });

    res.status(201).json({ message: 'Volunteer profile submitted', volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getVolunteers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const filter = {};
    if (search) {
      const users = await User.find({ AGS_ID: new RegExp(`^${search}`, 'i') }).select('_id');
      filter.user = { $in: users.map((u) => u._id) };
    }

    const total = await Volunteer.countDocuments(filter);
    const volunteers = await Volunteer.find(filter)
      .populate('user', 'name email role AGS_ID')
      .populate('assignedCamp', 'name lat lng')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ volunteers, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveVolunteer = async (req, res) => {
  res.status(400).json({
    message: 'Volunteer promotion is handled through camp officer training completion',
  });
};

const createTraining = async (req, res) => {
  try {
    const { title, trainingType, camp, date, volunteerIds } = req.body;
    if (!title || !trainingType || !camp || !date) {
      return res.status(400).json({ message: 'Title, trainingType, camp and date required' });
    }
    if (!TRAINING_TYPES.includes(trainingType)) {
      return res.status(400).json({ message: 'Invalid trainingType selected' });
    }

    const dateCheck = assertNotPastDate(date, 'date');
    if (!dateCheck.ok) {
      return res.status(400).json({ message: dateCheck.message });
    }

    const training = await TrainingSession.create({
      title,
      trainingType,
      description: '',
      camp,
      date,
      campOfficer: req.user.id,
      volunteers: Array.isArray(volunteerIds) ? volunteerIds : [],
    });

    const moduleByType = {
      'Disaster Basics': 'disaster_basics',
      'First Aid': 'first_aid',
      'Evacuation Coordination': 'evacuation_coord',
    };
    const moduleKey = moduleByType[trainingType];

    const campVolunteers = await Volunteer.find({ assignedCamp: camp }).populate('user', 'name email AGS_ID');
    const pendingRequestedUsers = await User.find({
      role: 'user',
      requestedRole: 'volunteer',
      requestStatus: 'pending',
    }).select('name email location AGS_ID');
    const recipientMap = new Map();

    for (const v of campVolunteers) {
      if (!v.user) continue;
      const progress = await VolunteerTrainingProgress.findOne({ user: v.user._id, moduleKey });
      if (!progress?.completed) {
        recipientMap.set(String(v.user._id), v.user);
      }
    }

    for (const u of pendingRequestedUsers) {
      const nearest = await findNearestCamp(u.location?.lat, u.location?.lng);
      if (nearest?.camp && String(nearest.camp._id) === String(camp)) {
        recipientMap.set(String(u._id), u);
      }
    }

    for (const target of recipientMap.values()) {
      try {
        await sendStructuredEmail({
          to: target.email,
          subject: `Training scheduled: ${trainingType}`,
          greeting: `Hello ${target.name},`,
          lines: [
            `A training session "${title}" (${trainingType}) has been scheduled.`,
            `Date: ${new Date(date).toLocaleString()}`,
            `Your AGS ID: ${target.AGS_ID || 'N/A'}`,
          ],
        });
      } catch (emailError) {
        console.error('Training notification failed:', emailError.message);
      }
    }

    res.status(201).json({ message: 'Training scheduled', training });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTrainings = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const filter = {};
    if (search) {
      filter.title = new RegExp(search, 'i');
    }
    const total = await TrainingSession.countDocuments(filter);
    const trainings = await TrainingSession.find(filter)
      .populate('camp', 'name district region lat lng')
      .populate('campOfficer', 'name AGS_ID')
      .populate({ path: 'volunteers', populate: { path: 'user', select: 'name email AGS_ID' } })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ trainings, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const certifyVolunteer = async (req, res) => {
  res.status(400).json({ message: 'Certification is replaced by modular training completion' });
};

const notifyOperationVolunteers = async (operation, camp) => {
  const teams = await Team.find({ camp: camp._id }).populate({
    path: 'members',
    populate: { path: 'user', select: 'email name _id' },
  });

  const volunteerUsers = new Map();
  for (const team of teams) {
    for (const member of team.members || []) {
      if (member.user) {
        volunteerUsers.set(String(member.user._id), member.user);
      }
    }
  }

  const campDoc = await Camp.findById(camp._id);
  for (const vid of campDoc.reserveVolunteers || []) {
    const vol = await Volunteer.findById(vid).populate('user', 'email name _id');
    if (vol?.user) volunteerUsers.set(String(vol.user._id), vol.user);
  }

  const subject = `New disaster operation: ${operation.title}`;

  for (const u of volunteerUsers.values()) {
    try {
      await sendStructuredEmail({
        to: u.email,
        subject,
        greeting: `Hello ${u.name},`,
        lines: [
          `A new operation "${operation.title}" has been scheduled.`,
          `Location: ${operation.location}`,
          `Start time: ${new Date(operation.startsAt).toLocaleString()}`,
        ],
      });
    } catch (e) {
      console.error('operation email fail', e.message);
    }

    try {
      await Alert.create({
        user: u._id,
        type: 'operation',
        referenceId: `op_${operation._id}_${u._id}`,
        riskLevel: 'LOW',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    } catch (e) {
      console.error('operation alert fail', e.message);
    }
  }
};

const createOperation = async (req, res) => {
  try {
    const { title, disasterType, location, startsAt, endsAt, status, camp: campId, teamLeaderUsers } = req.body;
    if (!title || !location || !startsAt || !campId) {
      return res.status(400).json({ message: 'Title, location, startsAt and camp are required' });
    }
    if (String(title).trim().length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters' });
    }

    const startCheck = assertNotPastDateTime(startsAt, 'startsAt');
    if (!startCheck.ok) {
      return res.status(400).json({ message: startCheck.message });
    }
    if (endsAt) {
      const endCheck = assertNotPastDateTime(endsAt, 'endsAt');
      if (!endCheck.ok) {
        return res.status(400).json({ message: endCheck.message });
      }
    }
    const range = assertEndAfterStart(startsAt, endsAt);
    if (!range.ok) {
      return res.status(400).json({ message: range.message });
    }

    const camp = await Camp.findById(campId);
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }

    const leaders = Array.isArray(teamLeaderUsers) ? teamLeaderUsers : [];
    for (const leaderId of leaders) {
      const leaderUser = await User.findById(leaderId);
      const vol = await Volunteer.findOne({ user: leaderId });
      if (!leaderUser || leaderUser.role !== 'team_leader' || !vol || String(vol.assignedCamp) !== String(camp._id)) {
        return res.status(400).json({ message: 'Team leaders must belong to the selected camp' });
      }
    }

    const operation = await DisasterOperation.create({
      title,
      disasterType: disasterType || 'other',
      location,
      startsAt,
      endsAt: endsAt || null,
      status: status || 'planned',
      createdBy: req.user.id,
      camp: camp._id,
      teamLeaderUsers: leaders,
    });

    await notifyOperationVolunteers(operation, camp);

    res.status(201).json({ message: 'Operation created', operation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignVolunteerToOperation = async (req, res) => {
  try {
    const { operationId, volunteerId } = req.params;
    const operation = await DisasterOperation.findById(operationId);
    if (!operation) {
      return res.status(404).json({ message: 'Operation not found' });
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const alreadyAssigned = operation.assignedVolunteers.some((v) => String(v.volunteer) === String(volunteerId));
    if (alreadyAssigned) {
      return res.status(400).json({ message: 'Volunteer already assigned' });
    }

    operation.assignedVolunteers.push({
      volunteer: volunteerId,
      assignedBy: req.user.id,
    });
    await operation.save();

    volunteer.status = 'deployed';
    volunteer.operationsParticipatedCount = (volunteer.operationsParticipatedCount || 0) + 1;
    await volunteer.save();
    await refreshVolunteerBadge(Volunteer, volunteer._id);

    res.json({ message: 'Volunteer assigned to operation', operation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getOperations = async (req, res) => {
  try {
    const now = new Date();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const filter = {};
    if (req.user.role === 'volunteer') {
      const vol = await Volunteer.findOne({ user: req.user.id });
      if (!vol) {
        return res.json({ operations: [], page, limit, total: 0, totalPages: 0 });
      }
      filter['assignedVolunteers.volunteer'] = vol._id;
      filter.status = { $in: ['planned', 'active'] };
      filter.$or = [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }];
    } else if (req.user.role === 'camp_officer') {
      const camp = await Camp.findOne({ campOfficer: req.user.id });
      if (camp) {
        filter.camp = camp._id;
      }
    } else if (req.user.role === 'admin' && search) {
      const users = await User.find({ AGS_ID: new RegExp(`^${search}`, 'i') }).select('_id');
      const volunteers = await Volunteer.find({ user: { $in: users.map((u) => u._id) } }).select('_id');
      filter.$or = [
        { teamLeaderUsers: { $in: users.map((u) => u._id) } },
        { 'assignedVolunteers.volunteer': { $in: volunteers.map((v) => v._id) } },
      ];
    }

    const total = await DisasterOperation.countDocuments(filter);
    const operations = await DisasterOperation.find(filter)
      .populate('createdBy', 'name role')
      .populate({
        path: 'assignedVolunteers.volunteer',
        populate: { path: 'user', select: 'name email AGS_ID' },
      })
      .sort({ startsAt: 1 })
      .skip(skip)
      .limit(limit);

    res.json({ operations, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const myVolunteerOperations = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user.id });
    if (!volunteer) {
      return res.json({ operations: [] });
    }

    const now = new Date();
    const operations = await DisasterOperation.find({
      'assignedVolunteers.volunteer': volunteer._id,
      status: { $in: ['planned', 'active'] },
      $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }],
    }).sort({ startsAt: 1 });

    res.json({ operations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markTeamLeader = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const camp = await Camp.findOne({ campOfficer: req.user.id });
    if (!camp) {
      return res.status(403).json({ message: 'Only camp officers with an assigned camp can promote team leaders' });
    }

    let volunteer = await Volunteer.findById(volunteerId).populate('user');
    if (!volunteer) {
      const userByAgs = await User.findOne({ AGS_ID: volunteerId });
      if (userByAgs) {
        volunteer = await Volunteer.findOne({ user: userByAgs._id }).populate('user');
      }
    }
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    if (!volunteer.assignedCamp || String(volunteer.assignedCamp) !== String(camp._id)) {
      return res.status(400).json({ message: 'Volunteer must belong to your camp' });
    }
    if (volunteer.teamLeader || volunteer.user?.role === 'team_leader') {
      return res.status(400).json({ message: 'Volunteer is already a team leader' });
    }

    await pullVolunteerFromTeam(volunteer._id);

    volunteer.teamLeader = true;
    await volunteer.save();

    await User.findByIdAndUpdate(volunteer.user._id, { role: 'team_leader' });

    if (volunteer.assignedCamp) {
      await Team.create({
        camp: volunteer.assignedCamp,
        leader: volunteer.user._id,
        members: [],
      });
      await promoteFromReserveIfNeeded(volunteer.assignedCamp);
    }

    await refreshVolunteerBadge(Volunteer, volunteer._id);

    res.json({ message: 'Volunteer promoted as team leader', volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const issueDisciplinaryAction = async (req, res) => {
  try {
    const { volunteerId, actionType, reason, suspensionStart, suspensionEnd } = req.body;
    if (!volunteerId || !actionType || !reason) {
      return res.status(400).json({ message: 'volunteerId, actionType and reason are required' });
    }

    const volunteer = await Volunteer.findById(volunteerId).populate('user');
    if (!volunteer || !volunteer.user) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const targetRole = volunteer.user.role;
    if (!['volunteer', 'team_leader'].includes(targetRole)) {
      return res.status(400).json({ message: 'Disciplinary actions apply only to volunteers or team leaders' });
    }

    const action = await DisciplinaryAction.create({
      volunteer: volunteerId,
      actionType,
      reason,
      issuedBy: req.user.id,
      suspensionStart: actionType === 'suspension' ? suspensionStart || new Date() : null,
      suspensionEnd: actionType === 'suspension' ? suspensionEnd : null,
    });

    if (actionType === 'warning') {
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const warningCount = await DisciplinaryAction.countDocuments({
        volunteer: volunteerId,
        actionType: 'warning',
        createdAt: { $gte: yearAgo },
      });

      if (warningCount >= 3) {
        const start = new Date();
        const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        volunteer.status = 'suspended';
        await volunteer.save();

        await User.findByIdAndUpdate(volunteer.user._id, {
          suspension: {
            active: true,
            startsAt: start,
            endsAt: end,
            reason: 'Automatic suspension after 3 warnings within 12 months',
          },
        });

        await DisciplinaryAction.create({
          volunteer: volunteerId,
          actionType: 'suspension',
          reason: 'Automatic suspension after 3 warnings within 12 months',
          issuedBy: req.user.id,
          suspensionStart: start,
          suspensionEnd: end,
        });

        await sendStructuredEmail({
          to: volunteer.user.email,
          subject: 'Account suspension notice',
          greeting: `Hello ${volunteer.user.name || 'Volunteer'},`,
          lines: [
            `You have been suspended until ${end.toISOString()}.`,
            'Reason: Automatic suspension after 3 warnings within 12 months.',
          ],
        });
      }
    }

    if (actionType === 'suspension') {
      if (!suspensionEnd) {
        return res.status(400).json({ message: 'suspensionEnd is required for suspensions' });
      }
      const range = assertEndAfterStart(suspensionStart || new Date(), suspensionEnd, 'suspensionStart', 'suspensionEnd');
      if (!range.ok) {
        return res.status(400).json({ message: range.message });
      }

      volunteer.status = 'suspended';
      await volunteer.save();

      const sStart = suspensionStart ? new Date(suspensionStart) : new Date();
      const sEnd = new Date(suspensionEnd);
      await User.findByIdAndUpdate(volunteer.user._id, {
        suspension: {
          active: true,
          startsAt: sStart,
          endsAt: sEnd,
          reason,
        },
      });

      await sendStructuredEmail({
        to: volunteer.user.email,
        subject: 'Suspension notice',
        greeting: `Hello ${volunteer.user.name || 'Volunteer'},`,
        lines: [`Reason: ${reason}`, `Duration: ${sStart.toISOString()} -> ${sEnd.toISOString()}`],
      });
    }

    await refreshVolunteerBadge(Volunteer, volunteer._id);

    res.status(201).json({ message: 'Disciplinary action recorded', action });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDisciplinaryActions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const total = await DisciplinaryAction.countDocuments({});
    const actions = await DisciplinaryAction.find()
      .populate({ path: 'volunteer', populate: { path: 'user', select: 'name email role AGS_ID' } })
      .populate('issuedBy', 'name role AGS_ID')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ actions, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTeamLeaders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const userFilter = { role: 'team_leader' };
    if (search) {
      userFilter.AGS_ID = new RegExp(`^${search}`, 'i');
    }

    const users = await User.find(userFilter).select('name email role AGS_ID').skip(skip).limit(limit);
    const total = await User.countDocuments(userFilter);

    const detailed = await Promise.all(
      users.map(async (u) => {
        const vol = await Volunteer.findOne({ user: u._id }).populate('assignedCamp', 'name');
        const badge = vol ? await computeBadge(vol) : null;
        return { user: u, volunteer: vol, rankingBadge: badge };
      })
    );

    res.json({ leaders: detailed, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAdminSummary = async (req, res) => {
  try {
    const now = new Date();
    const [camps, officers, leaders, volunteers, users, ops] = await Promise.all([
      Camp.countDocuments(),
      User.countDocuments({ role: 'camp_officer' }),
      User.countDocuments({ role: 'team_leader' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'user' }),
      DisasterOperation.countDocuments({
        status: { $in: ['planned', 'active'] },
        $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }],
      }),
    ]);
    res.json({ camps, campOfficers: officers, teamLeaders: leaders, volunteers, users, liveOrUpcomingOperations: ops });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCampDetail = async (req, res) => {
  try {
    const now = new Date();
    const camp = await Camp.findById(req.params.campId).populate('campOfficer', 'name email AGS_ID');
    if (!camp) {
      return res.status(404).json({ message: 'Camp not found' });
    }
    const teams = await Team.find({ camp: camp._id }).populate({
      path: 'members',
      populate: { path: 'user', select: 'name email AGS_ID' },
    });
    await Team.populate(teams, { path: 'leader', select: 'name email AGS_ID role' });
    const volsInCamp = await Volunteer.countDocuments({ assignedCamp: camp._id });
    const trainings = await TrainingSession.countDocuments({ camp: camp._id, date: { $gte: new Date() } });
    const operations = await DisasterOperation.find({
      camp: camp._id,
      status: { $in: ['planned', 'active'] },
      $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }],
    }).sort({ startsAt: 1 });

    res.json({
      camp,
      teams,
      volunteersInCamp: volsInCamp,
      teamLeadersInCamp: teams.length,
      upcomingTrainings: trainings,
      operations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCampOfficerHomeStats = async (req, res) => {
  try {
    const camp = await Camp.findOne({ campOfficer: req.user.id });
    if (!camp) {
      return res.json({
        camp: null,
        teamLeaders: 0,
        volunteers: 0,
        scheduledTrainings: 0,
        operations: [],
      });
    }

    const teams = await Team.find({ camp: camp._id });
    const teamLeaders = teams.length;
    const volunteerCount = await Volunteer.countDocuments({ assignedCamp: camp._id });
    const scheduledTrainings = await TrainingSession.countDocuments({ camp: camp._id, date: { $gte: new Date() } });
    const operations = await DisasterOperation.find({
      camp: camp._id,
      status: { $in: ['planned', 'active'] },
    }).sort({ startsAt: 1 });

    res.json({
      camp,
      teamLeaders,
      volunteers: volunteerCount,
      scheduledTrainings,
      operations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTeamLeaderDashboard = async (req, res) => {
  try {
    const leaderUser = await User.findById(req.user.id);
    const team = await Team.findOne({ leader: leaderUser._id }).populate({
      path: 'members',
      populate: { path: 'user', select: 'name email role AGS_ID' },
    });
    const operations = await DisasterOperation.find({
      teamLeaderUsers: leaderUser._id,
      status: { $in: ['planned', 'active'] },
    }).sort({ startsAt: 1 });

    res.json({ team, operations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
  getAdminUsers,
  getCampOfficerVolunteers,
  getAdminSummary,
  getCampDetail,
  getCampOfficerHomeStats,
  getTeamLeaderDashboard,
};
