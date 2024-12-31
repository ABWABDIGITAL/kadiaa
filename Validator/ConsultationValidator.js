const mongoose = require("mongoose");
const Consultation = require("../models/ConsultationModel");
const User = require("../models/userModel");
const Case = require("../models/caseModel");
const Lawyer = require("../models/lawyerModel");
const CaseType = require("../models/caseTypeModel");
//const Offer = require ("../models/")
const LawyerOffer = require("../models/lawerOfferModel.js");
const validateTimestamp = require("../Validator/timestampValidator");
const ApiError = require("../utils/ApiError");
const {
  uploadMultipleFiles,
} = require("../middleware/fileUploadMiddleware.js");

const {
  formatSuccessResponse,
  formatErrorResponse,
} = require("../utils/responseFormatter");

// Define the fields for file uploads
const uploadFiles = uploadMultipleFiles([
  { name: "attachedFiles", maxCount: 10 },
]);

// Controller to create a new consultation request
exports.createConsultation = [
  uploadFiles,
  async (req, res, next) => {
    const { userId, caseId, description, caseTypes } = req.body;

    if (!userId || !caseId || !description || !caseTypes) {
      return next(
        new ApiError("userId, caseId, description, and caseTypes are required", 400)
      );
    }

    try {
      // Rename variables to avoid conflicts
      const [user, caseData, caseTypeData] = await Promise.all([
        User.findById(userId),
        Case.findById(caseId),
       // CaseType.findById(caseTypes)
      ]);

      if (!user || !caseData ) {
        return next(new ApiError("User, case, or case type not found", 404));
      }

      const attachedFiles = req.files["attachedFiles"]
        ? req.files["attachedFiles"].map(
            (file) => `http://91.108.102.81:5000/uploads/${file.filename}`
          )
        : [];

      const consultation = await Consultation.create({
        userId,
        caseId,
        description,
        attachedFiles,
        caseTypes,// Use the correct variable for caseTypes
      });

      const formattedUser = user.toObject();
      const formattedCase = caseData.toObject();
      //const formattedCaseType = caseTypeData.toObject();

      // Remove sensitive or unnecessary fields
      delete formattedUser.__v;
      delete formattedUser.password;
      delete formattedUser.verified;
      delete formattedUser.otp;
    //  delete formattedU

      delete formattedCase.__v;

     // delete formattedCaseType.__v;

      const consultationWithDetails = {
        _id: consultation._id,
        userId: consultation.userId,
        caseId: consultation.caseId,
        caseTypes: consultation.caseTypes,
        description: consultation.description,
        attachedFiles: consultation.attachedFiles,
        createdAt: consultation.createdAt,
        user: formattedUser,
        case: formattedCase,
       // caseTypes: formattedCaseType,
      };

      res.status(201).json({ success: true, data: consultationWithDetails });
    } catch (error) {
      console.error("Error creating consultation:", error);
      return next(new ApiError("Server error", 500));
    }
  },
];


