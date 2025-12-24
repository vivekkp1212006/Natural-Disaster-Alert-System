const getAlertRadius = require('./getAlertRadius');

const getEarthquakeRiskLevel = (magnitude, distanceKm) => {
  if (
    typeof magnitude !== 'number' ||
    typeof distanceKm !== 'number' ||
    distanceKm < 0
  ) {
    return null;
  }

  const radius = getAlertRadius(magnitude);
  if (radius === null) return null;

  const distancePercentage = (distanceKm / radius) * 100;

  if (distancePercentage <= 30) return 'HIGH';
  if (distancePercentage <= 60) return 'MODERATE';
  if (distancePercentage <= 100) return 'LOW';

  return null;
};

module.exports = getEarthquakeRiskLevel;
