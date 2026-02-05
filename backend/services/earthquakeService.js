const axios = require('axios');
const calculateDistance = require('../utils/calculateDistance');
const getAlertRadius = require('../utils/getAlertRadius');

const fetchNearbyEarthquakes = async (userLat, userLng) => {
  const url =
    'https://earthquake.usgs.gov/fdsnws/event/1/query?' +
    'format=geojson&' +
    'starttime=' +
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() +
    '&minmagnitude=3';

  const response = await axios.get(url);

  const earthquakes = response.data.features.map((quake) => ({
    id: quake.id,
    place: quake.properties.place,
    magnitude: quake.properties.mag,
    time: quake.properties.time,
    latitude: quake.geometry.coordinates[1],
    longitude: quake.geometry.coordinates[0],
  }));

  
  return earthquakes.filter((quake) => {
    const radiusKm = getAlertRadius(quake.magnitude);

    // Ignore low magnitude earthquakes
    if (radiusKm === null) {
      return false;
    }

    const distance = calculateDistance(
      userLat,
      userLng,
      quake.latitude,
      quake.longitude
    );

    // Attach useful info (optional but good)
    quake.alertRadius = radiusKm;
    quake.distance = distance;

    return distance <= radiusKm;
  });
};

module.exports = { fetchNearbyEarthquakes };
