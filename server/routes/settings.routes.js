// server/routes/settings.routes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const auth = require('../middleware/auth');

// Get all settings
router.get('/', auth, settingsController.getSettings);

// Get sync settings
router.get('/sync', auth, settingsController.getSyncSettings);

// Update sync settings
router.post('/sync', auth, settingsController.updateSyncSettings);

// Update UI preferences
router.post('/ui', auth, settingsController.updateUiPreferences);

// Update financial preferences
router.post('/financial', auth, settingsController.updateFinancialPreferences);

module.exports = router;