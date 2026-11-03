// =================== ADVANCED CALCULATORS MODULE ===================
// Handles calculations, renders formulas and step-by-step solutions, and calls saveCalculationToDb()

// Helper to render steps on the UI and format them
function renderCalcResult(containerId, resultText, stepsArray) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let stepsHtml = stepsArray.map((step, idx) => {
        return `<div><b>Step ${idx + 1}:</b> ${step.description}<br><code style="color:var(--accent2);">${step.expression} = ${step.result}</code></div>`;
    }).join('<div style="margin: 0.5rem 0; border-top: 1px solid rgba(0, 212, 255, 0.05);"></div>');

    container.innerHTML = `
        <div class="result-box">
            <div class="result-label">Result</div>
            <div class="result-value" style="font-size:1.5rem; color:var(--accent); font-family:var(--font-title);">${resultText}</div>
        </div>
        <div class="adv-calc-steps" style="margin-top:1rem;">
            ${stepsHtml}
        </div>
    `;
}

// 1. Molality (m = n / kg)
async function calcMolality() {
    const moles = parseFloat(document.getElementById('advMolalityMoles').value);
    const kg = parseFloat(document.getElementById('advMolalityKg').value);

    if (isNaN(moles) || isNaN(kg) || kg <= 0) {
        alert('Please enter valid positive values.');
        return;
    }

    const molality = moles / kg;
    const resultText = `${molality.toFixed(4)} m`;
    const formula = "m = n / kg";

    const steps = [
        {
            description: "Identify the number of moles of solute (n) and mass of solvent in kilograms (kg)",
            expression: `n = ${moles} mol, kg = ${kg} kg`,
            result: "inputs loaded"
        },
        {
            description: "Apply the molality formula",
            expression: `m = ${moles} mol / ${kg} kg`,
            result: `${molality.toFixed(4)} mol/kg (m)`
        }
    ];

    renderCalcResult('advMolalityResult', resultText, steps);

    // Save calculation to DB
    await saveCalculationToDb({
        calculation_type: "Molality",
        input_values: { moles_solute: moles, mass_solvent_kg: kg },
        formula: formula,
        steps: steps,
        result: molality.toFixed(4),
        unit: "m"
    });
}

// 2. Normality (N = equivalents / L)
async function calcNormalityAdv() {
    const mass = parseFloat(document.getElementById('advNormalityMass').value);
    const eqWt = parseFloat(document.getElementById('advNormalityEqWt').value);
    const volL = parseFloat(document.getElementById('advNormalityVolL').value);

    if (isNaN(mass) || isNaN(eqWt) || isNaN(volL) || eqWt <= 0 || volL <= 0) {
        alert('Please enter valid positive values.');
        return;
    }

    const equivalents = mass / eqWt;
    const normality = equivalents / volL;
    const resultText = `${normality.toFixed(4)} N`;
    const formula = "N = mass / (Equivalent Weight * V(L))";

    const steps = [
        {
            description: "Calculate equivalents of solute: equivalents = mass / Equivalent Weight",
            expression: `eq = ${mass} g / ${eqWt} g/eq`,
            result: `${equivalents.toFixed(4)} eq`
        },
        {
            description: "Calculate normality: N = equivalents / Volume (L)",
            expression: `N = ${equivalents.toFixed(4)} eq / ${volL} L`,
            result: `${normality.toFixed(4)} N`
        }
    ];

    renderCalcResult('advNormalityResult', resultText, steps);

    await saveCalculationToDb({
        calculation_type: "Normality",
        input_values: { mass_solute: mass, equivalent_weight: eqWt, volume_solution_L: volL },
        formula: formula,
        steps: steps,
        result: normality.toFixed(4),
        unit: "N"
    });
}

