const Alert = require('../models/Alert');

// GET /api/alerts/me — active alerts only (not expired yet)
const getMyActiveAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const filter = {
      user: userId,
      expiresAt: { $gt: now },
    };

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET /api/alerts/me/history — all alerts (including expired)
const getMyAlertHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const alerts = await Alert.find({ user: userId }).sort({ createdAt: -1 });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET /api/alerts/admin/all — admin alert monitoring
const getAllAlertsForAdmin = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = { getMyActiveAlerts, getMyAlertHistory, getAllAlertsForAdmin };
