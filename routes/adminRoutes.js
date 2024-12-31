const express = require("express");
const {
  getUsers,
  getPendingLawyers,
  approveLawyer,
  getCases,
  getConsultations,
  adminMiddleware,
} = require("../Services/adminServices");
const authServices = require("../Services/authServices");
//const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

//router.use(authServices);
//router.use(adminServices);

router.get("/users", getUsers);
router.get("/lawyers/pending", getPendingLawyers);
router.put("/lawyers/approve/:lawyer", approveLawyer);
router.get("/cases", getCases);
router.get("/Consultation", getConsultations);

module.exports = router;
