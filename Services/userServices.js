const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const User = require("../models/userModel");
const ApiError = require("../utils/ApiError");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

// Function to get all users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(formatSuccessResponse(users));
  } catch (error) {
    next(new ApiError("Failed to fetch users", 500));
  }
};

// Function to get a user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError("User not found", 404));
    }
    res.status(200).json(formatSuccessResponse(user));
  } catch (error) {
    next(new ApiError("Failed to fetch user", 500));
  }
};

// Function to create a new user
exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(formatSuccessResponse(user));
  } catch (error) {
    next(new ApiError("Failed to create user", 500));
  }
};

// Function to update a user by ID
exports.updateUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
    if (!user) {
      return next(new ApiError("User not found", 404));
    }
    res.status(200).json(formatSuccessResponse(user));
  } catch (error) {
    next(new ApiError("Failed to update user", 500));
  }
};

// Function to delete a user by ID
exports.deleteUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return next(new ApiError("User not found", 404));
    }
    res.status(200).json(formatSuccessResponse({}, "User deleted successfully"));
  } catch (error) {
    next(new ApiError("Failed to delete user", 500));
  }
};

// Function to change user password
exports.changeUserPassword = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
    const user = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
    if (!user) {
      return next(new ApiError("User not found", 404));
    }
    res.status(200).json(formatSuccessResponse(user, "Password updated successfully"));
  } catch (error) {
    next(new ApiError("Failed to change password", 500));
  }
};

// Middleware to get logged-in user data
exports.getLoggedUserData = async (req, res, next) => {
  try {
    const user = req.user; // Assuming req.user is populated by middleware

    // Prepare user data with desired fields
    const formattedUserData = {
      username: user.username,
      verified: user.verified,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      refreshToken: user.refreshToken,
      profileImage: user.profileImage,
    };

    // Respond with formatted data
    res.status(200).json(formatSuccessResponse(formattedUserData));
  } catch (error) {
    console.error("Error fetching logged-in user:", error);
    next(new ApiError("Failed to fetch logged-in user", 500));
  }
};
// Function to update logged-in user's password
// Function to update the logged-in user's password
exports.updateLoggedUserPassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate that all required fields are provided
    if (!oldPassword || !newPassword || !confirmPassword) {
      return next(new ApiError("All fields are required", 400));
    }

    // Validate that the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return next(new ApiError("New password and confirm password do not match", 400));
    }

    // Find the user by ID
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return next(new ApiError("User not found", 404));
    }

    // Check if the old password is correct
    //const isMatch = await user.comparePassword(oldPassword);
   // if (!isMatch) {
    //  return next(new ApiError("Old password is incorrect", 400));
   // }

    // Update the password
    user.password = newPassword;
    await user.save();

    res.status(200).json(formatSuccessResponse({}, "Password updated successfully"));
  } catch (error) {
    console.error("Failed to update password:", error);
    next(new ApiError("Failed to update password", 500));
  }
};


// Function to update logged-in user's data
exports.updateLoggedUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const user = await exports.updateUserById(userId, updateData);
    res.status(200).json(formatSuccessResponse(user));
  } catch (error) {
    next(new ApiError("Failed to update user data", 500));
  }
};

// Function to delete logged-in user's data
exports.deleteLoggedUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await exports.deleteUserById(userId);
    res.status(200).json(formatSuccessResponse({}, "User deleted successfully"));
  } catch (error) {
    next(new ApiError("Failed to delete user", 500));
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
    return res.status(400).json(formatErrorResponse(400, formattedErrors, "Validation failed"));
  }
  next();
};