// 3. % Concentration (w/w, w/v, v/v)
async function calcConcentration() {
    const soluteMass = parseFloat(document.getElementById('advConcSoluteMass').value) || 0;
    const soluteVol = parseFloat(document.getElementById('advConcSoluteVol').value) || 0;
    const solutionMass = parseFloat(document.getElementById('advConcSolutionMass').value) || 0;
    const solutionVol = parseFloat(document.getElementById('advConcSolutionVol').value) || 0;

    let results = [];
    let steps = [];

    // Weight/Weight (% w/w)
    if (soluteMass > 0 && solutionMass > 0) {
        const ww = (soluteMass / solutionMass) * 100;
        results.push(`${ww.toFixed(2)}% w/w`);
        steps.push({
            description: "Calculate weight-to-weight percentage: % w/w = (solute mass / solution mass) * 100",
            expression: `(${soluteMass} g / ${solutionMass} g) * 100`,
            result: `${ww.toFixed(2)}%`
        });
    }

    // Weight/Volume (% w/v)
    if (soluteMass > 0 && solutionVol > 0) {
        const wv = (soluteMass / solutionVol) * 100;
        results.push(`${wv.toFixed(2)}% w/v`);
        steps.push({
            description: "Calculate weight-to-volume percentage: % w/v = (solute mass / solution volume) * 100",
            expression: `(${soluteMass} g / ${solutionVol} mL) * 100`,
            result: `${wv.toFixed(2)}%`
        });
    }

    // Volume/Volume (% v/v)
    if (soluteVol > 0 && solutionVol > 0) {
        const vv = (soluteVol / solutionVol) * 100;
        results.push(`${vv.toFixed(2)}% v/v`);
        steps.push({
            description: "Calculate volume-to-volume percentage: % v/v = (solute volume / solution volume) * 100",
            expression: `(${soluteVol} mL / ${solutionVol} mL) * 100`,
            result: `${vv.toFixed(2)}%`
        });
    }

    if (results.length === 0) {
        alert('Please enter valid solute and solution values.');
        return;
    }

    const resultText = results.join(' | ');
    renderCalcResult('advConcResult', resultText, steps);

    await saveCalculationToDb({
        calculation_type: "Percentage Concentration",
        input_values: { solute_mass: soluteMass, solute_volume: soluteVol, solution_mass: solutionMass, solution_volume: solutionVol },
        formula: "% Concentration = (solute / solution) * 100",
        steps: steps,
        result: resultText,
        unit: "%"
    });
}

// 4. PPM (Parts Per Million)
async function calcPpmAdv() {
    const massMg = parseFloat(document.getElementById('advPpmMassMg').value);
    const volL = parseFloat(document.getElementById('advPpmVolL').value);

    if (isNaN(massMg) || isNaN(volL) || volL <= 0) {
        alert('Please enter valid positive values.');
        return;
    }

    const ppm = massMg / volL;
    const resultText = `${ppm.toFixed(3)} ppm`;
    const formula = "ppm = mass of solute (mg) / Volume of solution (L)";

    const steps = [
        {
            description: "Identify solute mass in mg and solution volume in L",
            expression: `solute = ${massMg} mg, volume = ${volL} L`,
            result: "inputs loaded"
        },
        {
            description: "PPM represents mg per Liter in aqueous solutions",
            expression: `${massMg} mg / ${volL} L`,
            result: `${ppm.toFixed(3)} ppm`
        }
    ];

    renderCalcResult('advPpmResult', resultText, steps);

    await saveCalculationToDb({
        calculation_type: "PPM",
        input_values: { mass_solute_mg: massMg, volume_solution_L: volL },
        formula: formula,
        steps: steps,
        result: ppm.toFixed(3),
        unit: "ppm"
    });
}

// 5. Ideal Gas Law (PV = nRT)
function updateGasLawUI() {
    const solveFor = document.getElementById('advGasSolve').value;
    
    // Disable input of variable we are solving for
    document.getElementById('advGasP').disabled = (solveFor === 'P');
    document.getElementById('advGasP').style.opacity = (solveFor === 'P') ? '0.5' : '1';
    
    document.getElementById('advGasV').disabled = (solveFor === 'V');
    document.getElementById('advGasV').style.opacity = (solveFor === 'V') ? '0.5' : '1';
    
    document.getElementById('advGasN').disabled = (solveFor === 'n');
    document.getElementById('advGasN').style.opacity = (solveFor === 'n') ? '0.5' : '1';
    
    document.getElementById('advGasT').disabled = (solveFor === 'T');
    document.getElementById('advGasT').style.opacity = (solveFor === 'T') ? '0.5' : '1';
}

