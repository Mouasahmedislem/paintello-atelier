[file name]: productionController.js
[file content begin]
const mongoose = require('mongoose');
const ProductionLog = require('../models/ProductionLog');
const Product = require('../models/Product');
const Material = require('../models/Material');
const moment = require('moment');

// 验证 ObjectId 的辅助函数
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get production log by ID - 修复版本
exports.getLogById = async (req, res) => {
  try {
    // 验证 ID 是否是有效的 ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid production log ID format'
      });
    }
    
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

// Update production log - 修复版本
exports.updateLog = async (req, res) => {
  try {
    // 验证 ID 是否是有效的 ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid production log ID format'
      });
    }
    
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

// Delete production log - 修复版本
exports.deleteLog = async (req, res) => {
  try {
    // 验证 ID 是否是有效的 ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid production log ID format'
      });
    }
    
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
[file content end]
