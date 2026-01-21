const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Product = require('../models/Product');
const Material = require('../models/Material');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (optional)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Material.deleteMany({});
    
    // Create admin user
    console.log('👑 Creating admin user...');
    const adminUser = new User({
      username: 'admin',
      email: 'admin@paintello.com',
      password: 'Admin123!',
      fullName: 'System Administrator',
      role: 'admin',
      phone: '+212600000000'
    });
    await adminUser.save();
    
    // Create operator user
    console.log('👷 Creating operator user...');
    const operatorUser = new User({
      username: 'operator',
      email: 'operator@paintello.com',
      password: 'Operator123!',
      fullName: 'Production Operator',
      role: 'operator',
      phone: '+212611111111'
    });
    await operatorUser.save();
    
    // Create initial materials
    console.log('📦 Creating materials...');
    const materials = [
      {
        materialCode: 'CEMENT-WHITE',
        name: 'Premium White Cement',
        type: 'cement',
        currentStock: 1000,
        unit: 'kg',
        minThreshold: 100,
        unitCost: 0.45,
        supplier: 'Cimentex Morocco',
        location: 'Storage Zone A1'
      },
      {
        materialCode: 'GYPSUM-POP',
        name: 'Plaster of Paris Gypsum',
        type: 'gypsum',
        currentStock: 500,
        unit: 'kg',
        minThreshold: 50,
        unitCost: 0.30,
        supplier: 'GypsumPro Casablanca',
        location: 'Storage Zone B2'
      },
      {
        materialCode: 'SIKALATEX',
        name: 'Sikalatex Additive',
        type: 'additive',
        currentStock: 100,
        unit: 'L',
        minThreshold: 10,
        unitCost: 12.50,
        supplier: 'Sika Morocco',
        location: 'Chemical Storage'
      },
      {
        materialCode: 'PIGMENT-WHITE',
        name: 'White Pigment Powder',
        type: 'color',
        currentStock: 50,
        unit: 'kg',
        minThreshold: 5,
        unitCost: 8.75,
        supplier: 'ColorMax Maroc',
        location: 'Color Storage'
      },
      {
        materialCode: 'PRIMER-ACRYLIC',
        name: 'Acrylic Primer',
        type: 'primer',
        currentStock: 200,
        unit: 'L',
        minThreshold: 20,
        unitCost: 15.00,
        supplier: 'PaintPro Rabat',
        location: 'Primer Storage'
      },
      {
        materialCode: 'VARNISH-MATTE',
        name: 'Matte Varnish Finish',
        type: 'finish',
        currentStock: 150,
        unit: 'L',
        minThreshold: 15,
        unitCost: 18.50,
        supplier: 'FinishMaster Casablanca',
        location: 'Finishing Storage'
      }
    ];
    
    await Material.insertMany(materials);
    console.log(`✅ ${materials.length} materials created`);
    
    // Create initial products
    console.log('🎨 Creating products...');
    const products = [
      {
        productCode: 'STATUE-VENUS-45',
        name: 'Venus Statue 45cm',
        category: 'statue',
        status: 'ready_to_paint',
        quantity: 15,
        dimensions: { height: 45, width: 15, depth: 15 },
        weight: 3.2,
        location: 'Shelf A3',
        createdBy: adminUser._id,
        notes: 'Classical statue, requires careful painting'
      },
      {
        productCode: 'STATUE-DAVID-60',
        name: 'David Statue 60cm',
        category: 'statue',
        status: 'molding',
        quantity: 8,
        dimensions: { height: 60, width: 20, depth: 20 },
        weight: 5.5,
        location: 'Molding Area 2',
        createdBy: adminUser._id,
        notes: 'Large statue, requires 48h drying time'
      },
      {
        productCode: 'RELIEF-FLORAL-60x40',
        name: 'Floral Wall Relief 60x40cm',
        category: 'relief',
        status: 'finished',
        quantity: 6,
        dimensions: { height: 60, width: 40, depth: 5 },
        weight: 2.0,
        location: 'Finished Goods Area',
        createdBy: operatorUser._id,
        notes: 'Ready for shipping'
      },
      {
        productCode: 'ORN-CORINTHIAN',
        name: 'Corinthian Column Ornament',
        category: 'ornament',
        status: 'painting',
        quantity: 12,
        dimensions: { height: 30, width: 10, depth: 10 },
        weight: 1.8,
        location: 'Painting Station 1',
        createdBy: operatorUser._id,
        notes: 'Gold leaf finish required'
      },
      {
        productCode: 'CUSTOM-LOGO-30',
        name: 'Custom Logo Plaque 30cm',
        category: 'custom',
        status: 'demolded',
        quantity: 5,
        dimensions: { height: 30, width: 30, depth: 3 },
        weight: 1.2,
        location: 'Drying Rack 3',
        createdBy: adminUser._id,
        notes: 'Client: ABC Company, deliver by Friday'
      }
    ];
    
    await Product.insertMany(products);
    console.log(`✅ ${products.length} products created`);
    
    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==================================');
    console.log('👥 Users: 2 created');
    console.log('📦 Materials: 6 created');
    console.log('🎨 Products: 5 created');
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@paintello.com / Admin123!');
    console.log('Operator: operator@paintello.com / Operator123!');
    console.log('\n⚠️  IMPORTANT: Change passwords after first login!');
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
