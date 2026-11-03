const Experiment = require('../models/Experiment');

// @desc    Save a new experiment
// @route   POST /api/experiments
exports.saveExperiment = async (req, res) => {
    try {
        const { experiment_name, chemicals_used, procedure, observations, calculated_result, experiment_status, trials } = req.body;

        if (!experiment_name) {
            return res.status(400).json({ error: 'experiment_name is required.' });
        }

        const experiment = await Experiment.create({
            user_id: req.user.id,
            experiment_name,
            chemicals_used: chemicals_used || [],
            procedure: procedure || '',
            observations: observations || {},
            calculated_result: calculated_result || {},
            experiment_status: experiment_status || 'attempted',
            trials: trials || []
        });

        res.status(201).json({
            message: 'Experiment saved successfully',
            experiment
        });
    } catch (error) {
        console.error('Save experiment error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Add a trial to an experiment
// @route   POST /api/experiments/:id/trials
exports.addTrial = async (req, res) => {
    try {
        const experiment = await Experiment.findOne({
            _id: req.params.id,
            user_id: req.user.id
        });

        if (!experiment) {
            return res.status(404).json({ error: 'Experiment not found.' });
        }

        const { inputs, observations, result } = req.body;

        if (!inputs || !result) {
            return res.status(400).json({ error: 'inputs and result are required for a trial.' });
        }

        const trialNumber = experiment.trials.length + 1;

        experiment.trials.push({
            trial_number: trialNumber,
            inputs,
            observations: observations || {},
            result
        });

        // Calculate average and percentage error if multiple trials
        if (experiment.trials.length > 1) {
            const results = experiment.trials.map(t => {
                if (typeof t.result === 'object' && t.result.value !== undefined) {
                    return parseFloat(t.result.value);
                }
                return parseFloat(t.result);
            }).filter(v => !isNaN(v));

            if (results.length > 0) {
                const avg = results.reduce((a, b) => a + b, 0) / results.length;
                experiment.average_result = parseFloat(avg.toFixed(4));

                // Calculate percentage error (relative to average)
                const deviations = results.map(r => Math.abs(r - avg));
                const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
                experiment.percentage_error = avg !== 0 ? parseFloat(((avgDeviation / Math.abs(avg)) * 100).toFixed(2)) : 0;
            }
        } else {
            const singleResult = typeof experiment.trials[0].result === 'object'
                ? parseFloat(experiment.trials[0].result.value)
                : parseFloat(experiment.trials[0].result);
            if (!isNaN(singleResult)) {
                experiment.average_result = singleResult;
                experiment.percentage_error = 0;
            }
        }

        await experiment.save();

        res.status(201).json({
            message: `Trial ${trialNumber} added successfully`,
            experiment
        });
    } catch (error) {
        console.error('Add trial error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Get all experiments for current user
// @route   GET /api/experiments
exports.getExperiments = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;

        const query = { user_id: req.user.id };
        if (status) query.experiment_status = status;

        const experiments = await Experiment.find(query)
            .sort({ date_time: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Experiment.countDocuments(query);

        res.json({
            experiments,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get experiments error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Get experiment history/statistics for current user
// @route   GET /api/experiments/history
exports.getExperimentHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const totalExperiments = await Experiment.countDocuments({ user_id: userId });
        const completedExperiments = await Experiment.countDocuments({ user_id: userId, experiment_status: 'completed' });
        const attemptedExperiments = await Experiment.countDocuments({ user_id: userId, experiment_status: 'attempted' });

        // Get total trials across all experiments
        const allExperiments = await Experiment.find({ user_id: userId });
        const totalTrials = allExperiments.reduce((sum, exp) => sum + exp.trials.length, 0);

        // Average result
        const completedWithResults = allExperiments.filter(e => e.average_result !== null);
        const averageScore = completedWithResults.length > 0
            ? completedWithResults.reduce((sum, e) => sum + (e.percentage_error !== null ? 100 - e.percentage_error : 0), 0) / completedWithResults.length
            : 0;

        // Recent experiments
        const recentExperiments = await Experiment.find({ user_id: userId })
            .sort({ date_time: -1 })
            .limit(5);

        res.json({
            totalExperiments,
            completedExperiments,
            attemptedExperiments,
            totalTrials,
            averageScore: parseFloat(averageScore.toFixed(1)),
            progressPercentage: totalExperiments > 0 ? parseFloat(((completedExperiments / 10) * 100).toFixed(1)) : 0,
            recentExperiments
        });
    } catch (error) {
        console.error('Get experiment history error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Delete an experiment
// @route   DELETE /api/experiments/:id
exports.deleteExperiment = async (req, res) => {
    try {
        const experiment = await Experiment.findOne({
            _id: req.params.id,
            user_id: req.user.id
        });

        if (!experiment) {
            return res.status(404).json({ error: 'Experiment not found.' });
        }

        await Experiment.deleteOne({ _id: req.params.id });

        res.json({ message: 'Experiment deleted successfully.' });
    } catch (error) {
        console.error('Delete experiment error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Update experiment status to completed
// @route   PATCH /api/experiments/:id/complete
exports.completeExperiment = async (req, res) => {
    try {
        const experiment = await Experiment.findOne({
            _id: req.params.id,
            user_id: req.user.id
        });

        if (!experiment) {
            return res.status(404).json({ error: 'Experiment not found.' });
        }

        experiment.experiment_status = 'completed';
        if (req.body.calculated_result) {
            experiment.calculated_result = req.body.calculated_result;
        }
        await experiment.save();

        res.json({
            message: 'Experiment marked as completed.',
            experiment
        });
    } catch (error) {
        console.error('Complete experiment error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Get experiment by ID
// @route   GET /api/experiments/:id
exports.getExperimentById = async (req, res) => {
    try {
        const experiment = await Experiment.findOne({
            _id: req.params.id,
            user_id: req.user.id
        });

        if (!experiment) {
            return res.status(404).json({ error: 'Experiment not found.' });
        }

        res.json(experiment);
    } catch (error) {
        console.error('Get experiment by ID error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Update experiment
// @route   PUT /api/experiments/:id
exports.updateExperiment = async (req, res) => {
    try {
        const { observations, calculated_result, theoretical_value, final_result, error_value, percentage_error_from_theoretical } = req.body;
        const experiment = await Experiment.findOne({
            _id: req.params.id,
            user_id: req.user.id
        });

        if (!experiment) {
            return res.status(404).json({ error: 'Experiment not found.' });
        }

        if (observations !== undefined) experiment.observations = observations;
        if (calculated_result !== undefined) experiment.calculated_result = calculated_result;
        if (theoretical_value !== undefined) experiment.theoretical_value = theoretical_value;
        if (final_result !== undefined) experiment.final_result = final_result;
        if (error_value !== undefined) experiment.error_value = error_value;
        if (percentage_error_from_theoretical !== undefined) experiment.percentage_error_from_theoretical = percentage_error_from_theoretical;

        await experiment.save();

        res.json({
            message: 'Experiment updated successfully',
            experiment
        });
    } catch (error) {
        console.error('Update experiment error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};
