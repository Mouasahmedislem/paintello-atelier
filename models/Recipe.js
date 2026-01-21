const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    recipeCode: {
        type: String,
        required: true,
        unique: true,
        default: () => `REC${Date.now().toString().slice(-6)}`
    },
    productType: {
        type: String,
        required: true,
        trim: true
    },
    productName: String,
    productCategory: {
        type: String,
        enum: ['statue', 'relief', 'ornament', 'custom']
    },
    productSize: {
        height: { type: Number, required: true },
        width: { type: Number, required: true },
        depth: { type: Number, required: true }
    },
    materials: [{
        materialCode: String,
        materialName: String,
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: String,
        stage: {
            type: String,
            enum: ['mixing', 'molding', 'finishing', 'painting', 'all'],
            default: 'all'
        },
        notes: String
    }],
    productionSteps: [{
        stepNumber: Number,
        stepName: String,
        description: String,
        duration: Number, // in minutes
        requiredTools: [String],
        temperature: String,
        humidity: String,
        qualityCheckpoints: [String],
        notes: String
    }],
    timeEstimates: {
        mixingTime: Number, // in minutes
        moldingTime: Number,
        dryingTime: Number, // in hours
        paintingTime: Number,
        finishingTime: Number,
        totalTime: Number // in hours
    },
    difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
    },
    yield: {
        type: Number,
        min: 1,
        default: 1,
        description: 'Number of products per batch'
    },
    wastePercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 5
    },
    qualityStandards: [{
        parameter: String,
        minValue: Number,
        maxValue: Number,
        unit: String
    }],
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
recipeSchema.index({ productType: 1, productCategory: 1, isActive: 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
