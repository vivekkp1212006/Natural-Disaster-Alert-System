const { fetchRainfallForecast } = require('../services/weatherService');

const getFloodRisk = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // validate
    if (!lat || !lng) 
    {
      return res.status(400).json({
        message: 'Latitude and longitude are required',
      });
    }

    // call service
    const floodRisk = await fetchRainfallForecast(
      parseFloat(lat),
      parseFloat(lng)
    );

    // return response
    res.json(floodRisk);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getFloodRisk };
