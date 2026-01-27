const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware (REMOVED compression and helmet for now)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const productRoutes = require('./routes/productRoutes');
const materialRoutes = require('./routes/materialRoutes');
const productionRoutes = require('./routes/productionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');

// Database connection
const connectDB = require('./config/database');
connectDB();

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Paintello Atelier API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});
// Seed endpoint (run manually via browser or curl)
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Manual seed triggered via API');
    
    // Your seed logic here
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    // Check if users already exist
    const existingAdmin = await User.findOne({ email: 'admin@paintello.com' });
    const existingOperator = await User.findOne({ email: 'operator@paintello.com' });
    
    if (existingAdmin && existingOperator) {
      return res.json({ 
        success: false, 
        message: 'Users already exist. No seed needed.' 
      });
    }
    
    // Create users
    const salt = await bcrypt.genSalt(10);
    
    const users = [
      {
        username: 'admin',
        email: 'admin@paintello.com',
        password: await bcrypt.hash('Admin123!', salt),
        fullName: 'System Administrator',
        role: 'admin',
        phone: '+212600000000',
        isActive: true
      },
      {
        username: 'operator',
        email: 'operator@paintello.com',
        password: await bcrypt.hash('Operator123!', salt),
        fullName: 'Production Operator',
        role: 'operator',
        phone: '+212611111111',
        isActive: true
      }
    ];
    
    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${user.email}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Seed completed. Users created.',
      credentials: {
        admin: 'admin@paintello.com / Admin123!',
        operator: 'operator@paintello.com / Operator123!'
      }
    });
    
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// API Routes
app.use('/api/products', productRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
} else {
  // In development, just a simple response
  app.get('/', (req, res) => {
    res.json({
      message: '🎨 Paintello Atelier API - Development Mode',
      api: 'Available at /api endpoints',
      health: 'Check /health for system status'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      '/api/products',
      '/api/materials',
      '/api/production',
      '/api/reports',
      '/api/auth'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
});

// FIXED: Graceful shutdown (remove callback from mongoose.connection.close)
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received. Closing server...');
  server.close(() => {
    console.log('🔌 HTTP server closed');
    // Fix: Don't pass callback to mongoose.connection.close()
    mongoose.connection.close()
      .then(() => {
        console.log('🗄️  MongoDB connection closed');
        process.exit(0);
      })
      .catch(err => {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      });
  });
});

module.exports = app;
