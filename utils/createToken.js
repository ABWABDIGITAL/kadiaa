const jwt = require("jsonwebtoken");
const Lawyer = require("../models/lawyerModel");
const User =require("../models/userModel")
require("dotenv").config();
// Function to generate an access token

// Function to generate an access token for users
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id?.toString(),
    username: user.username,
    role: "user",
  };
  console.log("Access Token Payload:", payload); // Debugging line
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "9d",
  });
};

// Function to generate a refresh token for users
const generateRefreshToken = (user) => {
  const payload = {
    userId: user._id?.toString(),
    username: user.username,
    role: "user",
  };
  console.log("Refresh Token Payload:", payload); // Debugging line
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

// Generate Access Token for Lawyer
// Generate access token for lawyer
const generateAccessTokenLawyer = (lawyer) => {
  const payload = {
    userId: lawyer._id,
    username: lawyer.nameLawyer || lawyer.username, // Adjust based on your schema
    role: 'lawyer',
  };
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '9d',
  });
};

// Generate refresh token for lawyer
const generateRefreshTokenLawyer = (lawyer) => {
  const payload = {
    userId: lawyer._id,
    username: lawyer.nameLawyer || lawyer.username, // Adjust based on your schema
    role: 'lawyer',
  };
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};
const generateResetToken = (user) => {
  const resetToken = jwt.sign({ userId: user._id?.toString() }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  return user.save().then(() => resetToken); // Return the token after saving
};


// Function to generate a token with custom payload
const createToken = (userId) => {
  return jwt.sign({ userID: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "24h",
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateAccessTokenLawyer,
  generateRefreshTokenLawyer,
  createToken,
  generateResetToken,
};
