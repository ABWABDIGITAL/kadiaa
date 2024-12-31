const express = require('express');
const {  searchCases } = require('../Services/searchServices');

const router = express.Router();

router.get('/search', searchCases);

module.exports = router;
