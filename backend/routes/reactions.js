const express = require('express');
const router = express.Router();

/**
 * Chemistry Simulation Engine
 * POST /api/reactions/simulate
 * Body: { reactants: ['Na', 'H2O'] }
 */
router.post('/simulate', (req, res) => {
    const { reactants } = req.body;

    if (!reactants || !Array.isArray(reactants) || reactants.length < 2) {
        return res.status(400).json({ error: 'Please provide at least two reactants.' });
    }

    // Sort to make matching easier (e.g., ['H2O', 'Na'] becomes ['H2O', 'Na'])
    const sortedReactants = [...reactants].sort();
    const combo = sortedReactants.join(' + ');

    let result = {
        equation: 'No reaction',
        thermodynamics: 'Neutral',
        temperatureShift: '0°C',
        byproducts: [],
        hazards: [],
        moles: '0'
    };

    // Reaction Database Logic
    if (combo === 'H2O + Na' || combo === 'Na + H2O') {
        result = {
            equation: '2Na(s) + 2H2O(l) → 2NaOH(aq) + H2(g)',
            thermodynamics: 'Exothermic',
            temperatureShift: '+85°C',
            byproducts: ['H2 (Gas Evolution)'],
            hazards: ['Highly Exothermic', 'Flammable Hydrogen Gas', 'Corrosive NaOH formed'],
            moles: '2 moles of NaOH, 1 mole of H2'
        };
    } else if (combo === 'HCl + NaOH' || combo === 'NaOH + HCl') {
        result = {
            equation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H2O(l)',
            thermodynamics: 'Exothermic',
            temperatureShift: '+12°C',
            byproducts: [],
            hazards: ['Mildly Exothermic'],
            moles: '1 mole of NaCl, 1 mole of H2O'
        };
    } else if (combo === 'AgNO3 + NaCl' || combo === 'NaCl + AgNO3') {
        result = {
            equation: 'AgNO3(aq) + NaCl(aq) → AgCl(s)↓ + NaNO3(aq)',
            thermodynamics: 'Neutral',
            temperatureShift: '+1°C',
            byproducts: ['AgCl (White Precipitate)'],
            hazards: [],
            moles: '1 mole of AgCl solid'
        };
    } else if (combo.includes('H2O')) {
         result = {
            equation: `${reactants[0]} dissolves in H2O`,
            thermodynamics: 'Endothermic/Exothermic depending on salt',
            temperatureShift: '+/- 2°C',
            byproducts: ['Aqueous solution'],
            hazards: [],
            moles: 'Dissolved state'
        };
    } else {
        result = {
            equation: `${combo} → No observable reaction`,
            thermodynamics: 'Neutral',
            temperatureShift: '0°C',
            byproducts: [],
            hazards: [],
            moles: 'N/A'
        };
    }

    // Simulate calculation loader delay
    setTimeout(() => {
        res.json(result);
    }, 1000);
});

module.exports = router;
