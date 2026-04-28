const { fetchNearbyEarthquakes } = require('../services/earthquakeService');
const { fetchRainfallForecast } = require('../services/weatherService');
const getEarthquakeRiskLevel = require('../utils/getEarthquakeRiskLevel');
const calculateDistance = require('../utils/calculateDistance');
const { sendStructuredEmail } = require('../utils/sendEmail');
const User = require('../models/User');
const Camp = require('../models/camp');
const Alert = require('../models/Alert');

const sendAlertMailToUser = async (user, subject, text) => {
  if (!user?.email) {
    return;
  }
  try {
    await sendStructuredEmail({
      to: user.email,
      subject,
      greeting: `Hello ${user.name || 'User'},`,
      lines: ['Action performed: Alert generated', text, `AGS ID: ${user.AGS_ID || 'N/A'}`],
    });
  } catch (error) {
    console.error("Failed to send alert email:", error.message);
  }
};

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
          } else {
            console.log(
              `Found ${earthquakes.length} earthquakes for user`,
              user._id
            );
          }

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
                continue;
              }

              const existingAlert = await Alert.findOne({
                user: user._id,
                type: 'earthquake',
                referenceId: quake.id,
              });

              if (existingAlert) {
                continue;
              }

              await Alert.create({
                user: user._id,
                type: 'earthquake',
                referenceId: quake.id,
                riskLevel,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              });

              await sendAlertMailToUser(
                user,
                "Earthquake Alert",
                `Earthquake risk: ${riskLevel}. Location: ${quake.place}. Stay cautious.`
              );

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

        // Flood alert check
        try {
          const floodData = await fetchRainfallForecast(lat, lng);
          const floodRisk = floodData?.riskLevel;

          if (!floodRisk || floodRisk === 'LOW') {
            console.log("No moderate/high flood risk for user", user._id);
          } else {
            const floodReferenceId =
              `${lat.toFixed(2)}_${lng.toFixed(2)}_${new Date().toISOString().slice(0, 13)}_${floodRisk}`;

            const existingFloodAlert = await Alert.findOne({
              user: user._id,
              type: 'flood',
              referenceId: floodReferenceId,
            });

            if (!existingFloodAlert) {
              await Alert.create({
                user: user._id,
                type: 'flood',
                referenceId: floodReferenceId,
                riskLevel: floodRisk,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              });

              await sendAlertMailToUser(
                user,
                "Flood Risk Alert",
                `Flood risk: ${floodRisk}. Expected rainfall in next 24h: ${floodData.totalRainfall} mm.`
              );

              console.log(
                `New ${floodRisk} flood alert created for user`,
                user._id
              );
            }
          }
        } catch (err) {
          console.error(
            "Flood check failed for user:",
            user._id,
            err.message
          );
        }

        console.log("User has location:", user.location);
    }

    const camps = await Camp.find({
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null },
    }).populate("campOfficer");

    for (const camp of camps) {
      const officer = camp.campOfficer;
      if (!officer || typeof camp.lat !== "number" || typeof camp.lng !== "number") {
        continue;
      }
      const lat = camp.lat;
      const lng = camp.lng;

      try {
        const earthquakes = await fetchNearbyEarthquakes(lat, lng);
        for (const quake of earthquakes) {
          try {
            const distance = calculateDistance(lat, lng, quake.latitude, quake.longitude);
            const riskLevel = getEarthquakeRiskLevel(quake.magnitude, distance);
            if (riskLevel === null) continue;

            const existingAlert = await Alert.findOne({
              user: officer._id,
              type: "earthquake",
              referenceId: `camp_${camp._id}_${quake.id}`,
            });
            if (existingAlert) continue;

            await Alert.create({
              user: officer._id,
              type: "earthquake",
              referenceId: `camp_${camp._id}_${quake.id}`,
              riskLevel,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });
            await sendAlertMailToUser(
              officer,
              "Camp Earthquake Alert",
              `Camp "${camp.name}" may be affected. Risk: ${riskLevel}. ${quake.place || ""}`
            );
          } catch (err) {
            console.error("Camp earthquake alert error", err.message);
          }
        }
      } catch (err) {
        console.error("Camp earthquake fetch failed", camp._id, err.message);
      }

      try {
        const floodData = await fetchRainfallForecast(lat, lng);
        const floodRisk = floodData?.riskLevel;
        if (floodRisk && floodRisk !== "LOW") {
          const floodReferenceId = `camp_${camp._id}_${lat.toFixed(2)}_${lng.toFixed(2)}_${new Date()
            .toISOString()
            .slice(0, 13)}_${floodRisk}`;
          const existingFloodAlert = await Alert.findOne({
            user: officer._id,
            type: "flood",
            referenceId: floodReferenceId,
          });
          if (!existingFloodAlert) {
            await Alert.create({
              user: officer._id,
              type: "flood",
              referenceId: floodReferenceId,
              riskLevel: floodRisk,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });
            await sendAlertMailToUser(
              officer,
              "Camp Flood Risk Alert",
              `Camp "${camp.name}" flood risk: ${floodRisk}. Rainfall (24h): ${floodData.totalRainfall} mm`
            );
          }
        }
      } catch (err) {
        console.error("Camp flood check failed", camp._id, err.message);
      }
    }

    console.log("Number of users found:", users.length);
  } catch (error) {
    console.error("Error while fetching users:", error.message);
  }
};

module.exports = { runAlertChecks };
