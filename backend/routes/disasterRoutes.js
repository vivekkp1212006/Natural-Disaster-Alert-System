const express = require('express');
const router = express.Router();

const { getNearbyEarthquakes } = require('../controllers/disasterController');


// Public disaster data
router.get('/earthquakes/nearby', getNearbyEarthquakes);

module.exports = router;
