const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/ApiError");

// Set up storage and file filtering
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

// File filter to allow specific types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError("Invalid file type. Only JPEG, PNG, GIF, PDF, and DOCX files are allowed.", 400), false);
  }
};

// Create multer upload function for multiple files
const uploadMultipleFiles = (fields) => {
  return multer({ storage, fileFilter }).fields(fields);
};

module.exports = { uploadMultipleFiles };
