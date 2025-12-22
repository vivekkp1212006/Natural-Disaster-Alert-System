const axios = require('axios');

const fetchRainfallForecast = async (lat, lng) => {
  const url =
    'https://api.openweathermap.org/data/2.5/forecast?' +
    `lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;

  // For now, just return the raw data

  const response = await axios.get(url);

  // 2. Get forecast list (3-hour intervals)
  const forecastList = response.data.list;

 // 3. Take next 24 hours (8 intervals)

  const next24Hours = forecastList.slice(0,8);

  // 4. Sum rainfall in mm

  const totalRainfall = next24Hours.reduce((sum, item) => {
    const rain = item.rain?.['3h'] || 0;
    return sum + rain;
  }, 0);


  // 5. Decide risk level based on total rainfall

  let riskLevel;

  if (totalRainfall < 50) 
  {
    riskLevel = 'LOW';
  } 
  else if (totalRainfall <= 150) 
  {
    riskLevel = 'MODERATE';
  } 
  else 
  {
    riskLevel = 'HIGH';
  }

  // 6. Return totalRainfall and riskLevel

  return {
    totalRainfall,
    riskLevel,
  };
};

module.exports = { fetchRainfallForecast };
