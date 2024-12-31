const express = require("express");
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");
const asyncHandler = require("express-async-handler");
const Lawyer = require("../models/lawyerModel");
const User = require("../models/userModel");
const lawyerController = require("../Validator/lawyerValidator");
const { protect, allowedTo } = require("../Services/authServices");
const {
  generateAccessTokenLawyer,
  generateRefreshTokenLawyer,
} = require("../utils/createToken");
const ApiError = require("../utils/ApiError");
const {updateLoggedLawyerPassword}= require("../Services/lawyerServices");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Multer storage configuration for lawyer profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/lawyer"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// File upload restrictions
const fileFilter = (req, file, cb) => {
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
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
});

// Middleware to upload lawyer image
const uploadLawyerImage = upload.single("profileImage");

// Lawyer authentication routes
router.post("/signup", lawyerController.signupAndSendOtp);
router.post("/login", lawyerController.login);
router.post("/verify-otp", lawyerController.verifyOtp);
router.post("/request-password-reset", lawyerController.requestPasswordReset);
router.post("/verify-reset-otp", lawyerController.verifyOtpForPasswordReset);

router.post("/reset-password", lawyerController.resetPassword);
router.post("/refresh-token", lawyerController.refreshToken);

router.post("/register/google", async (req, res, next) => {
  const { googleId, nameLawyer, email, profileImage, uuid } = req.body;
console.log(req.body);
  // Check for missing fields
  if (!googleId || !nameLawyer || !email) {
    return next(new ApiError("Missing required fields: googleId, nameLawyer, or email"+googleId+nameLawyer+email, 400));
  }
console.log("googleId")
  try {
    // Check if lawyer already exists with the given email
    let lawyer = await Lawyer.findOne({  googleId });

    if (lawyer) {
      // If lawyer exists, check if they already have a googleId associated
      if (!lawyer.googleId) {
        // Associate the googleId with the existing lawyer
        lawyer.googleId = googleId;
        console.log("tttt");
        await lawyer.save();
        console.log("tttt");
      }
    } else {
      console.log(",,,,")
      // If lawyer doesn't exist, register a new lawyer
      lawyer = await Lawyer.create({
        googleId,
        nameLawyer,
        email,
        profileImage,
       // uuid: uuid || uuidv4(), // Use provided UUID or generate a new one
      //  role: "lawyer",
      //  isAdmin: false,
       // active: true,
      });
    }
    console.log("kkkk")
    // Generate access and refresh tokens
    const accessTokenLawyer = generateAccessTokenLawyer(lawyer);
    const refreshTokenLawyer = generateRefreshTokenLawyer(lawyer);
    console.log("lllll");
    // Send response with tokens and lawyer data
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessTokenLawyer,
        refreshTokenLawyer,
        user: {
          id: lawyer._id,
          username: lawyer.nameLawyer,
          email: lawyer.email,
          role: lawyer.role,
          isAdmin: lawyer.isAdmin,
          active: lawyer.active,
        },
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error.message, error.stack);
    return next(new ApiError("Google OAuth error: " + error.message, 500));
  }
});


