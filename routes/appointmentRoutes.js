const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { protect, allowedTo } = require("../Services/authServices");
const asyncHandler = require("express-async-handler");
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
  selectAppointmentSlot,
} = require("../Services/appointmentServices");
const ApiError = require("../utils/ApiError");

const appointmentValidationRules = [
  check("lawyer").notEmpty().withMessage("Lawyer is required"),
  check("client").notEmpty().withMessage("Client is required"),
  check("date").isISO8601().withMessage("Valid date is required"),
  check("time").notEmpty().withMessage("Time is required"),
  check("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),
  check("administrationPrice")
    .isFloat({ gt: 0 })
    .withMessage("Administration price must be a positive number"),
  check("status")
    .optional()
    .isIn(["Pending", "Confirmed", "Completed", "Cancelled"])
    .withMessage("Invalid status"),
];

const validateAppointment = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new ApiError(
        errors
          .array()
          .map((err) => err.msg)
          .join(", "),
        400
      )
    );
  }
  next();
};

router.post(
  "/",
  protect,
  (req, res, next) => {
    console.log("Request User:", req.user.role); // Log the user making the request
    next();
  },
  allowedTo("lawyer", "user", "client"),
  appointmentValidationRules,
  validateAppointment,
  createAppointment
);


router.put(
  "/:id",
  protect,
  allowedTo("lawyer", "client"),
  appointmentValidationRules,
  validateAppointment,
  updateAppointment
);
router.post("/select-slot", selectAppointmentSlot);
router.get("/", protect, allowedTo("lawyer", "user"), getAppointments);
router.post("/select-slot", selectAppointmentSlot);
router.get("/:id", protect, allowedTo("lawyer", "client"), getAppointment);

router.delete(
  "/:id",
  protect,
  allowedTo("lawyer", "client"),
  deleteAppointment
);

router.get(
  "/available-slots/:lawyerId/:date",
  protect,
  // allowedTo("user", "lawyer", "client"),
  asyncHandler(getAvailableSlots)
);

module.exports = router;
