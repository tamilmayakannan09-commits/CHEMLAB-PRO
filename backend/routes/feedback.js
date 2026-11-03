const express = require('express');
const router = express.Router();
const { submitFeedback } = require('../controllers/feedbackController');
const auth = require('../middleware/auth');

// POST /api/feedback (protected)
router.post('/', auth, submitFeedback);

module.exports = router;