// Facebook OAuth routes
router.post("/register/facebook", async (req, res, next) => {
  const { facebookId, username, email, profileImage, uuid } = req.body;

  try {
    // Check if a lawyer already exists with the given email
    let lawyer = await Lawyer.findOne({ email });

    if (lawyer) {
      // If a lawyer exists, check if they already have a facebookId associated
      if (!lawyer.facebookId) {
        // If not, associate the facebookId with the existing lawyer
        lawyer.facebookId = facebookId;
        await lawyer.save();
      }
    } else {
      // If no lawyer exists, register a new lawyer
      lawyer = await Lawyer.create({
        facebookId,
        username,
        email,
        profileImage,
        uuid: uuid || uuidv4(), // Use provided UUID or generate a new one
        role: "lawyer", // Assign role as lawyer
        isAdmin: false, // Default admin status (can be customized)
        active: true, // Assuming new lawyers are active by default
      });
    }

    // Generate access and refresh tokens for the lawyer
    const accessTokenLawyer = generateAccessTokenLawyer(lawyer);
    const refreshTokenLawyer = generateRefreshTokenLawyer(lawyer);

    // Send response with tokens and lawyer data
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessTokenLawyer,
        refreshTokenLawyer,
        lawyer: {
          id: lawyer._id,
          username: lawyer.username,
          email: lawyer.email,
          role: lawyer.role,
          isAdmin: lawyer.isAdmin,
          active: lawyer.active,
        },
      },
    });
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    return next(new ApiError("Facebook OAuth error", 500));
  }
});
// Apple OAuth registration/login endpoint
router.post('/register/apple', async (req, res, next) => {
  const { appleId, username, email, profileImage, uuid } = req.body;

  try {
    // Check if a lawyer already exists with the given email
    let lawyer = await Lawyer.findOne({ email });

    if (lawyer) {
      // If a lawyer exists, check if they already have an appleId associated
      if (!lawyer.appleId) {
        // If not, associate the appleId with the existing lawyer
        lawyer.appleId = appleId;
        await lawyer.save();
      }
    } else {
      // If no lawyer exists, register a new lawyer
      lawyer = await Lawyer.create({
        appleId,
        username,
        email,
        profileImage,
        uuid: uuid || uuidv4(), // Use provided UUID or generate a new one
        role: "lawyer", 
        isAdmin: false, // Default admin status (can be customized)
        active: true, // Assuming new lawyers are active by default
      });
    }

    // Generate access and refresh tokens for the lawyer
    const accessTokenLawyer = generateAccessTokenLawyer(lawyer);
    const refreshTokenLawyer = generateRefreshTokenLawyer(lawyer);

    // Send response with tokens and lawyer data
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessTokenLawyer,
        refreshTokenLawyer,
        lawyer: {
          id: lawyer._id,
          username: lawyer.nameLawyer,
          email: lawyer.email,
          role: lawyer.role,
          isAdmin: lawyer.isAdmin,
          active: lawyer.active,
        },
      },
    });
  } catch (error) {
    console.error("Apple OAuth error:", error);
    return next(new ApiError("Apple OAuth error", 500));
  }
});
// Route to handle POST request to upload lawyer profile image
router.post(
  "/profile/image",
  protect,
  uploadLawyerImage, // Middleware to handle image upload
  asyncHandler(async (req, res) => {
    const { lawyerId } = req.body;

    console.log("Request body:", req.body);
    console.log("Received lawyerId:", lawyerId);
    console.log("UserId from Token:", req.userIdFromToken); // Debugging log

    // Ensure the lawyerId matches the userId from the token
    if (lawyerId !== req.userIdFromToken) {
      if (req.file) {
        fs.unlinkSync(req.file.path); // Delete the uploaded file if ID is invalid
      }
      return res
        .status(403)
        .json(formatErrorResponse(403, [{ message: "Invalid lawyer ID" }]));
    }

    const lawyer = await Lawyer.findById(lawyerId);

    if (!lawyer) {
      if (req.file) {
        fs.unlinkSync(req.file.path); // Delete the uploaded file if lawyer is not found
      }
      return res
        .status(404)
        .json(formatErrorResponse(404, [{ message: "Lawyer not found" }]));
    }

    if (!req.file) {
      return res
        .status(400)
        .json(formatErrorResponse(400, [{ message: "No file uploaded" }]));
    }

    lawyer.profileImage = req.file.path;
    await lawyer.save();

    const serverIp = "91.108.102.81"; // Replace this with your actual server IP address
    const formattedProfileImage = `http://${serverIp}/${path.basename(
      lawyer.profileImage
    )}`;

    const responseData = {
      username: lawyer.username,
      verified: lawyer.verified,
      email: lawyer.email,
      isAdmin: lawyer.isAdmin,
      role: lawyer.role,
      active: lawyer.active,
      createdAt: lawyer.createdAt,
      updatedAt: lawyer.updatedAt,
      refreshToken: lawyer.refreshToken,
      profileImage: formattedProfileImage,
    };

    res.json(
      formatSuccessResponse(responseData, "Profile image uploaded successfully")
    );
  })
);
// Route to fetch lawyer profile
// Route to fetch lawyer profile
router.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    try {
      let profile = req.user || req.lawyer;

      if (!profile || !profile._id) {
        return res.status(400).json({ message: "Invalid profile ID in token" });
      }

      // Prepare the response data with all the details
      const responseData = {
        id: profile._id,  
        username: profile.nameLawyer,
        email: profile.email,
        phone: profile.phone,
        caseId: profile.caseId,
        caseTypes: profile.caseTypes,
        expertise: profile.expertise, 
       // otp: profile.otp,
       // otpExpires: profile.otpExpires,
        verified: profile.verified,
        notifications: profile.notifications, 
        language: profile.language, 
        contact: {
          address: profile.contact.address,
          city: profile.contact.city,
          state: profile.contact.state,
          zip: profile.contact.zip,
        },
        personalData: {
          dateOfBirth: profile.personalData.dateOfBirth,
          gender: profile.personalData.gender,
          biography: profile.personalData.biography,
        },
       // createdAt: profile.createdAt, // Account creation date
        profilePicture: profile.profilePicture || null, // Profile picture or null if not exists
       // resetPasswordToken: profile.resetPasswordToken,
       // resetPasswordExpires: profile.resetPasswordExpires,
      };

      res.json(
        formatSuccessResponse(responseData, "Profile successfully fetched")
      );
    } catch (error) {
      console.error("Error fetching profile:", error);
      res
        .status(500)
        .json({ message: "An error occurred while fetching the profile" });
    }
  })
);


// Route to update lawyer profile
router.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    try {
      let profile = req.user || req.lawyer;

      if (!profile || !profile._id) {
        return res.status(400).json({ message: "Invalid profile ID in token" });
      }

      // Extract fields to update from the request body
      const { username, email, phone, profileImage, contact, caseId, caseTypes } = req.body;

      // Update the lawyer's profile fields
      profile.username = username || profile.username;
      profile.email = email || profile.email;
      profile.phone = phone || profile.phone;
      profile.profileImage = profileImage || profile.profileImage;
      profile.contact = contact || profile.contact;
      profile.caseId = caseId || profile.caseId;
      profile.caseTypes = caseTypes || profile.caseTypes;

      // Save the updated profile
      const updatedProfile = await profile.save();

      // Prepare the response data excluding sensitive fields
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
        caseId: updatedProfile.caseId,
        caseTypes: updatedProfile.caseTypes,
       // expertise: updatedProfile.expertise,
       // verified: updatedProfile.verified,
        notifications: updatedProfile.notifications,
        language: updatedProfile.language,
        personalData: updatedProfile.personalData,
      };

      res.json(
        formatSuccessResponse(responseData, "Profile successfully updated")
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      res
        .status(500)
        .json({ message: "An error occurred while updating the profile" });
    }
  })
);



// Middleware for admin and manager roles
router.use(protect, allowedTo("admin", "manager","lawyer"));


// CRUD operations (for admin and manager roles)
router
  .route("/")
  .get(asyncHandler(lawyerController.getLawyers))
  .post(asyncHandler(lawyerController.createLawyer));
  router.put("/changeMyPassword", protect,updateLoggedLawyerPassword);

module.exports = router;
