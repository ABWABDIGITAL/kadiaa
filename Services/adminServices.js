const User = require("../models/userModel");
const Case = require("../models/caseModel");
const Lawyer = require("../models/lawyerModel");
const Consultation = require("../models/ConsultationModel");
const axios = require("axios");

//const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPendingLawyers = async (req, res) => {
  const pendingLawyers = await Lawyer.find({ isApproved: false }).populate(
    "userId"
  );
  res.json(pendingLawyers);
};

exports.approveLawyer = async (req, res) => {
  const { lawyer } = req.params;
  try {
    const response = await axios.put(
      `http://localhost:5000/api/v1/lawyers/approve/${lawyer}`
    );
    res
      .status(200)
      .json({ message: "Lawyer approved successfully", data: response.data });
  } catch (error) {
    res.status(500).json({
      message: "Error approving lawyer",
      error: error.response ? error.response.data : error.message,
    });
  }
};

exports.getCases = async (req, res) => {
  const cases = await Case.find().populate("userId");
  res.json(cases);
};

exports.getConsultations = async (req, res) => {
  const Consultations = await Consultation.find().populate("caseId userId");
  res.json(Consultations);
};

exports.adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
