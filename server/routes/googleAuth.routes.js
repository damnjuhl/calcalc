// server/routes/googleAuth.routes.js
const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuth.controller');

// Get Google OAuth URL
router.get('/auth-url', googleAuthController.getAuthUrl);

// Handle OAuth callback
router.get('/callback', googleAuthController.handleCallback);

// Manually sync calendar
router.post('/sync', googleAuthController.syncCalendar);

// List available calendars
router.get('/calendars', googleAuthController.listCalendars);

// Update default calendar
router.put('/default-calendar', googleAuthController.updateDefaultCalendar);

module.exports = router;