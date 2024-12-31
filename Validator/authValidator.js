const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
const User = require("../models/userModel");
const {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
} = require("../utils/createToken");
const i18n = require('i18n');
const { sendEmail } = require("../utils/sendEmail");
const ApiError = require("../utils/ApiError");
const sendSms = require("../utils/sendSms.js");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

exports.signupAndSendOtp = async (req, res, next) => {
  const { username, phone, password } = req.body;

  if (!username || !phone || !password) {
    return next(new ApiError(req.__("allFieldsRequired"), 400));
  }

  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return next(new ApiError(req.__("userExists"), 400));
    }

    const newUser = new User({
      username,
      phone,
      password,
    });

    const otp = "123456"; // Replace with dynamic OTP generation in production

    newUser.otp = otp;
    newUser.otpExpires = Date.now() + 3600000 * 2; // OTP expires in 2 hours

    await newUser.save();

    await sendEmail(
      newUser.email,
      req.__("emailSubjectVerification"),
      req.__("emailBodyVerification", { otp, hours: 2 })
    );

    const userData = {
      username: newUser.username,
      phone: newUser.phone,
    };

    res
      .status(201)
      .json(
        formatSuccessResponse(
          userData,
          req.__("userRegisteredOtpSent")
        )
      );
  } catch (error) {
    console.error("Signup error:", error);
    next(new ApiError(req.__("serverError"), 500));
  }
};

exports.login = async (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new ApiError(req.__("phonePasswordRequired"), 400));
  }

  try {
    const user = await User.findOne({ phone }).select("+password");

    if (!user || !user.password) {
      return next(new ApiError(req.__("invalidPhoneOrPassword"), 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return next(new ApiError(req.__("invalidPhoneOrPassword"), 401));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    const sanitizedUser = sanitizeUser(user);

    res
      .status(200)
      .json(
        formatSuccessResponse(
          { user: sanitizedUser, accessToken, refreshToken },
          req.__("loginSuccessful")
        )
      );
  } catch (error) {
    console.error("Login error:", error);
    next(new ApiError(req.__("serverError"), 500));
  }
};

const sanitizeUser = (user) => {
  const sanitized = user.toObject();
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
    const user = await User.findOne({ phone });
    if (!user) {
      return next(new ApiError(req.__("userNotFound"), 404));
    }

    if (otp !== "1111") {
      return next(new ApiError(req.__("invalidOtp"), 400));
    }

    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json(
      formatSuccessResponse(
        { user: sanitizeUser(user), accessToken, refreshToken },
        req.__("otpVerified")
      )
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    next(new ApiError(req.__("serverError"), 500));
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError(req.__("emailRequired"), 400));
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(req.__("userNotFound"), 404));
    }

    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendEmail(
      user.email,
      req.__("emailSubjectPasswordReset"),
      req.__("emailBodyPasswordReset", { token: resetToken })
    );

    res
      .status(200)
      .json(
        formatSuccessResponse(null, req.__("passwordResetTokenSent"))
      );
  } catch (error) {
    console.error("Error during password reset request:", error);
    next(new ApiError(req.__("serverError"), 500));
  }
};

exports.resetPassword = async (req, res, next) => {
  const { password } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token || !password) {
    return next(new ApiError(req.__("tokenPasswordRequired"), 400));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError(req.__("invalidExpiredToken"), 400));
    }

    if (password.length < 8) {
      return next(new ApiError(req.__("passwordTooShort"), 400));
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json(formatSuccessResponse(null, req.__("passwordResetSuccessful")));
  } catch (error) {
    console.error("Error during password reset:", error);

    if (error.name === "TokenExpiredError") {
      return next(new ApiError(req.__("tokenExpired"), 400));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(req.__("invalidToken"), 400));
    }

    next(new ApiError(req.__("serverError"), 500));
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(formatErrorResponse(req.__("invalidAuthorizationHeader"), 401));
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            return res
              .status(401)
              .json(formatErrorResponse(req.__("refreshTokenExpired"), 401));
          }
          return res
            .status(403)
            .json(formatErrorResponse(req.__("invalidRefreshToken"), 403));
        }

        try {
          const user = await User.findById(decoded.userId);
          if (!user) {
            return res
              .status(404)
              .json(formatErrorResponse(req.__("userNotFound"), 404));
          }

          const accessToken = generateAccessToken(user);

          res
            .status(200)
            .json(
              formatSuccessResponse(
                { accessToken },
                req.__("tokenRefreshedSuccessfully")
              )
            );
        } catch (userError) {
          console.error("Error finding user:", userError);
          res
            .status(500)
            .json(formatErrorResponse(req.__("serverError"), 500));
        }
      }
    );
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json(formatErrorResponse(req.__("serverError"), 500));
  }
};

exports.allowedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(req.__("noPermission"), 403));
    }
    next();
  };
};
