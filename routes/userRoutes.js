const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel"); // Import User model

const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedUserValidator,
} = require("../Validator/userValidator");

const {
  getUsers,
  createUser,
  updateUserById,
  deleteUserById,
  changeUserPassword,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  deleteLoggedUserData,
  getUserById, // Import getUserById function from userServices
} = require("../Services/userServices");

const authService = require("../Services/authServices");
const { protect, allowedTo } = require("../Services/authServices");

// Multer storage configuration for user profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/user/")); // Destination folder for profile images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename for each uploaded image
  },
});

// File upload restrictions
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

// Middleware to upload user image
const uploadUserImage = upload.single("profileImage");

router.post(
  "/profile/image",
  protect,
  // allowedTo("user", "admin", "manager"), // Adjust as necessary
  uploadUserImage, // Middleware to handle image upload
  asyncHandler(async (req, res, next) => {
    const { userId } = req.body;

    if (!userId) {
      // Delete uploaded file if user ID is missing
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(400)
        .json(formatErrorResponse(400, [{ message: "User ID is required" }]));
    }

    // Ensure the userId matches the userId from the token
    if (userId !== req.userIdFromToken) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(403)
        .json(formatErrorResponse(403, [{ message: "Invalid user ID" }]));
    }

    const user = await User.findById(userId);

    if (!user) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(404)
        .json(formatErrorResponse(404, { message: "User not found" }));
    }

    if (!req.file) {
      return res
        .status(400)
        .json(formatErrorResponse(400, [{ message: "No file uploaded" }]));
    }

    user.profileImage = req.file.path;
    await user.save();

    const serverIp = "91.108.102.81"; // Replace this with your actual server IP address
    const formattedProfileImage = `http://${serverIp}/${path.basename(
      user.profileImage
    )}`;

    const responseData = {
      username: user.username,
      verified: user.verified,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      refreshToken: user.refreshToken,
      profileImage: formattedProfileImage,
    };

    res.json(
      formatSuccessResponse(responseData, "Profile image uploaded successfully")
    );
  })
);

// User profile route
router.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    try {
      let profile = req.user || req.lawyer;

      // Log profile information
      console.log("Profile:", profile);

      // Check if profile is valid
      if (!profile || !profile._id) {
        return res.status(400).json({ message: "Invalid profile ID in token" });
      }

      // Prepare the response data
      const responseData = {
        _id: profile._id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        phone: profile.phone, // Added phone
        profilePicture: profile.profileImage, // Added profilePicture
        contact: profile.contact, // Added contact
      };

      res.json({
        success: true,
        message: "Profile successfully fetched",
        data: responseData,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the profile" });
    }
  })
);
// Route to update user profile
router.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    try {
      let profile = req.user; // Updating user profile

      // Check if profile is valid
      if (!profile || !profile._id) {
        return res.status(400).json({ message: "Invalid profile ID in token" });
      }

      // Extract fields to update from the request body
      const { username, email, phone, profileImage, contact } = req.body;

      // Update the user's profile fields
      profile.username = username || profile.username;
      profile.email = email || profile.email;
      profile.phone = phone || profile.phone;
      profile.profileImage = profileImage || profile.profileImage;
      profile.contact = contact || profile.contact;

      // Save the updated profile
      const updatedProfile = await profile.save();

      // Prepare the response data
      const responseData = {
        _id: updatedProfile._id,
        username: updatedProfile.username,
        email: updatedProfile.email,
        role: updatedProfile.role,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
        phone: updatedProfile.phone,
        profilePicture: updatedProfile.profileImage,
        contact: updatedProfile.contact,
      };

      res.json({
        success: true,
        message: "Profile successfully updated",
        data: responseData,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res
        .status(500)
        .json({ message: "An error occurred while updating the profile" });
    }
  })
);


router.put("/changeMyPassword", protect,updateLoggedUserPassword);
router.put("/updateMe", updateLoggedUserValidator, updateLoggedUserData);
router.delete("/deleteMe", deleteLoggedUserData);

// Change password with OTP (for all roles)
router.put(
  "/changePassword/:id",
  changeUserPasswordValidator,
  changeUserPassword
);

// CRUD operations (for admin and manager roles)
router.use(authService.allowedTo("user", "admin", "manager"));
router.route("/").get(getUsers).post(createUserValidator, createUser);
router
  .route("/:id")
  .get(getUserValidator, asyncHandler(getUserById))
  .put(updateUserValidator, asyncHandler(updateUserById))
  .delete(deleteUserValidator, asyncHandler(deleteUserById));

module.exports = router;