exports.getConsultations = async (req, res, next) => {
  try {
    // Fetch all consultations for the user
    const consultations = await Consultation.find({
      userId: req.user,
    }).lean();

    if (!consultations || consultations.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No consultations found", data: [] });
    }

    const consultationsWithDetails = await Promise.all(
      consultations.map(async (consultation) => {
        try {
          // Add logging for consultation object
          console.log("Processing consultation:", consultation);

          // Ensure required IDs exist
          const userId = consultation.userId;
          const caseId = consultation.caseId;
          const lawyerId = consultation.lawyerId;

          if (!userId || !caseId) {
            console.warn(
              `Missing critical IDs in consultation: ${consultation._id}`
            );
            return null; // Skip this consultation
          }

          // Fetch related data
          const [user, caseDetails, lawyer, lawyerOffers, selectedOffer] =
            await Promise.all([
              User.findById(userId).select("name email").lean(),
              Case.findById(caseId).select("title description").lean(),
              lawyerId
                ? Lawyer.findById(lawyerId)
                    .select("nameLawyer profilePicture specialization")
                    .lean()
                : null,
              LawyerOffer.find({ _id: { $in: consultation.lawyerOffers || [] } })
                .populate({
                  path: "lawyerId",
                  select: "nameLawyer profilePicture expertise phone contact",
                })
                .select("offerPrice offerDesc createdAt updatedAt")
                .lean(),
              consultation.selectedOffer
                ? LawyerOffer.findById(consultation.selectedOffer)
                    .populate({
                      path: "lawyerId",
                      select:
                        "nameLawyer profilePicture expertise phone contact",
                    })
                    .select("offerPrice offerDesc createdAt updatedAt")
                    .lean()
                : null,
            ]);

          // Add null checks for fetched data
          const formattedLawyerOffers = (lawyerOffers || []).map((offer) => ({
            offerId: offer._id,
            lawyerId: offer.lawyerId?._id || null,
            lawyerName: offer.lawyerId?.nameLawyer || "",
            lawyerPhone: offer.lawyerId?.phone || "",
            lawyerExpertise: offer.lawyerId?.expertise || "",
            lawyerContact: offer.lawyerId?.contact || {},
            lawyerProfilePicture: offer.lawyerId?.profilePicture || "",
            offerPrice: offer.offerPrice,
            offerDesc: offer.offerDesc,
            createdAt: offer.createdAt,
            updatedAt: offer.updatedAt,
          }));

          const formattedSelectedOffer = selectedOffer
            ? {
                offerId: selectedOffer._id,
                lawyerId: selectedOffer.lawyerId?._id || null,
                lawyerName: selectedOffer.lawyerId?.nameLawyer || "",
                lawyerPhone: selectedOffer.lawyerId?.phone || "",
                lawyerExpertise: selectedOffer.lawyerId?.expertise || "",
                lawyerContact: selectedOffer.lawyerId?.contact || {},
                lawyerProfilePicture:
                  selectedOffer.lawyerId?.profilePicture || "",
                offerPrice: selectedOffer.offerPrice,
                offerDesc: selectedOffer.offerDesc,
                createdAt: selectedOffer.createdAt,
                updatedAt: selectedOffer.updatedAt,
              }
            : null;

          // Build response object
          return {
            _id: consultation._id,
            createdAt: consultation.createdAt,
            user,
            case: caseDetails,
            lawyer,
            description: consultation.description,
            attachedFiles: consultation.attachedFiles,
            status: consultation.status,
            lawyerOffers: formattedLawyerOffers,
            selectedOffer: formattedSelectedOffer,
            appointmentId: consultation.appointmentId || null,
          };
        } catch (err) {
          console.error("Error processing consultation:", err);
          return null; // Skip this consultation if there's an error
        }
      })
    );

    // Filter out null consultations
    const filteredConsultations = consultationsWithDetails.filter(Boolean);

    res
      .status(200)
      .json({ success: true, message: "Consultations retrieved", data: filteredConsultations });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    next(new ApiError("Server error while fetching consultations", 500));
  }
};

