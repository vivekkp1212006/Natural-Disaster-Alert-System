const Counter = require('../models/Counter');

const AGS_KEY = 'AGS_ID';
const AGS_PREFIX = 'AGS';
const AGS_PAD = 3;

const formatAgsId = (n) => `${AGS_PREFIX}${String(n).padStart(AGS_PAD, '0')}`;

const getNextAgsId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: AGS_KEY },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return formatAgsId(counter.seq);
};

const ensureAgsCounterFromUsers = async () => {
  const User = require('../models/User');
  const users = await User.find({ AGS_ID: { $regex: /^AGS\d+$/ } }).select('AGS_ID');
  let max = 0;
  for (const u of users) {
    const num = Number(String(u.AGS_ID).replace('AGS', ''));
    if (Number.isFinite(num) && num > max) {
      max = num;
    }
  }
  await Counter.findOneAndUpdate(
    { key: AGS_KEY },
    { $max: { seq: max } },
    { upsert: true }
  );
};

const backfillMissingAgsIds = async () => {
  const User = require('../models/User');
  await ensureAgsCounterFromUsers();
  const users = await User.find({
    $or: [{ AGS_ID: { $exists: false } }, { AGS_ID: null }, { AGS_ID: '' }],
  }).sort({ createdAt: 1, _id: 1 });

  for (const user of users) {
    user.AGS_ID = await getNextAgsId();
    await user.save();
  }
};

module.exports = {
  getNextAgsId,
  backfillMissingAgsIds,
};
