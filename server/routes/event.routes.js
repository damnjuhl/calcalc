// server/routes/event.routes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');

// Get all events
router.get('/', eventController.getAllEvents);

// Get event by ID
router.get('/:id', eventController.getEventById);

// Get events by calendar ID
router.get('/calendar/:calendarId', eventController.getEventsByCalendar);

// Get events by venue
router.get('/venue/:venueId', eventController.getEventsByVenue);

// Get events by date range
router.get('/range/:startDate/:endDate', eventController.getEventsByDateRange);

// Create new event
router.post('/', eventController.createEvent);

// Update event
router.put('/:id', eventController.updateEvent);

// Delete event
router.delete('/:id', eventController.deleteEvent);

module.exports = router;