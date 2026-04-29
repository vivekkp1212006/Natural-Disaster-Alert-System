const User = require('../models/User');
const Volunteer = require('../models/volunteer');
const Camp = require('../models/camp');
const VolunteerTrainingProgress = require('../models/VolunteerTrainingProgress');
const { TRAINING_MODULE_KEYS } = require('../constants/trainingModules');
const { tryPromoteAfterTraining } = require('../services/promoteVolunteerService');

const ensureTrainingRows = async (userId) => {
  for (const key of TRAINING_MODULE_KEYS) {
    await VolunteerTrainingProgress.updateOne(
      { user: userId, moduleKey: key },
      { $setOnInsert: { user: userId, moduleKey: key, completed: false } },
      { upsert: true }
    );
  }
};

const getPendingVolunteerRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const officerCamp = await Camp.findOne({ campOfficer: req.user.id }).select('_id');
    if (!officerCamp) {
      return res.json({ page, limit, total: 0, totalPages: 0, requests: [] });
    }

    const filter = {
      role: 'user',
      requestStatus: 'pending',
      requestedRole: 'volunteer',
      volunteerRequestCamp: officerCamp._id,
    };
    if (search) {
      filter.AGS_ID = new RegExp(`^${search}`, 'i');
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter).select('-password').sort({ roleRequestedAt: -1 }).skip(skip).limit(limit);

    const payload = await Promise.all(
      users.map(async (u) => {
        await ensureTrainingRows(u._id);
        const progress = await VolunteerTrainingProgress.find({ user: u._id });
        const volunteer = await Volunteer.findOne({ user: u._id });
        return {
          user: u,
          trainingProgress: progress,
          volunteer,
        };
      })
    );

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      requests: payload,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const toggleVolunteerTrainingModule = async (req, res) => {
  try {
    const { userId, moduleKey } = req.params;
    const { completed } = req.body;

    if (!TRAINING_MODULE_KEYS.includes(moduleKey)) {
      return res.status(400).json({ message: 'Invalid training module' });
    }

    const officerCamp = await Camp.findOne({ campOfficer: req.user.id }).select('_id');
    if (!officerCamp) {
      return res.status(403).json({ message: 'Camp officer has no assigned camp' });
    }

    const user = await User.findById(userId);
    if (!user || user.requestStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending volunteer request for user' });
    }
    if (!user.volunteerRequestCamp || String(user.volunteerRequestCamp) !== String(officerCamp._id)) {
      return res.status(403).json({ message: 'Request does not belong to your camp' });
    }

    await ensureTrainingRows(user._id);

    const doc = await VolunteerTrainingProgress.findOneAndUpdate(
      { user: userId, moduleKey },
      {
        completed: Boolean(completed),
        completedAt: completed ? new Date() : null,
        markedBy: req.user.id,
      },
      { new: true }
    );

    const promotion = await tryPromoteAfterTraining(user._id, req.user.id);

    res.json({
      message: 'Training progress updated',
      progress: doc,
      promotion,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const rejectVolunteerRequestByOfficer = async (req, res) => {
  try {
    const { userId } = req.params;
    const officerCamp = await Camp.findOne({ campOfficer: req.user.id }).select('_id');
    if (!officerCamp) {
      return res.status(403).json({ message: 'Camp officer has no assigned camp' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.requestStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending request' });
    }
    if (!user.volunteerRequestCamp || String(user.volunteerRequestCamp) !== String(officerCamp._id)) {
      return res.status(403).json({ message: 'Request does not belong to your camp' });
    }

    user.requestedRole = null;
    user.requestStatus = null;
    user.roleRequestedAt = null;
    user.volunteerRequestCamp = null;
    user.volunteerRequestDistanceKm = null;
    await user.save();

    await Volunteer.findOneAndUpdate({ user: user._id }, { status: 'rejected' });

    res.json({ message: 'Volunteer request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getPendingVolunteerRequests,
  toggleVolunteerTrainingModule,
  rejectVolunteerRequestByOfficer,
  ensureTrainingRows,
};
