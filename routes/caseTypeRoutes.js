const express = require('express');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');
const { uploadSingleImage } = require('../middleware/uploadImageMiddleware'); // Import the upload function

// Import service functions
const {
  createCaseType,
  getCaseTypes,
  getCaseTypeById,
  updateCaseType,
  deleteCaseType,
} = require('../Services/caseTypeServices'); // Ensure this path is correct

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/casetype/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ApiError("Only image files are allowed!", 400), false);
  }
};

// Multer instance
const upload = multer({ storage, fileFilter });

// Route for creating a new case type
router.post('/case-types', upload.single('image'), asyncHandler(createCaseType));
router.get('/case-types', asyncHandler(getCaseTypes));

// Route for getting, updating, and deleting a specific case type by ID
router.route('/case-types/:id')
  .get(asyncHandler(getCaseTypeById))
  .patch(upload.single('image'), asyncHandler(updateCaseType))
  .delete(asyncHandler(deleteCaseType));

module.exports = router;
