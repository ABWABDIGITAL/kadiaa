const multer = require("multer");
const ApiError = require("../utils/ApiError");
const path = require("path");
const multerOptions = () => {
  try {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "uploads/"); // Uploads folder where files will be stored
      },
      filename: function (req, file, cb) {
        cb(
          null,
          file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        ); // File name will be original name with timestamp
      },
    });

    const multerFilter = function (req, file, cb) {
      try {
        cb(null, true);
      } catch (e) {
        console.error(e);
        cb(new ApiError("Error in fileFilter function", 500), false);
      }
    };

    const upload = multer({ storage: storage, fileFilter: multerFilter });

    return upload;
  } catch (e) {
    console.error(e);
    throw new ApiError("Error in multerOptions function", 500);
  }
};

exports.uploadSingleImage = (fieldName) => {
  try {
    return multerOptions().single(fieldName);
  } catch (e) {
    console.error(e);
    throw new ApiError("Error in uploadSingleImage function", 500);
  }
};

exports.uploadMixOfImages = (arrayOfFields) => {
  try {
    return multerOptions().fields(arrayOfFields);
  } catch (e) {
    console.error(e);
    throw new ApiError("Error in uploadMixOfImages function", 500);
  }
};
