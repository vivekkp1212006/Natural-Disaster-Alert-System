const User = require('../models/User');

const checkNotSuspended = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('suspension');
    if (!user) {
      return next();
    }

    const s = user.suspension;
    if (s && s.active && s.endsAt && new Date(s.endsAt) > new Date()) {
      return res.status(403).json({
        message: `Account suspended until ${new Date(s.endsAt).toISOString()}. Reason: ${s.reason || 'policy violation'}`,
      });
    }

    if (s && s.active && s.endsAt && new Date(s.endsAt) <= new Date()) {
      user.suspension.active = false;
      await user.save();
    }

    next();
  } catch (e) {
    next(e);
  }
};

module.exports = { checkNotSuspended };
