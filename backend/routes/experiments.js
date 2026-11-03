const express = require('express');
const router = express.Router();
const { saveExperiment, addTrial, getExperiments, getExperimentHistory, deleteExperiment, completeExperiment, getExperimentById, updateExperiment } = require('../controllers/experimentController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// GET /api/experiments/history (must be before /:id routes)
router.get('/history', getExperimentHistory);

// GET /api/experiments
router.get('/', getExperiments);

// POST /api/experiments
router.post('/', saveExperiment);

// POST /api/experiments/:id/trials
router.post('/:id/trials', addTrial);

// PATCH /api/experiments/:id/complete
router.patch('/:id/complete', completeExperiment);

// GET /api/experiments/:id
router.get('/:id', getExperimentById);

// PUT /api/experiments/:id
router.put('/:id', updateExperiment);

// DELETE /api/experiments/:id
router.delete('/:id', deleteExperiment);

module.exports = router;
