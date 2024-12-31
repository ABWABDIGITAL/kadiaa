const asyncHandler = require("express-async-handler");
const Case = require("../models/caseModel");
const Appointment = require("../models/appointmentModel"); // Ensure this is correctly imported
const ApiError = require("../utils/ApiError");
const mongoose = require('mongoose');
const { formatSuccessResponse } = require("../utils/responseFormatter");
const { uploadMultipleFiles } = require('../middleware/fileUploadMiddleware.js');

// Define the fields for file uploads
const uploadCaseFiles = uploadMultipleFiles([
  { name: 'powerOfAttorney', maxCount: 1 },
  { name: 'caseFiles', maxCount: 10 }
]);

// Utility function to remove sensitive fields
const sanitizeUser = (user) => {
  if (!user) return null;
  const sanitizedUser = user.toObject();
  delete sanitizedUser.__v;
  delete sanitizedUser.password;
  delete sanitizedUser.verified;
  delete sanitizedUser.otp;
  return sanitizedUser;
};

const sanitizeLawyer = (lawyer) => {
  if (!lawyer) return null;
  const sanitizedLawyer = lawyer.toObject();
  delete sanitizedLawyer.__v;
  delete sanitizedLawyer.password;
  delete sanitizedLawyer.verified;
  return sanitizedLawyer;
};

// Create a new case with file uploads
exports.createCase = [
  uploadCaseFiles,
  asyncHandler(async (req, res, next) => {
    const { title, caseType, description, status, price, location, createdAt, caseNumber, entity, nextSession, defendant, claimant, appointmentId } = req.body;

    // Validate required fields
    if (!title || !caseType || !description || !location || !caseNumber || !entity) {
      return next(new ApiError("Title, caseType, description, location, caseNumber, and entity are required", 400));
    }

    try {
      // Check if caseNumber already exists
      const existingCase = await Case.findOne({ caseNumber });
      if (existingCase) {
        return next(new ApiError("A case with this caseNumber already exists", 400));
      }

      // Handle file uploads
      const powerOfAttorneyFile = req.files['powerOfAttorney'] ? `http://91.108.102.81:5000/uploads/${req.files['powerOfAttorney'][0].filename}` : null;
      const caseFiles = req.files['caseFiles'] ? req.files['caseFiles'].map(file => `http://91.108.102.81:5000/uploads/${file.filename}`) : [];

      // Create the case
      const newCase = await Case.create({
        title,
        caseType,
        description,
        status,
        price,
        date: createdAt || Date.now(),
        location,
        createdAt,
        caseNumber,
        entity,
        nextSession,
        defendant,
        claimant,
        powerOfAttorney: powerOfAttorneyFile,
        caseFiles,
        appointmentId
      });

      // Populate the created case with user, lawyer, and appointment details
      const populatedCase = await Case.findById(newCase._id)
        .populate("user")
        .populate("lawyer")
        .populate("appointmentId");

      // Check if populatedCase or any of its fields are null
      if (!populatedCase) {
        return next(new ApiError("Case not found after creation", 404));
      }

      // Sanitize user, lawyer, and appointment details
      const sanitizedCase = {
        ...populatedCase.toObject(),
        user: sanitizeUser(populatedCase.user),
        lawyer: sanitizeLawyer(populatedCase.lawyer),
        appointment: populatedCase.appointmentId ? populatedCase.appointmentId.toObject() : null
      };

      res.status(201).json(formatSuccessResponse(sanitizedCase));
    } catch (error) {
      if (error.code && error.code === 11000) {
        // Handle duplicate key error
        return next(new ApiError("Duplicate case number detected", 400));
      }
      console.error("Error creating case:", error);
      return next(new ApiError("Server error", 500));
    }
  })
];

