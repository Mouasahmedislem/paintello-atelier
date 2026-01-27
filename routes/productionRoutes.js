const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const auth = require('../middleware/auth');

router.use(auth());

router.post('/', productionController.createLog);
router.post('/log', productionController.createLog);
router.get('/', productionController.getAllLogs);
router.get('/logs', productionController.getAllLogs);
router.get('/stats', productionController.getProductionStats);
router.get('/daily', productionController.getDailyProduction);
router.get('/performance', productionController.getPerformance);
router.get('/search', productionController.searchLogs);
router.get('/:id', productionController.getLogById);
router.put('/:id', productionController.updateLog);
router.delete('/:id', productionController.deleteLog);

module.exports = router;
