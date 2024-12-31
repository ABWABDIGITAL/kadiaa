const express = require('express');
const contactController = require('../Services/contactUsServices');

const router = express.Router();

// Route to create a contact message
router.post('/', contactController.createContact);

// Route to fetch all contact messages (admin or authorized personnel)
router.get('/', contactController.getAllContacts);

module.exports = router;
