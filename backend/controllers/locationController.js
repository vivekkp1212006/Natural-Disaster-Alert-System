const { searchLocations } = require('../services/nominatimService');

const searchNominatim = async (req, res) => {
  try {
    const q = req.query.q || '';
    const results = await searchLocations(String(q));
    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Location search failed', error: error.message });
  }
};

module.exports = { searchNominatim };
