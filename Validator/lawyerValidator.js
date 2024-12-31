const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
const Lawyer = require("../models/lawyerModel");
const {
  generateAccessTokenLawyer,
  generateRefreshTokenLawyer,
} = require("../utils/createToken");
const { sendEmail } = require("../utils/sendEmail");
const ApiError = require("../utils/ApiError");
const { formatSuccessResponse } = require("../utils/responseFormatter");
const mongoose = require("mongoose");

exports.signupAndSendOtp = async (req, res, next) => {
  const { nameLawyer, phone, password } = req.body;

  // Validate the fields
  if (!nameLawyer || !phone || !password) {
    return next(new ApiError(req.__("allFieldsRequiredLawyer"), 400));
  }

  try {
    // Check if phone already exists
    const existingLawyer = await Lawyer.findOne({ phone });
    if (existingLawyer) {
      return next(new ApiError(req.__("lawyerExists"), 400));
    }

    // Create a new lawyer object
    const newLawyer = new Lawyer({
      nameLawyer,
      phone,
      password,
    });

    // Save the new lawyer document
    await newLawyer.save();

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCase: false,
      specialChars: false,
    });

    // Save OTP and expiry time
    newLawyer.otp = otp;
    newLawyer.otpExpires = Date.now() + 3600000 * 2; // OTP expires in 2 hours
    await newLawyer.save();

    // Log OTP (in real app, send via SMS)
    console.log(`OTP for phone ${phone}: ${otp}`);

    // Prepare response
    const lawyerData = {
      username: newLawyer.nameLawyer,
      phone: newLawyer.phone,
    };

    res.status(201).json(
      formatSuccessResponse(lawyerData, req.__("lawyerRegisteredOtpSent"))
    );
  } catch (error) {
    console.error("Signup error:", error);
    next(new ApiError(req.__("serverErrorLawyer"), 500));
  }
};


exports.login = async (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new ApiError(req.__("phonePasswordRequiredLawyer"), 400));
  }

  try {
    const lawyer = await Lawyer.findOne({ phone });
    if (!lawyer) {
      return next(new ApiError(req.__("incorrectPhonePassword"), 401));
    }

    console.log('Submitted plain password:', password);
    console.log('Stored hashed password:', lawyer.password);

    const isPasswordValid = await bcrypt.compare(password, lawyer.password);
    console.log('Password match result:', isPasswordValid);

    if (!isPasswordValid) {
      return next(new ApiError(req.__("incorrectEmailPasswordLawyer"), 401));
    }

    const accessToken = generateAccessTokenLawyer(lawyer);
    const refreshToken = generateRefreshTokenLawyer(lawyer);
    lawyer.refreshToken = refreshToken;
    await lawyer.save();

    res
      .status(200)
      .json(
        formatSuccessResponse(
          { accessToken, refreshToken },
          req.__("loginSuccessLawyer")
        )
      );
  } catch (error) {
    console.error("Login error:", error);
    next(new ApiError(req.__("serverErrorLawyer"), 500));
  }
};

const sanitizeLawyer = (lawyer) => {
  const sanitized = lawyer.toObject();
  delete sanitized.password;
  delete sanitized.refreshToken;
  delete sanitized.otp;
  delete sanitized.otpExpires;
  delete sanitized.createdAt;
  delete sanitized.updatedAt;
  delete sanitized.__v;
  return sanitized;
};

