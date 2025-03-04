// server/routes/venue.routes.js
const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venue.controller');

// Get all venues
router.get('/', venueController.getAllVenues);

// Get venue by ID
router.get('/:id', venueController.getVenueById);

// Create new venue
router.post('/', venueController.createVenue);

// Update venue
router.put('/:id', venueController.updateVenue);

// Delete venue
router.delete('/:id', venueController.deleteVenue);

// Get venue revenue analytics
router.get('/:id/revenue', venueController.getVenueRevenue);

// Get venue utilization
router.get('/:id/utilization', venueController.getVenueUtilization);

module.exports = router;