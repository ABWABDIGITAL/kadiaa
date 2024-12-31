const express = require('express');
const router = express.Router();
const { getAllLocations } = require('../Services/locationServices'); // Adjust the path to your controller

// Route to get all locations
router.get('/locations', getAllLocations);

module.exports = router;
