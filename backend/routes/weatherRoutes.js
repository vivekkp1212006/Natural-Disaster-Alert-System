const express = require('express');
const router= express.Router();

const {getFloodRisk} = require('../controllers/weatherController');

router.get('/flood-risk',getFloodRisk);

module.exports = router;