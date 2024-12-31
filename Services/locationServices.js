const Location = require('../models/locationModel'); 
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter'); // Adjust the path to your formatter

// Get all locations
exports.getAllLocations = async (req, res, next) => {
  try {
    const locations = await Location.find();
    res.status(200).json(formatSuccessResponse(locations, 'Locations retrieved successfully'));
  } catch (error) {
    console.error('Get All Locations Error:', error);
    res.status(500).json(formatErrorResponse('Server error', 500));
  }
};
