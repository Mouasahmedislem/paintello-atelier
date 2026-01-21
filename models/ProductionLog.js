const mongoose = require('mongoose');

const productionLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    default: 'morning'
  },
  products: [{
    productCode: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: ['started', 'demolded', 'dried', 'primed', 'painted', 'finished', 'packaged', 'quality_check']
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    timeSpent: Number, // in minutes
    notes: String
  }],
  materialsUsed: [{
    materialCode: String,
    materialName: String,
    quantity: Number,
    productCode: String,
    unit: String
  }],
  defects: [{
    productCode: String,
    defectType: String,
    description: String,
    resolved: {
      type: Boolean,
      default: false
    },
    resolutionNotes: String
  }],
  efficiency: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: String,
  workstation: String
}, {
  timestamps: true
});

// Index for date-based queries
productionLogSchema.index({ date: -1, operator: 1 });

module.exports = mongoose.model('ProductionLog', productionLogSchema);