exports.getConsultationsForLawyer = async (req, res, next) => {
  try {
    const lawyerId = req.body.lawyerId; // Ensure the lawyerId is passed in the request body

    if (!lawyerId) {
      return next(new ApiError("Lawyer ID is required", 400));
    }

    // Find the lawyer by ID
    const lawyer = await Lawyer.findById(lawyerId).lean();

    if (!lawyer) {
      return next(new ApiError("Lawyer not found", 404));
    }

    // Check if lawyer has valid caseId and caseTypes
    if (!lawyer.caseId || !lawyer.caseTypes) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Fetch consultations matching the caseId and caseTypes
    const consultations = await Consultation.find({
      caseId: lawyer.caseId,
      caseTypes: lawyer.caseTypes,
      // status: "Pending"  // Uncomment if you want to filter by status
    })
      .populate("caseId", "title description")
      .populate("userId", "name email")
      .populate("caseTypes", "name ")
      .lean();

    if (consultations.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Fetch offers made by the lawyer
    const offers = await LawyerOffer.find({ lawyerId: lawyerId }).lean();

    // Handle undefined consultationId and ensure it's a valid object
    const offeredConsultationIds = offers
      .filter((offer) => offer.consultationId) // Ensure consultationId is not undefined or null
      .map((offer) => offer.consultationId.toString());

    // Debugging: Log offered consultation IDs
    //  console.log('Offered Consultation IDs:', offeredConsultationIds);

    // Filter out consultations for which the lawyer has already made an offer
    const filteredConsultations = consultations
      .filter(
        (consultation) =>
          !offeredConsultationIds.includes(consultation._id?.toString())
      )
      .filter((consultation) => validateTimestamp(consultation.createdAt)) // Apply timestamp validation
      .map((consultation) => ({
        consultationId: consultation._id, // Add consultationId to the response
        ...consultation, // Include all other fields
      }));

    // Return the filtered consultations
    return res
      .status(200)
      .json(
        formatSuccessResponse(
          filteredConsultations,
          "Consultations retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return next(new ApiError(error.message || "Server error", 500));
  }
};

/*
exports.getConsultationById = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError("Invalid consultation ID format", 400));
  }

  try {
    const populatedConsultation = await Consultation.findById(id)
      .populate({
        path: "userId",
        select: "name email",
      })
      .populate({
        path: "caseId",
        select: "caseName caseDescription",
      })
      .populate({
        path: "lawyerOffers",
        select: "lawyerId offerPrice offerDesc createdAt updatedAt",
        populate: {
          path: "lawyerId",
          select: "name email",
        },
      })
      .lean()
      .exec();

    if (!populatedConsultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    const responseData = {
      userId: populatedConsultation.userId,
      caseId: populatedConsultation.caseId,
      description: populatedConsultation.description,
      attachedFiles: populatedConsultation.attachedFiles,
      status: populatedConsultation.status,
      lawyerOffers: populatedConsultation.lawyerOffers.map((offer) => ({
        lawyerId: offer.lawyerId,
        offerPrice: offer.offerPrice,
        offerDesc: offer.offerDesc,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      })),
    };

    res.status(200).json(
      formatSuccessResponse(
        responseData,
        "Consultation retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching consultation by ID:", error);
    return next(new ApiError("Server error", 500));
  }
};
*/
exports.getConsultationHistory = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const role = req.user?.role;

    

    let consultations;

    if (role === "user") {
      consultations = await Consultation.find({ userId })
        .populate("lawyerOffers.lawyerId", "name email") // Populate lawyerId in lawyerOffers
        .populate("caseId", "caseName caseDescription")
        .populate("caseTypes")
        .populate("lawyerId")
        .populate("selectedOffer")
        .populate("lawyerOffers")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (consultations.length === 0) {
      return res
        .status(404)
        .json({ message: "No consultation history found." });
    }

    

    res.status(200).json({
      success: true,
      message: "Consultation history fetched successfully",
      data: consultations,
    });
  } catch (err) {
    console.error("Error fetching consultation history:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.comparePrices = async (req, res) => {
  try {
    const caseId = req.query.caseId.trim();

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid caseId format",
      });
    }

    const consultations = await Consultation.find({ caseId });

    if (consultations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No consultations found for the provided caseId",
      });
    }

    consultations.sort((a, b) => a.price - b.price);

    res.status(200).json({
      success: true,
      data: consultations,
    });
  } catch (error) {
    console.error("Error comparing prices:", error);
    res.status(500).json({
      success: false,
      message: "Error comparing prices",
      data: error.message,
    });
  }
};

