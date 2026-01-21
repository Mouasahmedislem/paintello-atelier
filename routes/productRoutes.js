const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth());

// Product routes
router.post('/', productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/stats', productController.getProductStats);
router.get('/status/:status', productController.getProductsByStatus);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/status', productController.updateStatus);
router.post('/batch/status', productController.batchUpdateStatus);

module.exports = router;
