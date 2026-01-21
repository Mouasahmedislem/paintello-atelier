const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  materialCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['cement', 'gypsum', 'additive', 'color', 'primer', 'finish', 'tool', 'other'],
    required: true
  },
  brand: String,
  currentStock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    enum: ['kg', 'L', 'bag', 'tube', 'bottle', 'piece', 'roll', 'm²'],
    required: true
  },
  minThreshold: {
    type: Number,
    required: true,
    default: 10,
    min: [0, 'Threshold cannot be negative']
  },
  unitCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  supplier: String,
  lastRestock: Date,
  nextRestock: Date,
  location: String,
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for low stock alerts
materialSchema.index({ currentStock: 1, minThreshold: 1 });

module.exports = mongoose.model('Material', materialSchema);
