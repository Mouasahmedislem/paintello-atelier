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

// Get material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Error getting material:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update material
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    res.json({
      success: true,
      data: material,
      message: 'Material updated successfully'
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get low stock materials
exports.getLowStock = async (req, res) => {
  try {
    const materials = await Material.find({ isActive: true });
    
    // Filter materials with stock below threshold
    const lowStockMaterials = materials.filter(material => {
      const threshold = material.minThreshold || 10;
      return material.currentStock < threshold;
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

// Get material statistics
exports.getMaterialStats = async (req, res) => {
  try {
    const totalMaterials = await Material.countDocuments({ isActive: true });
    
    const materials = await Material.find({ isActive: true });
    
    // Calculate stats
    const lowStockCount = materials.filter(m => {
      const threshold = m.minThreshold || 10;
      return m.currentStock < threshold;
    }).length;
    
    const outOfStockCount = materials.filter(m => m.currentStock <= 0).length;
    
    const totalValue = materials.reduce((sum, material) => {
      return sum + (material.currentStock * (material.unitCost || 0));
    }, 0);
    
    // Group by type
    const materialsByType = {};
    materials.forEach(material => {
      if (!materialsByType[material.type]) {
        materialsByType[material.type] = 0;
      }
      materialsByType[material.type]++;
    });
    
    res.json({
      success: true,
      data: {
        totalMaterials,
        lowStockCount,
        outOfStockCount,
        totalValue: parseFloat(totalValue.toFixed(2)),
        materialsByType
      }
    });
  } catch (error) {
    console.error('Error getting material stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get materials by type
exports.getMaterialsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const materials = await Material.find({ 
      type: type,
      isActive: true 
    }).sort('name');
    
    res.json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error getting materials by type:', error);
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

// Search materials
exports.searchMaterials = async (req, res) => {
  try {
    const { query } = req.query;
    
    const materials = await Material.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { materialCode: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { supplier: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    }).sort('name');
    
    res.json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Error searching materials:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
