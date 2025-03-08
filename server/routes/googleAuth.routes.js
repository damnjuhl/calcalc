// server/routes/googleAuth.routes.js
const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuth.controller');
const auth = require('../middleware/auth');

// Public routes (no auth required)
// Get Google OAuth URL
router.get('/auth-url', googleAuthController.getAuthUrl);

// Handle OAuth callback
router.get('/callback', googleAuthController.handleCallback);

// Protected routes (auth required)
// Bidirectional sync calendar
router.post('/sync', auth, googleAuthController.syncCalendar);

// Import from Google (one-way)
router.post('/import', auth, googleAuthController.importEvents);

// Export to Google (one-way)
router.post('/export', auth, googleAuthController.exportEvents);

// List available calendars
router.get('/calendars', auth, googleAuthController.listCalendars);

// Update default calendar
router.put('/default-calendar', auth, googleAuthController.updateDefaultCalendar);

// Update sync settings
router.post('/settings', auth, googleAuthController.updateSyncSettings);

module.exports = router;