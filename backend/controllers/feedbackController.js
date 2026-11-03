const Feedback = require('../models/Feedback');

// @desc    Submit feedback
// @route   POST /api/feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { rating, comments } = req.body;

        if (!rating) {
            return res.status(400).json({ error: 'Rating is required.' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        const feedback = await Feedback.create({
            user_id: req.user.id,
            rating,
            comments: comments || ''
        });

        res.status(201).json({
            message: 'Thank you for your feedback!',
            feedback
        });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};
