const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
    trial_number: {
        type: Number,
        required: true
    },
    inputs: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    observations: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    result: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const experimentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    experiment_name: {
        type: String,
        required: true
    },
    chemicals_used: {
        type: [String],
        default: []
    },
    procedure: {
        type: String,
        default: ''
    },
    observations: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    calculated_result: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    experiment_status: {
        type: String,
        enum: ['attempted', 'completed'],
        default: 'attempted'
    },
    experiment_type: {
        type: String,
        enum: [
            'standard_solution', 'acid_base_titration', 'ph_determination',
            'dilution', 'reaction_rate', 'beer_lambert', 'solubility',
            'heat_neutralization', 'stoichiometry', 'electrochemistry',
            'general'
        ],
        default: 'general'
    },
    trials: [trialSchema],
    average_result: {
        type: Number,
        default: null
    },
    theoretical_value: {
        type: Number,
        default: null
    },
    final_result: {
        type: Number,
        default: null
    },
    error_value: {
        type: Number,
        default: null
    },
    percentage_error_from_theoretical: {
        type: Number,
        default: null
    },
    percentage_error: {
        type: Number,
        default: null
    },
    date_time: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient user-specific queries
experimentSchema.index({ user_id: 1, date_time: -1 });

module.exports = mongoose.model('Experiment', experimentSchema);