exports.verifyOtp = async (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return next(new ApiError(req.__("phoneOtpRequired"), 400));
  }

  try {
    const lawyer = await Lawyer.findOne({ phone });
    if (!lawyer) {
      return next(new ApiError(req.__("lawyerNotFound"), 404));
    }

    if (otp !== "1111") {
      return next(new ApiError(req.__("invalidOtp"), 400));
    }

    lawyer.verified = true;
    lawyer.otp = undefined;
    lawyer.otpExpires = undefined;

    const accessToken = generateAccessTokenLawyer(lawyer);
    const refreshToken = generateRefreshTokenLawyer(lawyer);
    lawyer.refreshToken = refreshToken;
    await lawyer.save();

    res
      .status(200)
      .json(
        formatSuccessResponse(
          { lawyer: sanitizeLawyer(lawyer), accessToken, refreshToken },
          req.__("otpVerified")
        )
      );
  } catch (error) {
    console.error("Verify OTP error:", error);
    next(new ApiError(req.__("serverError"), 500));
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  const { phone } = req.body;

  // Validate the input
  if (!phone) {
    return next(new ApiError(req.__("phoneRequiredLawyer"), 400));
  }

  try {
    // Find the lawyer by phone number
    const lawyer = await Lawyer.findOne({ phone });
    if (!lawyer) {
      return next(new ApiError(req.__("incorrectPhoneLawyer"), 400));
    }

    // Use a fixed OTP
    const otp = "1111";

    // Save the OTP and its expiration time
    lawyer.resetPasswordToken = otp; // Store OTP as the token
    lawyer.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await lawyer.save();

    // Log the OTP for debugging purposes (optional)
    console.log(`OTP for phone ${phone}: ${otp}`);

    // Respond with success
    res
      .status(200)
      .json(formatSuccessResponse(null, req.__("passwordResetSentOtpLawyer")));
  } catch (error) {
    console.error("Error in password reset:", error);
    next(new ApiError(req.__("serverErrorLawyer"), 500));
  }
};
exports.verifyOtpForPasswordReset = async (req, res, next) => {
  const { phone, otp } = req.body;

  // Validate input
  if (!phone || !otp) {
    return next(new ApiError(req.__("phoneOtpRequired"), 400));
  }

  try {
    // Find the lawyer by phone number
    const lawyer = await Lawyer.findOne({ phone });
    if (!lawyer) {
      return next(new ApiError(req.__("lawyerNotFound"), 404));
    }

    // Validate OTP and expiration
    if (lawyer.resetPasswordToken !== otp) {
      return next(new ApiError(req.__("invalidOtp"), 400));
    }

    if (Date.now() > lawyer.resetPasswordExpires) {
      return next(new ApiError(req.__("otpExpired"), 400));
    }

    // OTP verified successfully; allow password reset
    lawyer.resetPasswordToken = null;
    lawyer.resetPasswordExpires = null;
    await lawyer.save();

    res
      .status(200)
      .json(
        formatSuccessResponse(
          null,
          req.__("otpVerifiedForPasswordReset")
        )
      );
  } catch (error) {
    console.error("Error verifying OTP for password reset:", error);
    next(new ApiError(req.__("serverError"), 500));
  }
};


exports.resetPassword = async (req, res, next) => {
  const { password } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(req.__("invalidToken"), 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const lawyerId = decoded.userId;

    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return next(new ApiError(req.__("incorrectEmailPasswordLawyer"), 404));
    }

    if (password.length < 8) {
      return next(new ApiError(req.__("passwordResetErrorLawyer"), 400));
    }

    console.log("Old hashed password in DB:", lawyer.password);

    // Update the password (plain password assigned; pre-save hook hashes it)
    lawyer.password = password;

    // Save the updated lawyer object
    await lawyer.save();

    console.log("New hashed password in DB:", lawyer.password);

    res.status(200).json({
      success: true,
      message: req.__("passwordResetSuccessLawyer"),
      data: null,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(req.__("tokenExpired"), 400));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(req.__("invalidToken"), 400));
    }
    console.error("Reset password error:", error);
    next(new ApiError(req.__("serverErrorLawyer"), 500));
  }
};




exports.refreshToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(req.__("invalidToken"), 401));
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return next(new ApiError(req.__("tokenExpired"), 401));
      }
      return next(new ApiError(req.__("invalidToken"), 403));
    }

    const lawyerId = decoded.id;
    const lawyer = await Lawyer.findById(lawyerId);

    if (!lawyer) {
      return next(new ApiError(req.__("incorrectEmailPasswordLawyer"), 404));
    }

    const accessToken = generateAccessTokenLawyer(lawyer);

    res
      .status(200)
      .json(
        formatSuccessResponse({ accessToken }, req.__("loginSuccessLawyer"))
      );
  });
};

exports.addNotification = async (lawyerId, message, req) => {
  try {
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      throw new Error(req.__("lawyerNotFound"));
    }

    const notification = { message };
    lawyer.notifications.push(notification);
    await lawyer.save();

    return notification;
  } catch (error) {
    throw error;
  }
};
