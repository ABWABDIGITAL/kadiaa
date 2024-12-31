const SpecialLawyer = require('../models/PannerModel');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Get all special lawyers
const getSpecialLawyers = async (req, res, next) => {
  try {
    const specialLawyers = await SpecialLawyer.find();
    res.status(200).json(formatSuccessResponse(specialLawyers));
  } catch (error) {
    next(error);
  }
};

// Add a new special lawyer
const addSpecialLawyer = async (req, res, next) => {
  try {
    const { title, link, description } = req.body;
    const newSpecialLawyer = new SpecialLawyer({
      title,
      link,
      description,
    });
    await newSpecialLawyer.save();
    res.status(201).json(formatSuccessResponse(newSpecialLawyer, "Special lawyer added successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSpecialLawyers,
  addSpecialLawyer,
};
