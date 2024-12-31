const mongoose = require("mongoose");
const Case = require("../models/caseModel");
const User = require("../models/userModel");
const Lawyer = require("../models/lawyerModel");
const ApiError = require("../utils/ApiError");

// Function to validate ObjectID format
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Function to create a new case with user and lawyer details populated
exports.createCase = async (caseData) => {
  try {
    // Create a new case record
    const newCase = new Case(caseData);

    // Save the case and populate the user and lawyer fields
    const savedCase = await newCase
      .save()
      .then((savedDoc) =>
        savedDoc.populate("user.populate")(lawyer.execPopulate()
      ));

    return savedCase;
  } catch (error) {
    // Handle error if case creation fails
    throw new ApiError("Error creating case", 500);
  }
};

// Function to retrieve all cases with user and lawyer details populated
exports.getAllCases = async () => {
  return await Case.find().populate("user").populate("lawyer");
};

// Function to retrieve a case by its ID with user and lawyer details populated
exports.getCaseById = async (id) => {
  try {
    // Validate the ID format
    if (!isValidObjectId(id)) {
      throw new ApiError("Invalid case ID", 400);
    }

    // Fetch the case and populate the user and lawyer fields
    const caseData = await Case.findById(id)
      .populate("user")
      .populate("lawyer");

    if (!caseData) {
      throw new ApiError("Case not found", 404);
    }

    return caseData;
  } catch (error) {
    // Handle errors appropriately
    if (error.name === "CastError") {
      throw new ApiError("Invalid case ID", 400);
    } else {
      throw new ApiError("Error retrieving case", 500);
    }
  }
};

// Function to update a case by its ID with user and lawyer details populated
exports.updateCase = async (id, updates) => {
  try {
    // Validate the ID format
    if (!isValidObjectId(id)) {
      throw new ApiError("Invalid case ID", 400);
    }

    // Update the case and populate the user and lawyer fields
    const updatedCase = await Case.findByIdAndUpdate(id, updates, { new: true })
      .populate("user")
      .populate("lawyer");

    if (!updatedCase) {
      throw new ApiError("Case not found", 404);
    }

    return updatedCase;
  } catch (error) {
    // Handle errors appropriately
    if (error.name === "CastError") {
      throw new ApiError("Invalid case ID", 400);
    } else {
      throw new ApiError("Error updating case", 500);
    }
  }
};

// Function to delete a case by its ID with user and lawyer details populated
exports.deleteCase = async (id) => {
  try {
    // Validate the ID format
    if (!isValidObjectId(id)) {
      throw new ApiError("Invalid case ID", 400);
    }

    // Delete the case and populate the user and lawyer fields
    const deletedCase = await Case.findByIdAndDelete(id)
      .populate("user")
      .populate("lawyer");

    if (!deletedCase) {
      throw new ApiError("Case not found", 404);
    }

    return deletedCase;
  } catch (error) {
    // Handle errors appropriately
    if (error.name === "CastError") {
      throw new ApiError("Invalid case ID", 400);
    } else {
      throw new ApiError("Error deleting case", 500);
    }
  }
};

// Function to retrieve a user by their ID
exports.getUserById = async (user) => {
  try {
    // Validate the ID format
    if (!isValidObjectId(user)) {
      throw new ApiError("Invalid user ID", 400);
    }

    // Fetch the user details
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    return user;
  } catch (error) {
    // Handle errors appropriately
    throw new ApiError("Error retrieving user details", 500);
  }
};

// Function to retrieve a lawyer by their ID
exports.getLawyerById = async (lawyer) => {
  try {
    // Validate the ID format
    if (!isValidObjectId(lawyer)) {
      throw new ApiError("Invalid lawyer ID", 400);
    }

    // Fetch the lawyer details
    const lawyer = await Lawyer.findById(lawyer);

    if (!lawyer) {
      throw new ApiError("Lawyer not found", 404);
    }

    return lawyer;
  } catch (error) {
    // Handle errors appropriately
    throw new ApiError("Error retrieving lawyer details", 500);
  }
};
