const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth());

// Report routes
router.get('/daily', reportController.generateDailyReport);
router.get('/weekly', reportController.generateWeeklyReport);
router.get('/monthly', reportController.generateMonthlyReport);
router.get('/excel', reportController.exportToExcel);
router.get('/material-consumption', reportController.materialConsumptionReport);
router.get('/productivity', reportController.productivityReport);

module.exports = router;
