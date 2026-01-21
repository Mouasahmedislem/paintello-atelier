const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth());

// Production routes
router.post('/log', productionController.createLog);
router.get('/logs', productionController.getAllLogs);
router.get('/daily', productionController.getDailyProduction);
router.get('/weekly', productionController.getWeeklyProduction);
router.get('/monthly', productionController.getMonthlyProduction);
router.get('/logs/:date', productionController.getLogsByDate);
router.get('/performance', productionController.getPerformance);

module.exports = router;
