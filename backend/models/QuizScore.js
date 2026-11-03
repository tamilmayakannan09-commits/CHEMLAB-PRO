const mongoose = require('mongoose');

const quizScoreSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['Easy', 'Medium', 'Hard']
    },
    score: {
        type: Number,
        required: true
    },
    total_questions: {
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    time_taken: {
        type: Number,  // seconds
        required: true
    },
    xp_earned: {
        type: Number,
        default: 0
    },
    date_time: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient user-specific queries
quizScoreSchema.index({ user_id: 1, date_time: -1 });
quizScoreSchema.index({ user_id: 1, topic: 1 });

module.exports = mongoose.model('QuizScore', quizScoreSchema);
