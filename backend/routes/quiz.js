const express = require('express');
const router = express.Router();
const { saveScore, getScores, getStats } = require('../controllers/quizController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// GET /api/quiz/stats
router.get('/stats', getStats);

// GET /api/quiz/scores
router.get('/scores', getScores);

// POST /api/quiz/scores
router.post('/scores', saveScore);

module.exports = router;
