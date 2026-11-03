const Calculation = require('../models/Calculation');

// @desc    Save a new calculation
// @route   POST /api/calculations
exports.saveCalculation = async (req, res) => {
    try {
        const { calculation_type, input_values, formula, steps, result, unit } = req.body;

        // Validation
        if (!calculation_type || !input_values || !formula || !result) {
            return res.status(400).json({ error: 'calculation_type, input_values, formula, and result are required.' });
        }

        const calculation = await Calculation.create({
            user_id: req.user.id,
            calculation_type,
            input_values,
            formula,
            steps: steps || [],
            result,
            unit: unit || ''
        });

        res.status(201).json({
            message: 'Calculation saved successfully',
            calculation
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        console.error('Save calculation error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Get all calculations for current user
// @route   GET /api/calculations
exports.getCalculations = async (req, res) => {
    try {
        const { type, page = 1, limit = 50 } = req.query;

        const query = { user_id: req.user.id };
        if (type) query.calculation_type = type;

        const calculations = await Calculation.find(query)
            .sort({ date_time: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Calculation.countDocuments(query);

        res.json({
            calculations,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get calculations error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Delete a calculation
// @route   DELETE /api/calculations/:id
exports.deleteCalculation = async (req, res) => {
    try {
        const calculation = await Calculation.findOne({
            _id: req.params.id,
            user_id: req.user.id
        });

        if (!calculation) {
            return res.status(404).json({ error: 'Calculation not found.' });
        }

        await Calculation.deleteOne({ _id: req.params.id });

        res.json({ message: 'Calculation deleted successfully.' });
    } catch (error) {
        console.error('Delete calculation error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Clear all calculations for current user
// @route   DELETE /api/calculations
exports.clearCalculations = async (req, res) => {
    try {
        const result = await Calculation.deleteMany({ user_id: req.user.id });
        res.json({ message: `${result.deletedCount} calculations cleared.` });
    } catch (error) {
        console.error('Clear calculations error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};
