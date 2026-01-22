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

// Get all production logs
exports.getAllLogs = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const skip = (page - 1) * limit;
    
    const logs = await ProductionLog.find(query)
      .sort('-date')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('operator', 'username email');
    
    const total = await ProductionLog.countDocuments(query);
    
    res.json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    console.error('Error getting production logs:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get production log by ID
exports.getLogById = async (req, res) => {
  try {
    const log = await ProductionLog.findById(req.params.id)
      .populate('operator', 'username email');
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Production log not found'
      });
    }
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error getting production log:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update production log
exports.updateLog = async (req, res) => {
  try {
    const log = await ProductionLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Production log not found'
      });
    }
    
    res.json({
      success: true,
      data: log,
      message: 'Production log updated successfully'
    });
  } catch (error) {
    console.error('Error updating production log:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete production log
exports.deleteLog = async (req, res) => {
  try {
    const log = await ProductionLog.findByIdAndDelete(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Production log not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Production log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting production log:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
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

// Get production statistics
exports.getProductionStats = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [weeklyLogs, monthlyLogs, totalLogs] = await Promise.all([
      ProductionLog.countDocuments({ date: { $gte: lastWeek } }),
      ProductionLog.countDocuments({
        date: {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
        }
      }),
      ProductionLog.countDocuments({})
    ]);
    
    const stats = await ProductionLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
          totalProducts: { $sum: { $size: "$products" } }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    res.json({
      success: true,
      data: {
        weeklyLogs,
        monthlyLogs,
        totalLogs,
        dailyStats: stats
      }
    });
  } catch (error) {
    console.error('Error getting production stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Search production logs
exports.searchLogs = async (req, res) => {
  try {
    const { query, field = 'all' } = req.query;
    const { limit = 50, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const skip = (page - 1) * limit;
    let searchQuery = {};
    
    if (field === 'all') {
      searchQuery = {
        $or: [
          { 'products.productCode': { $regex: query, $options: 'i' } },
          { 'products.productName': { $regex: query, $options: 'i' } },
          { 'materialsUsed.materialName': { $regex: query, $options: 'i' } },
          { notes: { $regex: query, $options: 'i' } }
        ]
      };
    } else {
      searchQuery[field] = { $regex: query, $options: 'i' };
    }
    
    const logs = await ProductionLog.find(searchQuery)
      .sort('-date')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('operator', 'username email');
    
    const total = await ProductionLog.countDocuments(searchQuery);
    
    res.json({
      success: true,
      count: logs.length,
      total,
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    console.error('Error searching production logs:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
