const ContactUs = require('../models/contactusModel');
const ApiError = require('../utils/ApiError'); // Optional, for error handling
const {
  formatSuccessResponse,
  formatErrorResponse,
} = require('../utils/responseFormatter');

exports.createContact = async (req, res, next) => {
  try {
    const { name, email, phone, description } = req.body;

    // Create a new contact entry
    const contact = await ContactUs.create({ name, email, phone, description });

    res.status(201).json(
      formatSuccessResponse(contact, "Contact message submitted successfully")
    );
  } catch (error) {
    console.error("Error creating contact message:", error);
    res.status(500).json(
      formatErrorResponse("Failed to submit contact message")
    );
  }
};

exports.getAllContacts = async (req, res, next) => {
  try {
    const contacts = await ContactUs.find();

    res.status(200).json(
      formatSuccessResponse(contacts, "Fetched all contact messages successfully")
    );
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json(
      formatErrorResponse("Failed to fetch contact messages")
    );
  }
};
