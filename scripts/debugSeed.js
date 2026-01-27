const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 DEBUG SEED SCRIPT');
console.log('====================');

console.log('1. Checking environment:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   MONGODB_URI exists:', !!process.env.MONGODB_URI);
if (process.env.MONGODB_URI) {
  const masked = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log('   MONGODB_URI:', masked);
}

console.log('\n2. Testing mongoose connection...');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paintello', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const db = mongoose.connection.db;
  console.log('   Database name:', db.databaseName);
  
  // List collections
  const collections = await db.listCollections().toArray();
  console.log('\n3. Collections in database:');
  collections.forEach(col => {
    console.log(`   - ${col.name}`);
  });
  
  // Try to require models
  console.log('\n4. Testing models...');
  try {
    const User = require('../models/User');
    console.log('   ✅ User model loaded');
    
    // Count users
    const userCount = await User.countDocuments();
    console.log(`   📊 Total users: ${userCount}`);
    
    if (userCount === 0) {
      console.log('   ⚠️  No users found in database');
    }
  } catch (error) {
    console.log('   ❌ Error loading User model:', error.message);
  }
  
  // Try to create a test document
  console.log('\n5. Creating test document...');
  try {
    const Test = mongoose.model('Test', new mongoose.Schema({ name: String, createdAt: Date }));
    
    await Test.create({ 
      name: 'Test from debug script',
      createdAt: new Date()
    });
    
    const testCount = await Test.countDocuments();
    console.log(`   ✅ Test documents: ${testCount}`);
  } catch (error) {
    console.log('   ❌ Error creating test:', error.message);
  }
  
  mongoose.disconnect();
  console.log('\n🔌 Disconnected');
  process.exit(0);
})
.catch(error => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});
