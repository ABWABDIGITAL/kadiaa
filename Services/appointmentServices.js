const Appointment = require("../models/appointmentModel");
const ApiError = require("../utils/ApiError");
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

// Create appointment controller
exports.createAppointment = async (req, res, next) => {
  try {
    const { lawyer, client, date, time, price, administrationPrice, status } = req.body;

    if (!lawyer || !client || !date || !time) {
      return res.status(400).json(formatErrorResponse("Required fields are missing"));
    }

    // Create new appointment
    const appointment = await Appointment.create({
      lawyer,
      client,
      date,
      time,
      price,
      administrationPrice,
      status,
    });

    // Populate lawyer and client details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("lawyer", "username email")
      .populate("client", "username email");

    // Remove __v field
    const response = populatedAppointment.toObject();
    delete response.__v;

    // Send response
    res.status(201).json(formatSuccessResponse(response, "Appointment created successfully"));
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json(formatErrorResponse("Server error while creating appointment"));
    next(error);
  }
};

// Retrieve all appointments for the user (either as lawyer or client)
exports.getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      $or: [{ lawyer: req.user._id }, { client: req.user._id }],
    }).populate("lawyer", "username email").populate("client", "username email");

    res.status(200).json(formatSuccessResponse(appointments, "Appointments retrieved successfully"));
  } catch (error) {
    console.error("Error retrieving appointments:", error);
    res.status(500).json(formatErrorResponse("Server error while retrieving appointments"));
    next(error);
  }
};

// Retrieve a single appointment by ID
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("lawyer", "username email")
      .populate("client", "username email");

    if (!appointment) {
      return res.status(404).json(formatErrorResponse("Appointment not found"));
    }

    res.status(200).json(formatSuccessResponse(appointment, "Appointment retrieved successfully"));
  } catch (error) {
    console.error("Error retrieving appointment:", error);
    res.status(500).json(formatErrorResponse("Server error while retrieving appointment"));
    next(error);
  }
};

// Update an appointment by ID
exports.updateAppointment = async (req, res, next) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("lawyer", "username email")
      .populate("client", "username email");

    if (!updatedAppointment) {
      return res.status(404).json(formatErrorResponse("Appointment not found"));
    }

    res.status(200).json(formatSuccessResponse(updatedAppointment, "Appointment updated successfully"));
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json(formatErrorResponse("Server error while updating appointment"));
    next(error);
  }
};

// Delete an appointment by ID
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json(formatErrorResponse("Appointment not found"));
    }

    res.status(200).json(formatSuccessResponse(null, "Appointment deleted successfully"));
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json(formatErrorResponse("Server error while deleting appointment"));
    next(error);
  }
};

exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { lawyerId, date } = req.params;

    if (!lawyerId || !date) {
      return res.status(400).json(formatErrorResponse("Lawyer ID and date are required"));
    }

    // Convert date parameter to start and end of the day in UTC
    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0); // Start of the day
    const endOfDay = new Date(queryDate);
    endOfDay.setUTCHours(23, 59, 59, 999); // End of the day

    console.log('Querying appointments with lawyerId:', lawyerId);
    console.log('Date range:', queryDate, 'to', endOfDay);

    // Find all appointments for the lawyer on the specified date
    const appointments = await Appointment.find({
      lawyer: lawyerId,
      date: { $gte: queryDate, $lt: endOfDay },
    }).select("time _id");

    console.log('Found appointments:', appointments);

    // Map the results to include only time and appointmentId
    const formattedSlots = appointments.map((appointment) => ({
      appointmentId: appointment._id,
      time: appointment.time
    }));

    // Send the response
    res.status(200).json(formatSuccessResponse(formattedSlots, "Booked slots retrieved successfully"));
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json(formatErrorResponse("Server error while fetching available slots"));
    next(error);
  }
};




// Select an appointment slot and create a new appointment
exports.selectAppointmentSlot = async (req, res, next) => {
  try {
    const { lawyer, client, date, time, price, administrationPrice, status } = req.body;

    if (!lawyer || !client || !date || !time) {
      return res.status(400).json(formatErrorResponse("Required fields are missing"));
    }

    // Check if the slot is already booked
    const existingAppointment = await Appointment.findOne({
      lawyer,
      date,
      time,
    });

    if (existingAppointment) {
      return res.status(400).json(formatErrorResponse("This time slot is already booked"));
    }

    // Create new appointment
    const appointment = await Appointment.create({
      lawyer,
      client,
      date,
      time,
      price,
      administrationPrice,
      status,
    });

    // Populate lawyer and client details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("lawyer", "username email")
      .populate("client", "username email");

    // Remove __v field
    const response = populatedAppointment.toObject();
    delete response.__v;

    // Send response
    res.status(201).json(formatSuccessResponse(response, "Appointment booked successfully"));
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json(formatErrorResponse("Server error while booking appointment"));
    next(error);
  }
};

// Helper function to generate time slots
const generateTimeSlots = (startHour, endHour) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour}:00`, `${hour}:30`);
  }
  // Include the end hour's slots
  slots.push(`${endHour}:00`, `${endHour}:30`);
  return slots;
};