async function calcGasLaw() {
    const solveFor = document.getElementById('advGasSolve').value;
    const R = 0.082057; // L * atm / (mol * K)

    let p = parseFloat(document.getElementById('advGasP').value);
    let v = parseFloat(document.getElementById('advGasV').value);
    let n = parseFloat(document.getElementById('advGasN').value);
    let t = parseFloat(document.getElementById('advGasT').value);

    let resultValue = 0;
    let unit = '';
    let steps = [];

    if (solveFor === 'P') {
        if (isNaN(v) || isNaN(n) || isNaN(t) || v <= 0 || n <= 0 || t <= 0) {
            alert('Please fill out V, n, and T with positive values.');
            return;
        }
        resultValue = (n * R * t) / v;
        unit = 'atm';
        steps.push(
            { description: "Rearrange PV=nRT to solve for P", expression: "P = nRT / V", result: "rearranged" },
            { description: "Substitute constants (R = 0.08206)", expression: `P = (${n} * 0.08206 * ${t}) / ${v}`, result: `${resultValue.toFixed(4)} atm` }
        );
    } else if (solveFor === 'V') {
        if (isNaN(p) || isNaN(n) || isNaN(t) || p <= 0 || n <= 0 || t <= 0) {
            alert('Please fill out P, n, and T with positive values.');
            return;
        }
        resultValue = (n * R * t) / p;
        unit = 'L';
        steps.push(
            { description: "Rearrange PV=nRT to solve for V", expression: "V = nRT / P", result: "rearranged" },
            { description: "Substitute constants (R = 0.08206)", expression: `V = (${n} * 0.08206 * ${t}) / ${p}`, result: `${resultValue.toFixed(4)} L` }
        );
    } else if (solveFor === 'n') {
        if (isNaN(p) || isNaN(v) || isNaN(t) || p <= 0 || v <= 0 || t <= 0) {
            alert('Please fill out P, V, and T with positive values.');
            return;
        }
        resultValue = (p * v) / (R * t);
        unit = 'mol';
        steps.push(
            { description: "Rearrange PV=nRT to solve for n", expression: "n = PV / RT", result: "rearranged" },
            { description: "Substitute constants (R = 0.08206)", expression: `n = (${p} * ${v}) / (0.08206 * ${t})`, result: `${resultValue.toFixed(4)} mol` }
        );
    } else if (solveFor === 'T') {
        if (isNaN(p) || isNaN(v) || isNaN(n) || p <= 0 || v <= 0 || n <= 0) {
            alert('Please fill out P, V, and n with positive values.');
            return;
        }
        resultValue = (p * v) / (n * R);
        unit = 'K';
        steps.push(
            { description: "Rearrange PV=nRT to solve for T", expression: "T = PV / nR", result: "rearranged" },
            { description: "Substitute constants (R = 0.08206)", expression: `T = (${p} * ${v}) / (${n} * 0.08206)`, result: `${resultValue.toFixed(2)} K` }
        );
    }

    const resultText = `${resultValue.toFixed(4)} ${unit}`;
    renderCalcResult('advGasResult', resultText, steps);

    await saveCalculationToDb({
        calculation_type: "Gas Law",
        input_values: { solve_for: solveFor, pressure_atm: p, volume_L: v, moles_n: n, temp_K: t },
        formula: "PV = nRT",
        steps: steps,
        result: resultValue.toFixed(4),
        unit: unit
    });
}

// 6. Acid-Base Neutralization (M1V1 = M2V2)
function updateNeutralizationUI() {
    const solveFor = document.getElementById('advNeutSolve').value;
    
    document.getElementById('advNeutM2').disabled = (solveFor === 'M2');
    document.getElementById('advNeutM2').style.opacity = (solveFor === 'M2') ? '0.5' : '1';
    
    document.getElementById('advNeutV2').disabled = (solveFor === 'V2');
    document.getElementById('advNeutV2').style.opacity = (solveFor === 'V2') ? '0.5' : '1';
}

async function calcNeutralization() {
    const solveFor = document.getElementById('advNeutSolve').value;

    let m1 = parseFloat(document.getElementById('advNeutM1').value);
    let v1 = parseFloat(document.getElementById('advNeutV1').value);
    let m2 = parseFloat(document.getElementById('advNeutM2').value);
    let v2 = parseFloat(document.getElementById('advNeutV2').value);

    let resultValue = 0;
    let unit = '';
    let steps = [];

    if (solveFor === 'M2') {
        if (isNaN(m1) || isNaN(v1) || isNaN(v2) || m1 <= 0 || v1 <= 0 || v2 <= 0) {
            alert('Please enter positive values for M1, V1, and V2.');
            return;
        }
        resultValue = (m1 * v1) / v2;
        unit = 'M';
        steps.push(
            { description: "Solve for M2 from M1V1 = M2V2", expression: "M2 = (M1 * V1) / V2", result: "rearranged" },
            { expression: `M2 = (${m1} M * ${v1} mL) / ${v2} mL`, result: `${resultValue.toFixed(4)} M` }
        );
    } else if (solveFor === 'V2') {
        if (isNaN(m1) || isNaN(v1) || isNaN(m2) || m1 <= 0 || v1 <= 0 || m2 <= 0) {
            alert('Please enter positive values for M1, V1, and M2.');
            return;
        }
        resultValue = (m1 * v1) / m2;
        unit = 'mL';
        steps.push(
            { description: "Solve for V2 from M1V1 = M2V2", expression: "V2 = (M1 * V1) / M2", result: "rearranged" },
            { expression: `V2 = (${m1} M * ${v1} mL) / ${m2} M`, result: `${resultValue.toFixed(2)} mL` }
        );
    }

    const resultText = `${resultValue.toFixed(4)} ${unit}`;
    renderCalcResult('advNeutResult', resultText, steps);

    await saveCalculationToDb({
        calculation_type: "Acid-Base Neutralization",
        input_values: { solve_for: solveFor, m1: m1, v1: v1, m2: m2, v2: v2 },
        formula: "M1V1 = M2V2",
        steps: steps,
        result: resultValue.toFixed(4),
        unit: unit
    });
}

// Bind UI loaders on tab clicks
document.addEventListener('DOMContentLoaded', () => {
    updateGasLawUI();
    updateNeutralizationUI();
});
