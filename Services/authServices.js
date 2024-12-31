const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");
const User = require("../models/userModel");
const Lawyer = require("../models/lawyerModel");
const { promisify } = require("util");
const mongoose = require("mongoose");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

// @desc    Signup
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ApiError("All fields are required", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError("User already exists", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = createToken({ userId: user._id });

  res.status(201).json({ data: user, token });
});

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError("Email and password are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new ApiError("Incorrect email or password", 401));
  }

  const token = createToken({ userId: user._id });
  res.status(200).json({ data: user, token });
});

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "You are not logged in! Please log in to get access.",
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded Token:", decoded);

    if (!decoded.userId) {
      console.log("Decoded token does not contain userId:", decoded);
      return res.status(400).json({ message: "Invalid user ID in token" });
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      console.log("Invalid ObjectId:", decoded.userId);
      return res.status(400).json({ message: "Invalid user ID in token" });
    }

    let profile;
    if (decoded.role === "user") {
      try {
        profile = await User.findById(decoded.userId);
        if (!profile) {
          console.log("User not found for ID:", decoded.userId);
          return res.status(404).json({
            message: "The user belonging to this token no longer exists.",
          });
        }
        req.user = profile;
        req.user.role = "user"; // Ensure role is set
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Error fetching user profile" });
      }
    } else if (decoded.role === "lawyer") {
      try {
        profile = await Lawyer.findById(decoded.userId);
        if (!profile) {
          console.log("Lawyer not found for ID:", decoded.userId);
          return res.status(404).json({
            message: "The lawyer belonging to this token no longer exists.",
          });
        }
        req.lawyer = profile;
        req.lawyer.role = "lawyer"; // Ensure role is set
      } catch (error) {
        console.error("Error fetching lawyer profile:", error);
        return res.status(500).json({ message: "Error fetching lawyer profile" });
      }
    } else {
      return res.status(400).json({ message: "Invalid role in token" });
    }

    req.userIdFromToken = decoded.userId;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Invalid token or token expired" });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000)?.toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.passwordResetCode = hashedResetCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Reset code invalid or expired", 400));
  }

  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({ status: "Success" });
});

// @desc    Reset password
// @route   POST /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError("Invalid or expired token", 400));
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    next(new ApiError("Server error", 500));
  }
};

exports.allowedTo = (...roles) => {
  return (req, res, next) => {
    console.log("Allowed Roles:", roles); // Log allowed roles
    console.log("User Role:", req.user?.role); // Log user's role
    console.log("Lawyer Role:", req.lawyer?.role); // Log lawyer's role
    console.log("User:", req.user); // Log user object
    console.log("Lawyer:", req.lawyer); // Log lawyer object

    // Check if user or lawyer is authenticated
    if (!req.user && !req.lawyer) {
      return res
        .status(401)
        .json(formatErrorResponse(401, "User not authenticated"));
    }

    // Check if user's or lawyer's role is among the allowed roles
    if (
      (req.user && roles.includes(req.user.role)) ||
      (req.lawyer && roles.includes(req.lawyer.role))
      
    ) {
      return next();
    }

    return res
      .status(403)
      .json(
        formatErrorResponse(
          403,
          "You do not have permission to perform this action"
        )
      );
  };
};

