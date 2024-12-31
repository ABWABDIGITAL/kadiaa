const express = require("express");
const router = express.Router();
const Consultation = require('../models/ConsultationModel'); // Adjust the path as needed
const LawyerOffer = require("../models/lawerOfferModel.js");
const ApiError = require('../utils/ApiError'); // Adjust the path as needed
const caseTypes= require('../models/caseTypeModel');


const {
  createConsultation,
  getConsultations,
  getConsultationsForLawyer,
  getConsultationById,
  getConsultationHistory,
  selectOffer,
  sendOffer,
  comparePrices,
  getConsultationsWithOfferCheck,
  saveAppointmentDate,
  getConsultationDetails,
  resetConsultation,
  rejectOffer,
  submitOffer,
  getOffersByLawyer,
  updateOffer,
} = require("../Validator/ConsultationValidator"); // Use the enhanced controller
const { protect, allowedTo } = require("../Services/authServices");

// 1. Create a new consultation with file upload
router.post("/", protect, createConsultation);

// 2. Get all consultations for the authenticated user
router.get("/", protect, getConsultations);


// 3. Get all consultations for a lawyer with optional filters
router.get("/all", protect, allowedTo("lawyer"), getConsultationsForLawyer);

// 4. Get consultation by ID for lawyers (protected)
//router.get("/:id", protect, allowedTo("lawyer"), getConsultationById);
router.post("/select-offer", protect, selectOffer);

// 5. Send an offer for a consultation (for lawyers)
router.post("/send-offer", protect, allowedTo("lawyer"), sendOffer);

// 6. Compare consultation prices (based on caseId)
router.get("/compare-prices", protect, comparePrices);

// 7. Get consultation history for a user or lawyer
router.get("/history/:id", protect, allowedTo("user"), getConsultationHistory);

// 8. Get consultations with an offer check
router.post('/offerCheck', protect,  getConsultationsWithOfferCheck);

// 9. Save the selected appointment date
router.post('/saveAppointmentDate', protect, saveAppointmentDate);

// 10. Get detailed consultation information
router.post('/details', protect, getConsultationDetails);

// 11. Reset a consultation
router.post('/reset', protect, resetConsultation);
router.post('/reject-offer', protect, rejectOffer);
// Endpoint to submit an offer
router.post('/submitOffer',protect,submitOffer);
router.get('/offers',protect, getOffersByLawyer);
router.put('/update-offer/:offerId',protect, updateOffer);




module.exports = router;
