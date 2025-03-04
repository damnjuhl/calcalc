// server/routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// Get financial overview
router.get('/overview', analyticsController.getFinancialOverview);

// Get revenue trend
router.get('/revenue-trend', analyticsController.getRevenueTrend);

// Get breakdown by categories
router.get('/category-breakdown', analyticsController.getCategoryBreakdown);

// Get breakdown by venues
router.get('/venue-breakdown', analyticsController.getVenueBreakdown);

// Get year-over-year comparison
router.get('/yearly-comparison', analyticsController.getYearlyComparison);

// Get quarterly comparison
router.get('/quarterly-comparison', analyticsController.getQuarterlyComparison);

// Get ROI analysis
router.get('/roi-analysis', analyticsController.getRoiAnalysis);

// Get venue growth analysis
router.get('/venue-growth', analyticsController.getVenueGrowth);

// Get income projections
router.get('/projections', analyticsController.getIncomeProjections);

// Get what-if scenario analysis
router.post('/what-if', analyticsController.getWhatIfAnalysis);

module.exports = router;