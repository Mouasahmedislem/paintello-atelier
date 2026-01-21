const ProductionLog = require('../models/ProductionLog');
const Product = require('../models/Product');
const Material = require('../models/Material');
const moment = require('moment');

// Create production log
exports.createLog = async (req, res) => {
  try {
    const { products, materialsUsed, ...otherData } = req.body;
    
    // Validate products exist
    for (const product of products) {
      const productExists = await Product.findOne({ productCode: product.productCode });
      if (!productExists) {
        return res.status(400).json({
          success: false,
          error: `Product ${product.productCode} not found`
        });
      }
    }
    
    // Validate materials exist and have sufficient stock
    for (const material of materialsUsed) {
      const materialExists = await Material.findOne({ materialCode: material.materialCode });
      if (!materialExists) {
        return res.status(400).json({
          success: false,
          error: `Material ${material.materialCode} not found`
        });
      }
      
      if (materialExists.currentStock < material.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${materialExists.name}. Available: ${materialExists.currentStock}${materialExists.unit}`
        });
      }
    }
    
    // Create log
    const log = new ProductionLog({
      ...otherData,
      products,
      materialsUsed,
      operator: req.user.userId,
      date: new Date()
    });
    
    await log.save();
    
    // Update product statuses
    for (const product of products) {
      await Product.findOneAndUpdate(
        { productCode: product.productCode },
        { 
          status: product.action,
          lastUpdated: new Date(),
          $inc: { quantity: product.action === 'finished' ? -product.quantity : 0 }
        }
      );
    }
    
    // Update material stock
    for (const material of materialsUsed) {
      await Material.findOneAndUpdate(
        { materialCode: material.materialCode },
        { $inc: { currentStock: -material.quantity } }
      );
    }
    
    res.status(201).json({
      success: true,
      data: log,
      message: 'Production log created successfully'
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get daily production
exports.getDailyProduction = async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment(today).add(1, 'day').toDate();
    
    const logs = await ProductionLog.find({
      date: { $gte: today, $lt: tomorrow }
    })
    .populate('operator', 'username email')
    .sort('-createdAt');
    
    const summary = {
      totalProducts: 0,
      finishedProducts: 0,
      byStatus: {},
      materialsUsed: {},
      defects: 0
    };
    
    logs.forEach(log => {
      summary.totalProducts += log.products.length;
      
      log.products.forEach(product => {
        summary.byStatus[product.action] = (summary.byStatus[product.action] || 0) + 1;
        if (product.action === 'finished') summary.finishedProducts++;
      });
      
      log.materialsUsed.forEach(material => {
        if (!summary.materialsUsed[material.materialName]) {
          summary.materialsUsed[material.materialName] = {
            quantity: 0,
            unit: material.unit
          };
        }
        summary.materialsUsed[material.materialName].quantity += material.quantity;
      });
      
      summary.defects += log.defects.length;
    });
    
    res.json({
      success: true,
      date: moment().format('YYYY-MM-DD'),
      logs,
      summary,
      count: logs.length
    });
  } catch (error) {
    console.error('Error getting daily production:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get performance metrics
exports.getPerformance = async (req, res) => {
  try {
    const startOfWeek = moment().startOf('week');
    const endOfWeek = moment().endOf('week');
    
    const [logs, products] = await Promise.all([
      ProductionLog.find({
        date: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
      }),
      Product.find({
        createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
      })
    ]);
    
    const totalTime = logs.reduce((sum, log) => {
      return sum + log.products.reduce((s, p) => s + (p.timeSpent || 0), 0);
    }, 0);
    
    const finishedProducts = products.filter(p => p.status === 'finished').length;
    
    const performance = {
      weekStart: startOfWeek.format('YYYY-MM-DD'),
      weekEnd: endOfWeek.format('YYYY-MM-DD'),
      totalProducts: products.length,
      finishedProducts,
      completionRate: products.length > 0 ? (finishedProducts / products.length * 100).toFixed(1) : 0,
      averageTimePerProduct: logs.length > 0 ? (totalTime / logs.length).toFixed(1) : 0,
      totalLogs: logs.length,
      efficiency: logs.length > 0 ? 
        logs.reduce((sum, log) => sum + (log.efficiency || 0), 0) / logs.length : 0
    };
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error getting performance:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
