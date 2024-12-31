const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/apiFeatures");
const marked = require("marked");
const mongoose = require("mongoose");

// Common error handler function
const handleErrors = (error, next) => {
  next(new ApiError(`Error: ${error.message}`, 500));
};

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const document = await Model.findByIdAndDelete(id);

      if (!document) {
        throw new ApiError(`No document for this id ${id}`, 404);
      }

      res.status(200).json({ success: true, data: {} });
    } catch (error) {
      handleErrors(error, next);
    }
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    try {
      const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });

      if (!document) {
        throw new ApiError(`No document for this id ${req.params.id}`, 404);
      }

      res.status(200).json({ success: true, data: document });
    } catch (error) {
      handleErrors(error, next);
    }
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    
    try {
      const doc = await Model.create(req.body);
      const otp = generateOTP();
      doc.otp = otp;
      await doc.save();
      // Uncomment the line below if you have the sendOTP function implemented
      await sendOTP(doc.phone, otp);
      res.status(201).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    } catch (error) {
      handleErrors(error, next);
    }
  });

exports.getOne = (Model, populationOpt) =>
  asyncHandler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const query = Model.findById(id);

      if (populationOpt) {
        query.populate(populationOpt);
      }

      const document = await query.lean();
      if (!document) {
        throw new ApiError(`No document for this id ${id}`, 404);
      }

      if (!document.content) {
        // If content is missing, return a response without parsing it
        return res.status(200).json({ success: true, data: document });
      }

      document.content = marked.parse(document.content);

      res.status(200).json({ success: true, data: document });
    } catch (error) {
      handleErrors(error, next);
    }
  });

exports.getAll = (Model, modelName = "") =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    // Build query
   // const documentsCount = await Model.countDocuments(); // Corrected variable name
    const documentsCount = await Model.countDocuments(); // Get the total count of documents
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
        .paginate(documentsCount) // Pass the countDocuments value
        .filter()
        .search(modelName)
        .limitFields()
        .sort();
    


    // Execute query
    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;

    res
      .status(200)
      .json({ results: documents.length, paginationResult, data: documents });
  });

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000)?.toString();
};
