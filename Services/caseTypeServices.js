const path = require('path');
const CaseType = require('../models/caseTypeModel');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

// Create a new CaseType
exports.createCaseType = async (req, res, next) => {
  const { name } = req.body;
  const image = req.file ? `http://91.108.102.81:5000/uploads/casetype/${path.basename(req.file.path)}` : null;

  if (!name) {
    return next(new ApiError('Name is required', 400));
  }

  try {
    // توليد id فريد إذا لم يكن موجودًا بالفعل
    const newCaseType = new CaseType({ 
      name, 
      image,
      id: new mongoose.Types.ObjectId()?.toString(), // استخدام id مخصص
    });
    await newCaseType.save();

    res.status(201).json(formatSuccessResponse(newCaseType, 'CaseType created successfully'));
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
      return next(new ApiError('CaseType name already exists', 400));
    }
    console.error('Create CaseType error:', error);
    next(new ApiError('Server error', 500));
  }
};




// Update a CaseType
exports.updateCaseType = async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const image = req.file ? `http://91.108.102.8/uploads/casetype/${path.basename(req.file.path)}` : null;

  try {
    const updateData = { name };
    if (image) updateData.image = image;

    const updatedCaseType = await CaseType.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedCaseType) {
      return res.status(404).json(formatErrorResponse('CaseType not found'));
    }

    res.status(200).json(formatSuccessResponse(updatedCaseType, 'CaseType updated successfully'));
  } catch (error) {
    next(error);
  }
};

// Delete a CaseType
exports.deleteCaseType = async (req, res, next) => {
  const { id } = req.params;

  try {
    const deletedCaseType = await CaseType.findByIdAndDelete(id);

    if (!deletedCaseType) {
      return res.status(404).json(formatErrorResponse('CaseType not found'));
    }

    res.status(200).json(formatSuccessResponse(deletedCaseType, 'CaseType deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// Get all CaseTypes
exports.getCaseTypes = async (req, res, next) => {
  try {
    const caseTypes = await CaseType.find();
    res.status(200).json(formatSuccessResponse(caseTypes, 'CaseTypes retrieved successfully'));
  } catch (error) {
    console.error('Get CaseTypes error:', error);
    next(new ApiError('Server error', 500));
  }
};
