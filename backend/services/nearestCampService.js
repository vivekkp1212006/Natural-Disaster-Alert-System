const Camp = require('../models/camp');
const calculateDistance = require('../utils/calculateDistance');

const findNearestCamp = async (userLat, userLng) => {
  if (typeof userLat !== 'number' || typeof userLng !== 'number') {
    return null;
  }

  const camps = await Camp.find({
    lat: { $exists: true, $ne: null },
    lng: { $exists: true, $ne: null },
  });

  let best = null;
  let bestKm = Infinity;

  for (const camp of camps) {
    if (typeof camp.lat !== 'number' || typeof camp.lng !== 'number') continue;
    const km = calculateDistance(userLat, userLng, camp.lat, camp.lng);
    if (km < bestKm) {
      bestKm = km;
      best = camp;
    }
  }

  return best ? { camp: best, distanceKm: bestKm } : null;
};

module.exports = { findNearestCamp };
