const express = require("express");
const countryController = require("../controllers/countryController");

const router = express.Router();

// Public route — mobile app sends its public IP to resolve the country code
router.get("/", countryController.getCountryByIp);

module.exports = router;