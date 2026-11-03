const QuizScore = require('../models/QuizScore');

// @desc    Save a quiz score
// @route   POST /api/quiz/scores
exports.saveScore = async (req, res) => {
    try {
        const { topic, difficulty, score, total_questions, percentage, time_taken, xp_earned } = req.body;

        // Validation
        if (!topic || !difficulty || score === undefined || !total_questions || percentage === undefined || time_taken === undefined) {
            return res.status(400).json({ error: 'topic, difficulty, score, total_questions, percentage, and time_taken are required.' });
        }

        const quizScore = await QuizScore.create({
            user_id: req.user.id,
            topic,
            difficulty,
            score,
            total_questions,
            percentage,
            time_taken,
            xp_earned: xp_earned || 0
        });

        res.status(201).json({
            message: 'Quiz score saved successfully',
            quizScore
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        console.error('Save quiz score error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Get quiz score history for current user
// @route   GET /api/quiz/scores
exports.getScores = async (req, res) => {
    try {
        const { topic, difficulty, page = 1, limit = 50 } = req.query;

        const query = { user_id: req.user.id };
        if (topic) query.topic = topic;
        if (difficulty) query.difficulty = difficulty;

        const scores = await QuizScore.find(query)
            .sort({ date_time: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await QuizScore.countDocuments(query);

        res.json({
            scores,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get quiz scores error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};

// @desc    Get aggregate quiz stats for current user
// @route   GET /api/quiz/stats
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const totalQuizzes = await QuizScore.countDocuments({ user_id: userId });

        if (totalQuizzes === 0) {
            return res.json({
                totalQuizzes: 0,
                totalCorrect: 0,
                totalQuestions: 0,
                averagePercentage: 0,
                highestPercentage: 0,
                totalXP: 0,
                topicBreakdown: [],
                recentScores: []
            });
        }

        // Aggregate stats
        const aggregateStats = await QuizScore.aggregate([
            { $match: { user_id: req.user.id } },
            {
                $group: {
                    _id: null,
                    totalCorrect: { $sum: '$score' },
                    totalQuestions: { $sum: '$total_questions' },
                    averagePercentage: { $avg: '$percentage' },
                    highestPercentage: { $max: '$percentage' },
                    totalXP: { $sum: '$xp_earned' }
                }
            }
        ]);

        // Topic breakdown
        const topicBreakdown = await QuizScore.aggregate([
            { $match: { user_id: req.user.id } },
            {
                $group: {
                    _id: '$topic',
                    count: { $sum: 1 },
                    avgPercentage: { $avg: '$percentage' },
                    bestPercentage: { $max: '$percentage' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Recent scores
        const recentScores = await QuizScore.find({ user_id: userId })
            .sort({ date_time: -1 })
            .limit(10);

        const stats = aggregateStats[0] || {};

        res.json({
            totalQuizzes,
            totalCorrect: stats.totalCorrect || 0,
            totalQuestions: stats.totalQuestions || 0,
            averagePercentage: parseFloat((stats.averagePercentage || 0).toFixed(1)),
            highestPercentage: stats.highestPercentage || 0,
            totalXP: stats.totalXP || 0,
            topicBreakdown,
            recentScores
        });
    } catch (error) {
        console.error('Get quiz stats error:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};