exports.sendOffer = async (req, res, next) => {
  const { consultationId, offerPrice, offerDesc } = req.body;
  const lawyerId = req.lawyer?._id;

  if (!consultationId || !offerPrice || !offerDesc || !lawyerId) {
    return next(
      new ApiError(
        "consultationId, offerPrice, offerDesc, and lawyerId are required",
        400
      )
    );
  }

  try {
    // Check if the consultation exists
    const consultation = await Consultation.findById(consultationId).exec();

    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }
    consultation.lawyerId = lawyerId;
    consultation.save();
    // Validate the timestamp
    if (!validateTimestamp(consultation.createdAt)) {
      return next(
        new ApiError(
          "Consultation time has expired and can no longer be offered",
          400
        )
      );
    }

    // Count the number of offers by this lawyer
    const offerCount = await LawyerOffer.countDocuments({
      consultationId: new mongoose.Types.ObjectId(consultationId),
      lawyerId: new mongoose.Types.ObjectId(lawyerId),
    });

    if (offerCount >= 3) {
      return next(
        new ApiError(
          "You have already made the maximum number of offers for this consultation",
          400
        )
      );
    }

    // Create and save the new offer
    const newOffer = new LawyerOffer({
      lawyerId: new mongoose.Types.ObjectId(lawyerId),
      consultationId: new mongoose.Types.ObjectId(consultationId),
      offerPrice,
      offerDesc,
    });

    await newOffer.save();

    // Add the new offer's _id to the consultation
    consultation.lawyerOffers.push(newOffer._id);

    consultation.offerCount = (consultation.offerCount || 0) + 1;
    await consultation.save();

    // Populate the details again
    const populatedConsultation = await Consultation.findById(consultationId)
      .populate("userId", "name email")
      .populate("caseId", "title description")
      .populate("lawyerOffers")
      .exec();

    console.log("Creating offer with data:", {
      lawyerId,
      consultationId,
      offerPrice,
      offerDesc,
    });

    res.status(201).json({
      success: true,
      message: "Offer sent successfully",
      data: populatedConsultation,
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    return next(new ApiError("Server error", 500));
  }
};

// Function to get consultations with offer validation and timing check
exports.getConsultationsWithOfferCheck = async (req, res, next) => {
  try {
    const { consultationId } = req.body;

    if (!consultationId) {
      return next(new ApiError("Consultation ID is required", 400));
    }

    const consultation = await Consultation.findById(consultationId)
      .populate("lawyerOffers")
      .populate({
        path: "selectedOffer",
        populate: {
          path: "lawyerId",
          select: "name email profilePicture", // Select necessary lawyer fields
        },
      });

    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    const responseData = {
      userId: consultation.userId,
      caseId: consultation.caseId,
      description: consultation.description,
      price: consultation.price,
      attachedFiles: consultation.attachedFiles,
      status: consultation.status,
      lawyerOffers: [],
    };

    if (consultation.selectedOffer) {
      const selectedOfferTime = new Date(consultation.selectedOffer.createdAt);
      const currentTime = new Date();
      const timeDifferenceInHours =
        (currentTime - selectedOfferTime) / (1000 * 60 * 60);

      if (timeDifferenceInHours <= 1) {
        // Offer selected within the last hour, send complete lawyer data
        responseData.lawyerOffers.push({
          lawyerId: consultation.selectedOffer.lawyerId,
          offerPrice: consultation.selectedOffer.offerPrice,
          offerDesc: consultation.selectedOffer.offerDesc,
          createdAt: consultation.selectedOffer.createdAt,
          updatedAt: consultation.selectedOffer.updatedAt,
        });
      }
    } else {
      // No offer selected, send all offers
      consultation.lawyerOffers.forEach((offer) => {
        responseData.lawyerOffers.push({
          lawyerId: offer.lawyerId,
          offerPrice: offer.offerPrice,
          offerDesc: offer.offerDesc,
          createdAt: offer.createdAt,
          updatedAt: offer.updatedAt,
        });
      });
    }

    res
      .status(200)
      .json(
        formatSuccessResponse(
          responseData,
          "Consultation retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error retrieving consultation:", error);
    return next(new ApiError("Server error", 500));
  }
};

// Function to save selected appointment date with appointment ID
exports.saveAppointmentDate = async (req, res, next) => {
  const { consultationId, offerId, appointmentId } = req.body;

  // Validate request body
  if (!consultationId || !offerId || !appointmentId) {
    return next(
      new ApiError(
        "Consultation ID, Offer ID, appointment date, and appointment ID are required",
        400
      )
    );
  }

  try {
    // Find the consultation by ID and populate lawyer offers
    const consultation = await Consultation.findById(consultationId).populate(
      "lawyerOffers"
    );

    // Check if the consultation exists
    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    // Find the selected offer within the consultation's lawyer offers
    const selectedOffer = consultation.lawyerOffers.find(
      (offer) => offer._id?.toString() === offerId
    );

    // Check if the selected offer exists
    if (!selectedOffer) {
      return next(new ApiError("Offer not found", 404));
    }

    // Associate the selected offer, appointment date, and appointment ID with the consultation
    consultation.selectedOffer = selectedOffer;
    //consultation.appointmentDate = appointmentDate;
    consultation.appointmentId = appointmentId;
    console.log(appointmentId);
    console.log(appointmentId);
    // Add the appointment ID to the consultation

    // Save the updated consultation document
    await consultation.save();

    // Respond with success
    res
      .status(200)
      .json(
        formatSuccessResponse(
          consultation,
          "Appointment date and appointment ID saved successfully"
        )
      );
  } catch (error) {
    console.error("Error saving appointment date and appointment ID:", error);
    return next(new ApiError("Server error", 500));
  }
};

// Function to fetch consultation details
exports.getConsultationDetails = async (req, res, next) => {
  const { consultationId } = req.body;

  if (!consultationId) {
    return next(new ApiError("Consultation ID is required", 400));
  }

  try {
    const consultation = await Consultation.findById(consultationId)
      .populate("userId")
      .populate("caseId")
      .populate("caseTypes")
      .populate({
        path: "lawyerOffers",
        populate: {
          path: "lawyerId",
         
        },
      })
      .lean();

    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    // Format response based on the lawyer's required sections
    const responseData = {
      userId: consultation.userId,
      caseId: consultation.caseId,
      caseTypes:consultation.caseTypes,
      description: consultation.description,
      attachedFiles: consultation.attachedFiles,
      status: consultation.status,
      powerOfAttorney: [], // Add relevant data
      caseFiles: [], // Add relevant data
      updates: [], // Add relevant data
      caseDetails: consultation.caseId, // Or format as needed
      lawyerOffers: consultation.lawyerOffers.map((offer) => ({
        lawyerId: offer.lawyerId,
        offerPrice: offer.offerPrice,
        offerDesc: offer.offerDesc,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      })),
    };

    res
      .status(200)
      .json(
        formatSuccessResponse(
          responseData,
          "Consultation details retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching consultation details:", error);
    return next(new ApiError("Server error", 500));
  }
};

// Function to reset consultation
exports.resetConsultation = async (req, res, next) => {
  const { consultationId } = req.body;

  if (!consultationId) {
    return next(new ApiError("Consultation ID is required", 400));
  }

  try {
    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    consultation.selectedOffer = null;
    consultation.appointmentDate = null;
    consultation.status = "Pending"; // Or any other default status
    await consultation.save();

    res
      .status(200)
      .json(
        formatSuccessResponse(consultation, "Consultation reset successfully")
      );
  } catch (error) {
    console.error("Error resetting consultation:", error);
    return next(new ApiError("Server error", 500));
  }
};

exports.selectOffer = async (req, res, next) => {
  const { consultationId, offerId } = req.body;

  if (!consultationId || !offerId) {
    return next(new ApiError("Consultation ID and Offer ID are required", 400));
  }

  try {
    // Find the consultation by ID and populate necessary fields
    const consultation = await Consultation.findById(consultationId)
      .populate({
        path: "lawyerOffers",
        populate: {
          path: "lawyerId",
          select: "nameLawyer phone expertise contact profilePicture",
        },
      })
      .populate({
        path: "caseId",
        select: "title description",
      })
      .exec();

    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    // Find the selected offer in the consultation's lawyerOffers
    const selectedOffer = consultation.lawyerOffers.find(
      (offer) => offer._id?.toString() === offerId
    );

    if (!selectedOffer) {
      return next(new ApiError("Offer not found", 404));
    }

    // Update the consultation with the selected offer
    consultation.selectedOffer = selectedOffer._id;
    // consultation.lawyerId=
    await consultation.save();

    // Format the response data
    const responseData = {
      userId: consultation.userId,
      caseId: consultation.caseId._id,
      caseTitle: consultation.caseId.title,
      caseDescription: consultation.caseId.description,
      description: consultation.description,
      price: consultation.price,
      attachedFiles: consultation.attachedFiles,
      status: consultation.status,
      lawyerOffers: consultation.lawyerOffers.map((offer) => ({
        offerId: offer._id,
        lawyerId: offer.lawyerId._id,
        lawyerName: offer.lawyerId.nameLawyer,
        lawyerPhone: offer.lawyerId.phone,
        lawyerExpertise: offer.lawyerId.expertise
          .map((exp) => `${exp.field}: ${exp.years} years`)
          .join(", "),
        lawyerContact: offer.lawyerId.contact,
        lawyerProfilePicture: offer.lawyerId.profilePicture,
        offerPrice: offer.offerPrice,
        offerDesc: offer.offerDesc,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
      })),
      selectedOffer: {
        offerId: selectedOffer._id,
        lawyerId: selectedOffer.lawyerId._id,
        lawyerName: selectedOffer.lawyerId.nameLawyer,
        lawyerPhone: selectedOffer.lawyerId.phone,
        lawyerExpertise: selectedOffer.lawyerId.expertise
          .map((exp) => `${exp.field}: ${exp.years} years`)
          .join(", "),
        lawyerContact: selectedOffer.lawyerId.contact,
        lawyerProfilePicture: selectedOffer.lawyerId.profilePicture,
        offerPrice: selectedOffer.offerPrice,
        offerDesc: selectedOffer.offerDesc,
        createdAt: selectedOffer.createdAt,
        updatedAt: selectedOffer.updatedAt,
      },
    };

    res
      .status(200)
      .json(formatSuccessResponse(responseData, "Offer selected successfully"));
  } catch (error) {
    console.error("Error selecting offer:", error);
    return next(new ApiError("Server error", 500));
  }
};
// function to rejectOffer
exports.rejectOffer = async (req, res, next) => {
  const { consultationId, offerId } = req.body;

  if (!consultationId || !offerId) {
    return next(new ApiError("Consultation ID and Offer ID are required", 400));
  }

  try {
    // Find the consultation by ID
    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    // Check if the offer exists in the consultation
    const offerIndex = consultation.lawyerOffers.findIndex(
      (offer) => offer?.toString() === offerId
    );

    if (offerIndex === -1) {
      return next(new ApiError("Offer not found in this consultation", 404));
    }

    // Add the offer to the rejectedOffers array
    consultation.rejectedOffers.push(offerId);

    // Optionally, remove the rejected offer from the lawyerOffers array
    consultation.lawyerOffers.splice(offerIndex, 1);

    // Save the updated consultation
    await consultation.save();

    res.status(200).json({
      success: true,
      message: "Offer rejected successfully",
      data: [],
    });
  } catch (error) {
    console.error("Error rejecting offer:", error);
    return next(new ApiError("Server error", 500));
  }
};
exports.submitOffer = async (req, res, next) => {
  try {
    const { consultationId, offerDesc, offerPrice } = req.body;
    const lawyerId = req.lawyer._id; // Assuming the lawyer ID is set in the request object

    if (!consultationId || !offerDesc || !offerPrice) {
      return next(
        new ApiError(
          "Consultation ID, offer description, and offer price are required",
          400
        )
      );
    }

    // Validate consultation existence
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return next(new ApiError("Consultation not found", 404));
    }

    // Create a new offer
    const offer = await LawyerOffer.create({
      lawyerId,
      consultationId,
      offerDesc,
      offerPrice,
    });

    // Update the consultation with the new offer
    consultation.lawyerOffers.push(offer._id);
    await consultation.save();

    return res.status(201).json({
      success: true,
      message: "Offer submitted successfully",
      data: offer,
    });
  } catch (error) {
    console.error("Error submitting offer:", error);
    return next(new ApiError(error.message || "Server error", 500));
  }
};
exports.getOffersByLawyer = async (req, res, next) => {
  try {
    const lawyerId = req.lawyer?._id;

    if (!lawyerId) {
      return next(new ApiError("Lawyer ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(lawyerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lawyer ID format",
      });
    }

    console.log("Fetching offers for lawyer ID:", lawyerId);

    // Fetch all offers made by the lawyer with populated fields
    const lawyerOffers = await LawyerOffer.find({
      lawyerId: new mongoose.Types.ObjectId(lawyerId),
    })
      .populate({
        path: "consultationId",
        select: "title description userId caseId caseTypes", // Select relevant fields from consultation
        populate: [
          {
            path: "userId",
            select: "username email",
          },
          {
            path: "caseId",
            select: "caseName caseDetails",
          },
          {
            path: "caseTypes",
            select: "name",
          },
        ],
      })
      .lean();

    //console.log("Fetched lawyer offers:", lawyerOffers);

    // Filter offers based on timestamp
    const filteredOffers = lawyerOffers.filter((offer) =>
      validateTimestamp(offer.createdAt)
    );

    // Add offerId to the response
    const formattedOffers = filteredOffers.map((offer) => ({
      ...offer,
      offerId: offer._id,
    }));

    if (formattedOffers.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    res
      .status(200)
      .json(
        formatSuccessResponse(formattedOffers, "Offers retrieved successfully")
      );
  } catch (error) {
    console.error("Error fetching offers:", error);
    return next(new ApiError("Server error", 500));
  }
};
exports.updateOffer = async (req, res, next) => {
  try {
    const lawyerId = req.lawyer._id;
    const { offerId } = req.params;
    const { offerPrice, offerDesc } = req.body;

    console.log("Lawyer ID from request:", lawyerId);

    // Fetch the offer by ID
    const offer = await LawyerOffer.findById(offerId).exec();
    console.log("Offer:", offer);

    if (!offer) {
      return next(new ApiError("Offer not found", 404));
    }

    // Fetch the associated consultation to validate timestamp
    const consultation = await Consultation.findById(
      offer.consultationId
    ).exec();

    if (!consultation) {
      return next(new ApiError("Associated consultation not found", 404));
    }

    // Validate the consultation timestamp
    if (!validateTimestamp(consultation.createdAt)) {
      return res.status(400).json({
        success: false,
        message: "Consultation time has expired and cannot be updated",
      });
    }

    // Ensure offer.lawyerId exists
    if (!offer.lawyerId) {
      return res.status(400).json({
        success: false,
        message: "Offer does not have an associated lawyer",
      });
    }

    console.log("Offer lawyerId:", offer.lawyerId);

    if (!offer.lawyerId.equals(lawyerId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this offer",
      });
    }

    // Update fields
    if (offerPrice !== undefined) offer.offerPrice = offerPrice;
    if (offerDesc !== undefined) offer.offerDesc = offerDesc;

    await offer.save();

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      data: offer,
    });
  } catch (error) {
    console.error("Error updating offer:", error);
    next(new ApiError("Server error", 500));
  }
};
/*Schedule the task to run every hour
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Find consultations older than one hour
    const expiredConsultations = await Consultation.find({
      createdAt: { $lt: oneHourAgo }
    }).lean();

    const expiredConsultationIds = expiredConsultations.map(c => c._id);

    if (expiredConsultationIds.length > 0) {
      // Remove associated offers
      await LawyerOffer.deleteMany({
        consultationId: { $in: expiredConsultationIds }
      });

      // Remove expired consultations
      await Consultation.deleteMany({
        _id: { $in: expiredConsultationIds }
      });

      console.log('Removed expired consultations and associated offers.');
    }
  } catch (error) {
    console.error('Error removing expired consultations and offers:', error);
  }
});*/
