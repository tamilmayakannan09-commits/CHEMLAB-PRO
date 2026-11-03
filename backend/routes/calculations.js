const express = require('express');
const router = express.Router();
const { saveCalculation, getCalculations, deleteCalculation, clearCalculations } = require('../controllers/calculationController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// GET /api/calculations
router.get('/', getCalculations);

// POST /api/calculations
router.post('/', saveCalculation);

// DELETE /api/calculations (clear all)
router.delete('/', clearCalculations);

// DELETE /api/calculations/:id
router.delete('/:id', deleteCalculation);

module.exports = router;
