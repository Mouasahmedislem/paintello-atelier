const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth());

// Material routes
router.post('/', auth(['admin', 'manager']), materialController.createMaterial);
router.get('/', materialController.getAllMaterials);
router.get('/low-stock', materialController.getLowStock);
router.get('/stats', materialController.getMaterialStats);
router.get('/:id', materialController.getMaterialById);
router.put('/:id', materialController.updateMaterial);
router.delete('/:id', auth(['admin']), materialController.deleteMaterial);
router.post('/:id/restock', materialController.restockMaterial);
router.post('/use', materialController.useMaterial);
router.get('/type/:type', materialController.getMaterialsByType);

module.exports = router;
