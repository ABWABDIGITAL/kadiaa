const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect } = require('../Services/authServices');
const {
  createCase,
  getAllCases,
  getCaseById,
  updateCase,
  deleteCase,
  getCasesByCaseTypeId,
} = require('../Validator/caseValidator'); 

const router = express.Router();

// Route for creating and getting all cases
router.route('/cases')
  .post(createCase) // Creating a new case
  .get(getAllCases); // Getting all cases
  router.get('/:caseTypeId', getCasesByCaseTypeId);
// Route for getting, updating, and deleting a specific case by ID
router.route('/cases/:id')
  .get(protect, getCaseById) // Getting a specific case by ID
  .patch(protect, updateCase) // Updating a specific case by ID
  .delete(protect, deleteCase); // Deleting a specific case by ID

module.exports = router;
