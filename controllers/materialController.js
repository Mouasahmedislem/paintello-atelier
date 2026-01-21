const Material = require('../models/Material');
const ProductionLog = require('../models/ProductionLog');

// Create new material
exports.createMaterial = async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    
    res.status(201).json({
      success: true,
      data: material,
      message: 'Material created successfully'
    });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all materials
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ isActive: true }).sort('name');
    
    const totalValue = materials.reduce((sum, material) => {
      return sum + (material.currentStock * (material.unitCost || 0));
    }, 0);
    
    res.json({
      success: true,
      count: materials.length,
      totalValue: parseFloat(totalValue.toFixed(2)),
      data: materials
    });
  } catch (error) {
    console.error('Error getting materials:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get low stock materials
exports.getLowStock = async (req, res) => {
  try {
    const lowStockMaterials = await Material.find({
      currentStock: { $lt: { $min: ['$minThreshold', 10] } },
      isActive: true
    });
    
    res.json({
      success: true,
      count: lowStockMaterials.length,
      data: lowStockMaterials,
      warning: lowStockMaterials.length > 0 ? 
        `${lowStockMaterials.length} materials are low on stock` : 
        'All materials are sufficiently stocked'
    });
  } catch (error) {
    console.error('Error getting low stock:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Restock material
exports.restockMaterial = async (req, res) => {
  try {
    const { quantity, unitCost, supplier, notes } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }
    
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    material.currentStock += parseFloat(quantity);
    if (unitCost) material.unitCost = unitCost;
    if (supplier) material.supplier = supplier;
    material.lastRestock = new Date();
    
    await material.save();
    
    res.json({
      success: true,
      data: material,
      message: `Restocked ${quantity}${material.unit} of ${material.name}. New stock: ${material.currentStock}${material.unit}`
    });
  } catch (error) {
    console.error('Error restocking:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Use material
exports.useMaterial = async (req, res) => {
  try {
    const { materialCode, quantity, productCode } = req.body;
    
    const material = await Material.findOne({ materialCode });
    
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    if (material.currentStock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${material.currentStock}${material.unit}, Requested: ${quantity}${material.unit}`
      });
    }
    
    material.currentStock -= quantity;
    await material.save();
    
    res.json({
      success: true,
      data: {
        material: material.name,
        remaining: material.currentStock,
        unit: material.unit,
        lowStock: material.currentStock < material.minThreshold
      },
      message: `Used ${quantity}${material.unit} of ${material.name}`
    });
  } catch (error) {
    console.error('Error using material:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
