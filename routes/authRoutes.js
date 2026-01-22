const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/me', auth(), authController.getCurrentUser);
router.put('/profile', auth(), authController.updateProfile);
router.put('/password', auth(), authController.updatePassword);

// Admin routes
router.get('/users', auth(['admin']), authController.getAllUsers);
router.get('/users/:id', auth(['admin']), authController.getUserById);
router.put('/users/:id', auth(['admin']), authController.updateUser);
router.delete('/users/:id', auth(['admin']), authController.deleteUser);

module.exports = router;
