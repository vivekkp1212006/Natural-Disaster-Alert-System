const axios = require('axios');

const DEFAULT_UA =
  process.env.NOMINATIM_USER_AGENT ||
  'NaturalDisasterAlertSystem/1.0 (academic project; contact: admin@localhost)';

const searchLocations = async (query) => {
  if (!query || String(query).trim().length < 2) {
    return [];
  }

  const url = `https://nominatim.openstreetmap.org/search`;
  const response = await axios.get(url, {
    params: {
      q: query,
      format: 'json',
      limit: 8,
    },
    headers: {
      'User-Agent': DEFAULT_UA,
      Accept: 'application/json',
    },
    timeout: 15000,
  });

  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((item) => ({
    name: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
};

module.exports = { searchLocations };
