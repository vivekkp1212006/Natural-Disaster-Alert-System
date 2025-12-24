const { fetchNearbyEarthquakes } = require('../services/earthquakeService');
const getEarthquakeRiskLevel = require('../utils/getEarthquakeRiskLevel');
const calculateDistance = require('../utils/calculateDistance');
const User = require('../models/User');
const Alert = require('../models/Alert');

const runAlertChecks = async () => {
  console.log("Running alert checks for all users...");

  try {
    const users = await User.find();
    for(const user of users)
    {
        console.log("Checking alerts for user:", user._id);
        const lat = user.location?.lat;
        const lng = user.location?.lng;

        if (typeof lat !== 'number' || typeof lng !== 'number') 
        {
          console.log("Skipping user (no valid location):", user._id);
          continue;
        }
        try {
          

         const earthquakes = await fetchNearbyEarthquakes(lat, lng);

          if (earthquakes.length === 0) {
            console.log("No earthquakes for user", user._id);
            continue;
          }

          console.log(
            `Found ${earthquakes.length} earthquakes for user`,
            user._id
          );

          for (const quake of earthquakes) {
          try {
            const distance = calculateDistance(
              lat,
              lng,
              quake.latitude,
              quake.longitude
            );

            const riskLevel = getEarthquakeRiskLevel(
              quake.magnitude,
              distance
            );

            if (riskLevel === null) {
              console.log(
                `No earthquake risk (${quake.magnitude}) at ${distance.toFixed(1)}km for user`,
                user._id
              );
              continue;
            }

            const existingAlert = await Alert.findOne({
              user: user._id,
              type: 'earthquake',
              referenceId: quake.id,
            });

            if (existingAlert) {
              console.log(
                "Earthquake alert already exists for quake",
                quake.id,
                "for user",
                user._id
              );
              continue;
            }

            await Alert.create({
              user: user._id,
              type: 'earthquake',
              referenceId: quake.id,
              riskLevel,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });

            console.log(
              `New ${riskLevel} earthquake alert created for quake`,
              quake.id,
              "for user",
              user._id
            );

          } catch (err) {
            console.error(
              "Error while creating earthquake alert for quake",
              quake.id,
              ":",
              err.message
            );
          }
        }
        } catch (err) {
          console.error(
            "Earthquake check failed for user:",
            user._id,
            err.message
          );
        }

        console.log("User has location:", user.location);
    }
    console.log("Number of users found:", users.length);
  } catch (error) {
    console.error("Error while fetching users:", error.message);
  }
};

module.exports = { runAlertChecks };
