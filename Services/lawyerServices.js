const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const Lawyer = require('../models/lawyerModel');
const ApiError = require('../utils/ApiError');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Function to get all lawyers
exports.getAllLawyers = async (req, res, next) => {
  try {
    const lawyers = await Lawyer.find();
    res.status(200).json(formatSuccessResponse(lawyers));
  } catch (error) {
    next(new ApiError('Failed to fetch lawyers', 500));
  }
};

// Function to get a lawyer by ID
exports.getLawyerById = async (req, res, next) => {
  try {
    const lawyerId = req.params.id;
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return next(new ApiError('Lawyer not found', 404));
    }
    res.status(200).json(formatSuccessResponse(lawyer));
  } catch (error) {
    next(new ApiError('Failed to fetch lawyer', 500));
  }
};

// Function to create a new lawyer
exports.createLawyer = async (req, res, next) => {
  try {
    const lawyer = await Lawyer.create(req.body);
    res.status(201).json(formatSuccessResponse(lawyer));
  } catch (error) {
    next(new ApiError('Failed to create lawyer', 500));
  }
};

// Function to update a lawyer by ID
exports.updateLawyerById = async (req, res, next) => {
  try {
    const lawyerId = req.params.id;
    const updates = req.body;
    const lawyer = await Lawyer.findByIdAndUpdate(lawyerId, updates, { new: true });
    if (!lawyer) {
      return next(new ApiError('Lawyer not found', 404));
    }
    res.status(200).json(formatSuccessResponse(lawyer));
  } catch (error) {
    next(new ApiError('Failed to update lawyer', 500));
  }
};

// Function to delete a lawyer by ID
exports.deleteLawyerById = async (req, res, next) => {
  try {
    const lawyerId = req.params.id;
    const lawyer = await Lawyer.findByIdAndDelete(lawyerId);
    if (!lawyer) {
      return next(new ApiError('Lawyer not found', 404));
    }
    res.status(200).json(formatSuccessResponse({}, 'Lawyer deleted successfully'));
  } catch (error) {
    next(new ApiError('Failed to delete lawyer', 500));
  }
};

// Function to change lawyer password
exports.changeLawyerPassword = async (req, res, next) => {
  try {
    const lawyerId = req.params.id;
    const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
    const lawyer = await Lawyer.findByIdAndUpdate(lawyerId, { password: hashedPassword }, { new: true });
    if (!lawyer) {
      return next(new ApiError('Lawyer not found', 404));
    }
    res.status(200).json(formatSuccessResponse(lawyer, 'Password updated successfully'));
  } catch (error) {
    next(new ApiError('Failed to change password', 500));
  }
};

// Middleware to get logged-in lawyer data
exports.getLoggedLawyerData = async (req, res, next) => {
  try {
    const lawyer = req.lawyer; // Assuming req.lawyer is populated by middleware

    // Prepare lawyer data with desired fields
    const formattedLawyerData = {
      nameLawyer: lawyer.nameLawyer,
      phone: lawyer.phone,
      email: lawyer.email,
      specialization: lawyer.specialization,
      verified: lawyer.verified,
      createdAt: lawyer.createdAt,
      updatedAt: lawyer.updatedAt,
      profilePicture: lawyer.profilePicture,
    };

    // Respond with formatted data
    res.status(200).json(formatSuccessResponse(formattedLawyerData));
  } catch (error) {
    console.error('Error fetching logged-in lawyer:', error);
    next(new ApiError('Failed to fetch logged-in lawyer', 500));
  }
};

// Function to update logged-in lawyer's password
exports.updateLoggedLawyerPassword = async (req, res, next) => {
  try {
    const lawyerId = req.lawyer.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate that all required fields are provided
    if (!oldPassword || !newPassword || !confirmPassword) {
      return next(new ApiError("All fields are required", 400));
    }

    // Validate that the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return next(new ApiError("New password and confirm password do not match", 400));
    }

    // Find the lawyer by ID
    const lawyer = await Lawyer.findById(lawyerId).select("+password");

    if (!lawyer) {
      return next(new ApiError("lawyer not found", 404));
    }

    // Check if the old password is correct
    //const isMatch = await user.comparePassword(oldPassword);
   // if (!isMatch) {
    //  return next(new ApiError("Old password is incorrect", 400));
   // }

    // Update the password
    lawyer.password = newPassword;
    await lawyer.save();

    res.status(200).json(formatSuccessResponse({}, "Password updated successfully"));
  } catch (error) {
    console.error("Failed to update password:", error);
    next(new ApiError("Failed to update password", 500));
  }
};

// Function to update logged-in lawyer's data
exports.updateLoggedLawyerData = async (req, res, next) => {
  try {
    const lawyerId = req.lawyer.id;
    const updateData = req.body;
    const lawyer = await exports.updateLawyerById(lawyerId, updateData);
    res.status(200).json(formatSuccessResponse(lawyer));
  } catch (error) {
    next(new ApiError('Failed to update lawyer data', 500));
  }
};

// Function to delete logged-in lawyer's data
exports.deleteLoggedLawyerData = async (req, res, next) => {
  try {
    const lawyerId = req.lawyer.id;
    await exports.deleteLawyerById(lawyerId);
    res.status(200).json(formatSuccessResponse({}, 'Lawyer deleted successfully'));
  } catch (error) {
    next(new ApiError('Failed to delete lawyer', 500));
  }
};

// Custom error handling middleware for validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      param: error.param,
      message: error.msg,
    }));
    return res.status(400).json(formatErrorResponse(400, formattedErrors, 'Validation failed'));
  }
  next();
};
