const mongoose = require('mongoose');

const calculationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    calculation_type: {
        type: String,
        required: true,
        enum: [
            'Molecular Weight',
            'Molarity',
            'Molality',
            'Normality',
            'Dilution',
            'pH',
            'pOH',
            'Mass-Mole Conversion',
            'Mole-Particle Conversion',
            'Percentage Concentration',
            'PPM',
            'Empirical Formula',
            'Molecular Formula',
            'Stoichiometry',
            'Gas Law',
            'Acid-Base Neutralization'
        ]
    },
    input_values: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    formula: {
        type: String,
        required: true
    },
    steps: [{
        description: String,
        expression: String,
        result: String
    }],
    result: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        default: ''
    },
    date_time: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient user-specific queries
calculationSchema.index({ user_id: 1, date_time: -1 });

module.exports = mongoose.model('Calculation', calculationSchema);
