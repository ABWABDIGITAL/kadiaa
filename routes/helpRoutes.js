const express = require("express");
const { createHelp, getAllHelps } = require("../Services/helpServices");

const router = express.Router();

// Endpoint to create a help article
router.post("/", createHelp);

// Endpoint to get all help articles
router.get("/", getAllHelps);

module.exports = router;
