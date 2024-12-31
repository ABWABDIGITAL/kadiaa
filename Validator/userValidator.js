const bcrypt = require("bcrypt");
const { check, body } = require("express-validator");
const validatorMiddleware = require("../middleware/validatorMiddleware");
const User = require("../models/userModel");
const { formatSuccessResponse, formatErrorResponse } = require("../utils/responseFormatter");

exports.createUserValidator = [
  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Password Confirmation incorrect");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation required"),

  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  validatorMiddleware,
];

exports.getUserValidator = [
  check("id").isMongoId().withMessage("Invalid User id format"),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User id format"),
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid User id format'),
  body('currentPassword')
    .notEmpty()
    .withMessage('You must enter your current password'),
  body('passwordConfirm')
    .notEmpty()
    .withMessage('You must enter the password confirmation'),
  body('password')
    .notEmpty()
    .withMessage('You must enter a new password')
    .custom(async (val, { req }) => {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new Error('There is no user for this ID');
      }

      const isCorrectPassword = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isCorrectPassword) {
        throw new Error('Incorrect current password');
      }

      if (val !== req.body.passwordConfirm) {
        throw new Error('Password confirmation does not match the new password');
      }

      return true;
    }),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid User id format"),
  validatorMiddleware,
];

exports.updateLoggedUserValidator = [
  body("name")
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),

  check("phone")
    .optional()
    .isMobilePhone(["ar-EG", "ar-SA"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),

  validatorMiddleware,
];

// Custom error handling middleware for validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      param: error.param,
      message: error.msg,
    }));
    return res.status(400).json(formatErrorResponse(400, formattedErrors, "Validation failed"));
  }
  next();
};
