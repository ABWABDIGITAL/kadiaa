const express = require('express');
const { getSpecialLawyers, addSpecialLawyer } = require('../Services/PannerServices');

const router = express.Router();

router.get('/special-lawyers', getSpecialLawyers);
router.post('/special-lawyers', addSpecialLawyer);

module.exports = router;
