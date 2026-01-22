const Product = require('../models/Product');
const ProductionLog = require('../models/ProductionLog');
const qr = require('qr-image');

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    productData.createdBy = req.user.userId;
    
    const product = new Product(productData);
    
    // Generate QR code
    if (!product.qrCode) {
      const qrData = {
        productCode: product.productCode,
        name: product.name,
        createdAt: product.creationDate
      };
      const qrSvg = qr.imageSync(JSON.stringify(qrData), { type: 'svg' });
      product.qrCode = qrSvg.toString();
    }
    
    await product.save();
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { status, category, limit = 50, page = 1 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get products by status
exports.getProductsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50, page = 1 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find({ status })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'username email');
    
    const total = await Product.countDocuments({ status });
    
    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    console.error('Error getting products by status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Get production history
    const history = await ProductionLog.find({
      'products.productCode': product.productCode
    }).sort('-date');
    
    res.json({
      success: true,
      data: {
        ...product.toObject(),
        history
      }
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update product status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    product.status = status;
    product.lastUpdated = Date.now();
    await product.save();
    
    res.json({
      success: true,
      data: product,
      message: `Product status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Batch update status for multiple products
exports.batchUpdateStatus = async (req, res) => {
  try {
    const { productIds, status } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0 || !status) {
      return res.status(400).json({
        success: false,
        error: 'Product IDs array and status are required'
      });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        status: status,
        lastUpdated: Date.now()
      }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} products to status: ${status}`,
      data: result
    });
  } catch (error) {
    console.error('Error in batch update status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get product statistics
exports.getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: '$count' },
          byStatus: {
            $push: {
              status: '$_id',
              count: '$count',
              quantity: '$totalQuantity'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'productionlogs',
          let: {},
          pipeline: [
            {
              $match: {
                date: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
              }
            },
            {
              $group: {
                _id: null,
                finishedThisWeek: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: '$products',
                        as: 'product',
                        cond: { $eq: ['$$product.action', 'finished'] }
                      }
                    }
                  }
                }
              }
            }
          ],
          as: 'weeklyProduction'
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0] || { totalProducts: 0, byStatus: [] }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
