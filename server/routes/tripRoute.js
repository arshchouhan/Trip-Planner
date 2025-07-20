const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

/**
 * @route   POST /api/plan-trip
 * @desc    Plan a trip based on user inputs
 * @access  Public
 */
router.post('/plan-trip', tripController.planTrip);

module.exports = router;
