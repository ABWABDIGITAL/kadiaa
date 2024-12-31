const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lawyer",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    administrationPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"], // Add all valid statuses
      default: "Pending", // Default value if not provided
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
mongoose.set("toObject", { virtuals: true });
mongoose.set("toJSON", { virtuals: true, versionKey: false }); // Exclude __v
const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