// Update a case with file uploads
exports.updateCase = [
  uploadCaseFiles,
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    // Handle file uploads
    if (req.files) {
      updates.powerOfAttorney = req.files['powerOfAttorney'] ? `http://localhost:5000/uploads/${req.files['powerOfAttorney'][0].filename}` : updates.powerOfAttorney;
      updates.caseFiles = req.files['caseFiles'] ? req.files['caseFiles'].map(file => `http://localhost:5000/uploads/${file.filename}`) : updates.caseFiles;
    }

    const caseData = await Case.findByIdAndUpdate(id, updates, { new: true });

    if (!caseData) {
      return next(new ApiError("Case not found", 404));
    }

    // Populate the updated case with user, lawyer, and appointment details
    const populatedCase = await Case.findById(id)
      .populate("user")
      .populate("lawyer")
      .populate("appointmentId");

    // Check if populatedCase or any of its fields are null
    if (!populatedCase) {
      return next(new ApiError("Case not found after update", 404));
    }

    // Sanitize user, lawyer, and appointment details
    const sanitizedCase = {
      ...populatedCase.toObject(),
      user: sanitizeUser(populatedCase.user),
      lawyer: sanitizeLawyer(populatedCase.lawyer),
      appointment: populatedCase.appointmentId ? populatedCase.appointmentId.toObject() : null
    };

    res.status(200).json(formatSuccessResponse(sanitizedCase));
  })
];

// Get all cases
exports.getAllCases = asyncHandler(async (req, res) => {
  const cases = await Case.find().populate("user").populate("lawyer").populate("appointmentId");

  // Sanitize user, lawyer, and appointment details
  const sanitizedCases = cases.map(caseData => ({
    ...caseData.toObject(),
    user: sanitizeUser(caseData.user),
    lawyer: sanitizeLawyer(caseData.lawyer),
    appointment: caseData.appointmentId ? caseData.appointmentId.toObject() : null
  }));

  res.status(200).json(formatSuccessResponse(sanitizedCases));
});

// Get a single case by ID
exports.getCaseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const caseData = await Case.findById(id)
    .populate("user")
    .populate("lawyer")
    .populate("appointmentId");

  if (!caseData) {
    return next(new ApiError("Case not found", 404));
  }

  // Sanitize user, lawyer, and appointment details
  const sanitizedCase = {
    ...caseData.toObject(),
    user: sanitizeUser(caseData.user),
    lawyer: sanitizeLawyer(caseData.lawyer),
    appointment: caseData.appointmentId ? caseData.appointmentId.toObject() : null
  };

  res.status(200).json(formatSuccessResponse(sanitizedCase));
});
// Get cases by caseTypeId
exports.getCasesByCaseTypeId = asyncHandler(async (req, res, next) => {
  const { caseTypeId } = req.params;

  // Validate the caseTypeId
  if (!mongoose.Types.ObjectId.isValid(caseTypeId)) {
    return next(new ApiError("Invalid caseTypeId format", 400));
  }

  try {
    // Find cases with the given caseTypeId
    const cases = await Case.find({ caseType: caseTypeId })
      .populate("user")
      .populate("lawyer")
      .populate("appointmentId");

    // If no cases found, send an empty array in the response
    if (!cases.length) {
      return res.status(200).json(formatSuccessResponse([], "No cases found for this caseTypeId"));
    }

    // Transform the cases to a simple format
    const transformedCases = cases.map(caseData => {
      // Convert each case document to a plain object
      const caseObject = caseData.toObject();

      // Sanitize user and lawyer details
      const sanitizeUser = (user) => {
        if (!user) return null;
        const { __v, password, otp, ...rest } = user.toObject ? user.toObject() : user;
        return rest;
      };

      const sanitizeLawyer = (lawyer) => {
        if (!lawyer) return null;
        const { __v, password, otp, ...rest } = lawyer.toObject ? lawyer.toObject() : lawyer;
        return rest;
      };

      // Handle appointmentId safely
      const sanitizedAppointment = caseObject.appointmentId && typeof caseObject.appointmentId === 'object'
        ? caseObject.appointmentId.toObject ? caseObject.appointmentId.toObject() : caseObject.appointmentId
        : caseObject.appointmentId;

      return {
        ...caseObject,
        user: sanitizeUser(caseObject.user),
        lawyer: sanitizeLawyer(caseObject.lawyer),
        appointment: sanitizedAppointment
      };
    });

    // Send the response
    res.status(200).json(formatSuccessResponse(transformedCases, "Cases retrieved successfully"));

  } catch (error) {
    // Log the error for debugging
    console.error("Error retrieving cases by caseTypeId:", error);

    // Pass error to the error-handling middleware
    next(new ApiError("Server error", 500));
  }
});


// Delete a case
exports.deleteCase = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const caseData = await Case.findByIdAndDelete(id);

  if (!caseData) {
    return next(new ApiError("Case not found", 404));
  }

  res.status(200).json(formatSuccessResponse({ message: "Case deleted successfully" }));
});
