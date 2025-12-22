const { fetchNearbyEarthquakes } = require('../services/earthquakeService');

// @desc   Get nearby earthquakes
// @route  GET /api/disasters/earthquakes/nearby
// @access Public
const getNearbyEarthquakes = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: 'Latitude and longitude are required',
      });
    }

    const earthquakes = await fetchNearbyEarthquakes(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseInt(radius) : 300
    );

    res.json({
      source: 'USGS',
      count: earthquakes.length,
      earthquakes,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch nearby earthquakes',
    });
  }
};

module.exports = { getNearbyEarthquakes };
