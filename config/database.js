const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paintello', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // In production, don't crash - keep server running without DB
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  Continuing without database connection...');
      return null;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
