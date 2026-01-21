const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', auth(), authController.getCurrentUser);
router.put('/profile', auth(), authController.updateProfile);
router.post('/change-password', auth(), authController.changePassword);

// Admin only
router.get('/users', auth(['admin']), authController.getAllUsers);
router.put('/users/:id/role', auth(['admin']), authController.updateUserRole);

module.exports = router;
