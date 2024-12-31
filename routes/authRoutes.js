const express = require("express");
const passport = require("passport");
const { check } = require("express-validator");
const axios = require("axios");
const User = require("../models/userModel");
const { v4: uuidv4 } = require("uuid");
//const ApiError = require("../utils/ApiError");
const { generateAccessToken, generateRefreshToken } = require("../utils/createToken");



const {
  signupAndSendOtp,
  login,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  verifyOtp,
} = require("../Validator/authValidator"); // Ensure the path is correct
const ApiError = require("../utils/ApiError");
const validatorMiddleware = require("../middleware/validatorMiddleware");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

const router = express.Router();

// Validation rules
const signupValidationRules = [
  check("username").notEmpty().withMessage("Username is required"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("email").isEmail().withMessage("Valid email is required"),
];

const loginValidationRules = [
  check("email").isEmail().withMessage("Valid email is required"),
  check("password").notEmpty().withMessage("Password is required"),
];

const requestPasswordResetValidationRules = [
  check("email").isEmail().withMessage("Valid email is required"),
];

const resetPasswordValidationRules = [
  check("token").notEmpty().withMessage("Token is required"),
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const verifyOtpValidationRules = [
  check("email").isEmail().withMessage("Valid email is required"),
  check("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 characters long"),
];

router.post(
  "/signupAndSendOtp",
  signupValidationRules,
  validatorMiddleware,
  async (req, res, next) => {
    console.log("Request Body:", req.body); // Log the request body
    try {
      const data = await signupAndSendOtp(req, res, next);
      if (data) {
        return res
          .status(201)
          .json(
            formatSuccessResponse(
              data,
              "User registered successfully and OTP sent"
            )
          );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(formatErrorResponse(error.message, error.statusCode));
      } else {
        console.error("Unexpected error:", error);
        return next(new ApiError("Server error", 500));
      }
    }
  }
);

router.post(
  "/login",
  loginValidationRules,
  validatorMiddleware,
  async (req, res, next) => {
    try {
      const data = await login(req, res, next);
      if (!res.headersSent) {
        return res.status(200).json(formatSuccessResponse(data, "Login successful"));
      } else {
        console.warn("Headers already sent for /login");
      }
    } catch (error) {
      if (!res.headersSent) {
        if (error instanceof ApiError) {
          return res.status(error.statusCode).json(formatErrorResponse(error.message, error.statusCode));
        } else {
          console.error("Unexpected error:", error);
          return res.status(500).json(formatErrorResponse("Server error", 500));
        }
      } else {
        console.error("Headers already sent, cannot send error response:", error);
      }
    }
  }
);

router.post(
  "/request-password-reset",
  requestPasswordResetValidationRules,
  validatorMiddleware,
  async (req, res, next) => {
    try {
      const data = await requestPasswordReset(req, res, next);
      if (!res.headersSent) {
        res
          .status(200)
          .json(
            formatSuccessResponse(data, "Password reset request successful")
          );
      }
    } catch (error) {
      if (!res.headersSent) {
        if (error instanceof ApiError) {
          res
            .status(error.statusCode)
            .json(formatErrorResponse(error.message, error.statusCode));
        } else {
          console.error("Unexpected error:", error);
          next(new ApiError("Server error", 500));
        }
      } else {
        console.error("Error after headers sent:", error);
      }
    }
  }
);
router.post(
  "/reset-password",
  resetPasswordValidationRules,
  validatorMiddleware,
  async (req, res, next) => {
    try {
      const data = await resetPassword(req, res, next);
      
      // Send success response only if headers are not already sent
      if (!res.headersSent) {
        return res.status(200).json(
          formatSuccessResponse(data, "Password reset successful")
        );
      }
    } catch (error) {
      // Check if headers have already been sent before sending an error response
      if (!res.headersSent) {
        if (error instanceof ApiError) {
          return res.status(error.statusCode).json(
            formatErrorResponse(error.message, error.statusCode)
          );
        } else {
          console.error("Unexpected error:", error);
          return next(new ApiError("Server error", 500));
        }
      } else {
        console.error("Error after headers sent:", error);
      }
    }
  }
);



router.post("/refresh-token", async (req, res, next) => {
  try {
    const data = await refreshToken(req, res, next);
    return res
      .status(200)
      .json(formatSuccessResponse(data, "Token refreshed successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json(formatErrorResponse(error.message, error.statusCode));
    } else {
      console.error("Unexpected error:", error);
      return next(new ApiError("Server error", 500));
    }
  }
});

router.post(
  "/verify-otp",
  verifyOtpValidationRules,
  validatorMiddleware,
  async (req, res, next) => {
    try {
      const data = await verifyOtp(req, res, next);
      return res
        .status(200)
        .json(formatSuccessResponse(data, "OTP verified successfully"));
    } catch (error) {
      if (error instanceof ApiError) {
        return res
          .status(error.statusCode)
          .json(formatErrorResponse(error.message, error.statusCode));
      } else {
        console.error("Unexpected error:", error);
        return next(new ApiError("Server error", 500));
      }
    }
  }
);

// Google OAuth registration and login endpoint
router.post('/register/google', async (req, res, next) => {
  const { googleId, username, email, profileImage, uuid } = req.body;

  try {
    // Check if user already exists with the given email
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, check if they already have a googleId associated
      if (!user.googleId) {
        // If not, associate the googleId with the existing user
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // If user doesn't exist, register a new user
      user = await User.create({
        googleId,
        username,
        email,
        profileImage,
        uuid: uuid || uuidv4(), // Use provided UUID or generate a new one
        role: 'user', // Assign default role (you can customize this)
        isAdmin: false, // Default admin status (you can customize this)
        active: true, // Assuming new users are active by default
      });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send response with tokens and user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          active: user.active,
        },
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return next(new ApiError('Google OAuth error', 500));
  }
});

// Facebook OAuth registration/login endpoint
router.post('/register/facebook', async (req, res, next) => {
  const { facebookId, username, email, profileImage, uuid } = req.body;

  try {
    // Check if user already exists with the given email
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, check if they already have a facebookId associated
      if (!user.facebookId) {
        // If not, associate the facebookId with the existing user
        user.facebookId = facebookId;
        await user.save();
      }
    } else {
      // If user doesn't exist, register a new user
      user = await User.create({
        facebookId,
        username,
        email,
        profileImage,
        uuid: uuid || uuidv4(), 
        role: 'user', 
        isAdmin: false, 
        active: true, 
      });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send response with tokens and user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          active: user.active,
        },
      },
    });
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return next(new ApiError('Facebook OAuth error', 500));
  }
}); 
// Apple OAuth registration/login endpoint
router.post('/register/apple', async (req, res, next) => {
  const { appleId, username, email, profileImage, uuid } = req.body;

  try {
    // Check if user already exists with the given email
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, check if they already have an appleId associated
      if (!user.appleId) {
        // If not, associate the appleId with the existing user
        user.appleId = appleId;
        await user.save();
      }
    } else {
      // If user doesn't exist, register a new user
      user = await User.create({
        appleId,
        username,
        email,
        profileImage,
        uuid: uuid || uuidv4(),
        role: 'user',
        isAdmin: false,
        active: true,
      });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send response with tokens and user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          active: user.active,
        },
      },
    });
  } catch (error) {
    console.error('Apple OAuth error:', error);
    return next(new ApiError('Apple OAuth error', 500));
  }
});
module.exports = router;
