const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    default: () => `P${Date.now().toString().slice(-6)}`
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['statue', 'relief', 'ornament', 'custom', 'decoration'],
    default: 'statue'
  },
  status: {
    type: String,
    enum: ['molding', 'demolded', 'drying', 'ready_to_paint', 'painting', 'finished', 'packaged', 'shipped'],
    default: 'molding'
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  dimensions: {
    height: { type: Number, required: true }, // in cm
    width: { type: Number, required: true },
    depth: { type: Number, required: true }
  },
  weight: {
    type: Number,
    min: [0.1, 'Weight must be at least 0.1kg']
  },
  creationDate: {
    type: Date,
    default: Date.now
  },
  targetDate: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: String,
  qrCode: String,
  images: [String],
  location: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
