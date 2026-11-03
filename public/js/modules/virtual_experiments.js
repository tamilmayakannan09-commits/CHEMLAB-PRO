// =================== VIRTUAL EXPERIMENTS MODULE ===================
// Renders the experiments hub, initializes individual experiment records, 
// and contains the custom SVG/HTML interactive simulation screens.

let activeExperiment = null; // Stores current active experiment model record from database
let localGuestExperiments = {}; // Fallback for Guest Mode mock storage

// Mock experiment object generator for Guest Mode
function getMockExperimentObject(expId, expData) {
    if (!localGuestExperiments[expId]) {
        localGuestExperiments[expId] = {
            _id: `guest_${expId}`,
            experiment_name: expData.name,
            experiment_type: expId,
            experiment_status: 'attempted',
            trials: [],
            average_result: null,
            theoretical_value: null,
            final_result: null,
            error_value: null,
            percentage_error_from_theoretical: null,
            percentage_error: null
        };
    }
    return localGuestExperiments[expId];
}

// 1. Renders the interactive experiments hub
function renderExperimentHub() {
    const hubContainer = document.getElementById('experimentsHubList');
    if (!hubContainer || typeof LAB_EXPERIMENTS === 'undefined') return;

    // Use cached guest data or check database if logged in
    hubContainer.innerHTML = LAB_EXPERIMENTS.map(exp => {
        const meta = (typeof TOPIC_META !== 'undefined' && TOPIC_META && TOPIC_META[exp.name]) ? TOPIC_META[exp.name] : { icon: "⚗️", color: "var(--accent)" };
        return `
            <div class="card glass-panel" style="cursor:pointer;" onclick="startLabExperiment('${exp.id}')">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                    <div style="font-size:1.5rem;">${meta.icon || '⚗️'}</div>
                    <span class="xp-badge" style="font-size:0.75rem;">100 XP</span>
                </div>
                <div style="font-weight:bold; font-size:1.1rem; color:var(--text); margin-bottom:0.5rem;">${exp.name}</div>
                <div style="font-size:0.8rem; color:var(--text3); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                    ${exp.aim}
                </div>
            </div>
        `;
    }).join('');
}

// 2. Starts or loads an experiment
async function startLabExperiment(expId) {
    const expData = LAB_EXPERIMENTS.find(e => e.id === expId);
    if (!expData) return;

    showPage('experimentActiveView');
    document.getElementById('activeExpTitle').textContent = expData.name;
    document.getElementById('activeExpAim').textContent = expData.aim;
    document.getElementById('activeExpTheory').textContent = expData.theory;

    // Fetch database record or use guest mock
    activeExperiment = await getOrCreateExperimentRecord(expId, expData);
    
    // Render the visual simulator
    loadSimulatorPanel(expId);
    
    // Render the trials table and statistics
    loadActiveExperimentView(activeExperiment);
}

// Sync helper
async function getOrCreateExperimentRecord(expId, expData) {
    if (!auth.isLoggedIn()) {
        return getMockExperimentObject(expId, expData);
    }
    
    try {
        const res = await api.get('/experiments');
        if (res && res.experiments) {
            const existing = res.experiments.find(e => e.experiment_type === expId);
            if (existing) {
                return existing;
            }
        }
        
        // Create new in backend
        const createRes = await api.post('/experiments', {
            experiment_name: expData.name,
            experiment_type: expId,
            chemicals_used: expData.chemicals.split(',').map(c => c.trim()),
            procedure: expData.procedure.join('\n'),
            experiment_status: 'attempted'
        });
        
        if (createRes && createRes.experiment) {
            return createRes.experiment;
        }
    } catch (e) {
        console.warn('Could not sync with backend database, falling back to mock storage', e);
    }
    return getMockExperimentObject(expId, expData);
}

// Render active UI updates
function loadActiveExperimentView(experiment) {
    activeExperiment = experiment;
    renderTrialTable(activeExperiment);
}

function closeExperimentView() {
    showPage('experimentsHub');
}

// =================== SIMULATION INJECTORS ===================

function loadSimulatorPanel(expId) {
    const area = document.getElementById('experimentSimulationArea');
    if (!area) return;

    // Setup clear basic markup
    area.innerHTML = `
        <div class="simulation-panel">
            <div class="apparatus-container" id="simApparatus"></div>
            <div id="simFeedback" style="color:var(--text2); text-align:center; min-height:30px; margin-bottom:1rem; font-weight:bold;"></div>
            <div class="sim-controls" id="simControls"></div>
        </div>
    `;

    // Dispatch the correct simulator screen
    switch (expId) {
        case 'standard_solution':
            initStandardSolutionSim();
            break;
        case 'acid_base_titration':
            initTitrationSim();
            break;
        case 'ph_determination':
            initPHDeterminationSim();
            break;
        case 'dilution':
            initDilutionSim();
            break;
        case 'reaction_rate':
            initReactionRateSim();
            break;
        case 'beer_lambert':
            initBeerLambertSim();
            break;
        case 'solubility':
            initSolubilitySim();
            break;
        case 'heat_neutralization':
            initHeatNeutralizationSim();
            break;
        case 'stoichiometry':
            initStoichiometrySim();
            break;
        case 'electrochemistry':
            initElectrochemistrySim();
            break;
    }
}

// ---------------- 1. Standard Solution Preparation ----------------
function initStandardSolutionSim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');
    
    app.innerHTML = `
        <div class="volumetric-flask" id="solFlask">
            <div class="flask-neck"></div>
            <div class="flask-body">
                <div class="flask-liquid" id="solFlaskLiquid"></div>
            </div>
            <div class="solute-particles" id="solParticles"></div>
        </div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">Solute</label>
            <select id="soluteType" class="input" style="width:100%;">
                <option value="Na2CO3">Sodium Carbonate (Na2CO3)</option>
                <option value="NaCl">Sodium Chloride (NaCl)</option>
            </select>
        </div>
        <div class="form-group">
            <label class="label">Target Concentration (M)</label>
            <input type="number" id="solMolarity" class="input" value="0.1" step="0.01">
        </div>
        <div class="form-group">
            <label class="label">Target Volume (mL)</label>
            <input type="number" id="solVolume" class="input" value="250" step="50">
        </div>
        <button class="btn btn-primary" onclick="runStandardSolutionTrial()">Prepare Solution</button>
    `;
}

async function runStandardSolutionTrial() {
    const solute = document.getElementById('soluteType').value;
    const molarity = parseFloat(document.getElementById('solMolarity').value) || 0.1;
    const volMl = parseFloat(document.getElementById('solVolume').value) || 250;
    
    const mm = solute === 'Na2CO3' ? 105.99 : 58.44;
    const targetMass = (molarity * (volMl / 1000) * mm).toFixed(4);

    // Animate dissolving
    const liquid = document.getElementById('solFlaskLiquid');
    const particleContainer = document.getElementById('solParticles');
    const feedback = document.getElementById('simFeedback');
    
    feedback.textContent = `Weighing and transferring ${targetMass}g of ${solute}...`;
    liquid.style.height = '0%';
    particleContainer.innerHTML = '';
    
    // Add particles falling
    for (let i = 0; i < 20; i++) {
        const dot = document.createElement('div');
        dot.className = 'particle-dot';
        dot.style.left = `${20 + Math.random() * 60}%`;
        dot.style.background = solute === 'Na2CO3' ? '#f0f4f8' : '#e2e8f0';
        dot.style.animation = `fall-and-dissolve 1.2s forwards ${i * 0.05}s`;
        particleContainer.appendChild(dot);
    }

    setTimeout(async () => {
        liquid.style.height = '75%';
        liquid.style.backgroundColor = 'rgba(0, 212, 255, 0.2)';
        feedback.textContent = `Solution successfully prepared! Recalculated concentration.`;
        
        const res = await addTrialToExperiment(activeExperiment._id, {
            inputs: { solute_type: solute, desired_molarity: molarity, volume_mL: volMl },
            observations: `Weighed ${targetMass}g solute. Dissolved in volumetric flask.`,
            result: `${molarity} M`
        });
        
        if (res) loadActiveExperimentView(res);
    }, 1500);
}

// ---------------- 2. Acid-Base Titration ----------------
let currentTitrationPH = 2.0;
let titrationVolAdded = 0.0;
let titrationInterval = null;

function initTitrationSim() {
    titrationVolAdded = 0.0;
    currentTitrationPH = 2.0;

    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; position:relative; width:60px;">
            <div class="burette" style="height:140px; margin-bottom:5px;" id="simBurette">
                <div class="burette-fill" id="simBuretteFill" style="height:100%; background:rgba(0,212,255,0.4);"></div>
            </div>
            <div class="titration-drop" id="simDrop"></div>
        </div>
        <div class="flask-container">
            <svg class="flask-svg" width="90" height="120" viewBox="0 0 100 120">
                <polygon points="35,10 65,10 65,40 90,110 10,110 35,40" fill="none" stroke="rgba(0,212,255,0.6)" stroke-width="3"/>
                <polygon id="simFlaskLiquid" points="36,40 64,40 85,105 15,105" fill="rgba(255,255,255,0.1)"/>
            </svg>
            <div style="font-size:0.75rem; color:var(--text3); margin-top:5px;" id="flaskPhVal">pH: 2.00</div>
        </div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">Indicator</label>
            <select id="titInd" class="input" style="width:100%;">
                <option value="phenolphthalein">Phenolphthalein</option>
                <option value="methyl_orange">Methyl Orange</option>
            </select>
        </div>
        <button class="btn btn-secondary" onclick="toggleBuretteFlow()" id="titFlowBtn">Start Drip</button>
        <button class="btn btn-primary" onclick="submitTitrationTrial()">Save Trial</button>
    `;
}

function toggleBuretteFlow() {
    const btn = document.getElementById('titFlowBtn');
    const fill = document.getElementById('simBuretteFill');
    const drop = document.getElementById('simDrop');
    const liquid = document.getElementById('simFlaskLiquid');
    const phDisp = document.getElementById('flaskPhVal');
    const ind = document.getElementById('titInd').value;

    if (titrationInterval) {
        clearInterval(titrationInterval);
        titrationInterval = null;
        btn.textContent = "Start Drip";
        btn.className = "btn btn-secondary";
        drop.style.animation = "none";
        return;
    }

    btn.textContent = "Stop Drip";
    btn.className = "btn btn-secondary active";
    drop.style.animation = "drop-fall 0.4s infinite";

    titrationInterval = setInterval(() => {
        titrationVolAdded += 0.2;
        
        // titration curves calculation
        const endpoint = 25.0; // Assume endpoint is at 25.0 mL
        if (titrationVolAdded < endpoint - 1) {
            currentTitrationPH = 2.0 + (titrationVolAdded * 0.1);
        } else if (titrationVolAdded < endpoint + 1) {
            // sharp rise
            currentTitrationPH = 3.5 + (titrationVolAdded - endpoint + 1) * 3.5;
        } else {
            currentTitrationPH = 11.0 + (titrationVolAdded - endpoint) * 0.05;
        }
        
        currentTitrationPH = Math.max(1, Math.min(13.8, currentTitrationPH));
        phDisp.textContent = `pH: ${currentTitrationPH.toFixed(2)}`;

        // Set indicator color
        let color = 'rgba(255,255,255,0.1)';
        if (ind === 'phenolphthalein') {
            color = currentTitrationPH > 8.3 ? `rgba(220, 60, 180, ${Math.min(0.7, (currentTitrationPH - 8.3) * 0.25)})` : 'rgba(255,255,255,0.1)';
        } else if (ind === 'methyl_orange') {
            color = currentTitrationPH < 3.1 ? 'rgba(255, 60, 60, 0.5)' : currentTitrationPH < 4.4 ? 'rgba(255, 140, 0, 0.5)' : 'rgba(255, 215, 0, 0.4)';
        }
        liquid.setAttribute('fill', color);

        // Adjust burette fill height
        fill.style.height = `${Math.max(0, 100 - (titrationVolAdded / 50 * 100))}%`;

        // If burette runs empty
        if (titrationVolAdded >= 50.0) {
            clearInterval(titrationInterval);
            titrationInterval = null;
            btn.textContent = "Start Drip";
            btn.className = "btn btn-secondary";
            drop.style.animation = "none";
        }
    }, 100);
}

async function submitTitrationTrial() {
    if (titrationInterval) {
        clearInterval(titrationInterval);
        titrationInterval = null;
        document.getElementById('titFlowBtn').textContent = "Start Drip";
        document.getElementById('simDrop').style.animation = "none";
    }

    if (titrationVolAdded === 0) {
        alert('Please run the titration simulation first.');
        return;
    }

    const ind = document.getElementById('titInd').value;
    const finalPH = currentTitrationPH;
    const vol = titrationVolAdded;

    // Check accuracy vs theoretical (25 mL)
    const err = Math.abs(vol - 25.0);
    const pctErr = (err / 25.0) * 100;

    const res = await addTrialToExperiment(activeExperiment._id, {
        inputs: { indicator: ind, base_added_mL: parseFloat(vol.toFixed(1)) },
        observations: `Endpoint pH: ${finalPH.toFixed(2)}`,
        result: `${vol.toFixed(1)} mL`
    });

    if (res) {
        // Also update the general experiment record with accuracy stats
        const finalUpdate = await api.put(`/experiments/${activeExperiment._id}`, {
            theoretical_value: 25.0,
            final_result: vol,
            error_value: err,
            percentage_error_from_theoretical: parseFloat(pctErr.toFixed(2))
        });
        loadActiveExperimentView(finalUpdate.experiment);
    }
}

// ---------------- 3. pH Determination ----------------
function initPHDeterminationSim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div class="tubes-container" id="phTubes">
            ${['HCl', 'Vinegar', 'Water', 'Ammonia', 'NaOH'].map((sol, idx) => `
                <div class="test-tube" onclick="determineTubePH(${idx}, '${sol}')" id="tube-${idx}">
                    <div class="tube-liquid" id="tube-liquid-${idx}"></div>
                    <div class="tube-label">${sol}</div>
                </div>
            `).join('')}
        </div>
    `;

    ctrl.innerHTML = `
        <div style="text-align:center; width:100%; color:var(--text3); font-size:0.9rem;">
            Click on a test tube to add Universal Indicator and determine its pH value.
        </div>
    `;
}

async function determineTubePH(idx, sol) {
    const liquid = document.getElementById(`tube-liquid-${idx}`);
    const feedback = document.getElementById('simFeedback');
    
    let color = '';
    let ph = 7;
    let desc = '';

    switch (sol) {
        case 'HCl':
            color = 'rgba(255, 0, 0, 0.7)';
            ph = 1.2;
            desc = "Strongly Acidic";
            break;
        case 'Vinegar':
            color = 'rgba(255, 140, 0, 0.6)';
            ph = 3.0;
            desc = "Weakly Acidic";
            break;
        case 'Water':
            color = 'rgba(0, 200, 50, 0.5)';
            ph = 7.0;
            desc = "Neutral";
            break;
        case 'Ammonia':
            color = 'rgba(0, 100, 255, 0.6)';
            ph = 10.5;
            desc = "Weakly Basic";
            break;
        case 'NaOH':
            color = 'rgba(148, 0, 211, 0.7)';
            ph = 13.5;
            desc = "Strongly Basic";
            break;
    }

    liquid.style.backgroundColor = color;
    feedback.textContent = `${sol} turns indicator to appropriate color shade. pH read: ${ph} (${desc})`;

    const res = await addTrialToExperiment(activeExperiment._id, {
        inputs: { solution: sol },
        observations: `${desc} color shade`,
        result: `pH ${ph}`
    });

    if (res) loadActiveExperimentView(res);
}

// ---------------- 4. Serial Dilution ----------------
let currentDilutionStep = 0;
let dilutionConc = 1.0;

function initDilutionSim() {
    currentDilutionStep = 0;
    dilutionConc = 1.0;

    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div style="display:flex; gap:15px; align-items:flex-end;">
            <div class="beaker" id="dilBeakerStock">
                <div class="beaker-liquid" style="height:80%; background:rgba(0, 100, 255, 0.75);"></div>
                <div style="position:absolute; top:5px; left:5px; font-size:0.65rem; font-weight:bold;">STOCK (1M)</div>
            </div>
            <div class="beaker" id="dilBeakerTube">
                <div class="beaker-liquid" id="dilLiquidTarget" style="height:0%; background:rgba(0, 100, 255, 0.75);"></div>
                <div style="position:absolute; top:5px; left:5px; font-size:0.65rem; font-weight:bold;" id="dilTargetLbl">Dilution #1</div>
            </div>
            <div class="pipette" id="dilPipette">
                <div class="pipette-liquid" id="dilPipetteLiquid"></div>
            </div>
        </div>
    `;

    ctrl.innerHTML = `
        <button class="btn btn-secondary" onclick="pipetteTransfer()">Draw & Dilute</button>
        <button class="btn btn-primary" onclick="resetDilutionSim()">Reset</button>
    `;
}

function resetDilutionSim() {
    initDilutionSim();
    document.getElementById('simFeedback').textContent = '';
}

function pipetteTransfer() {
    if (currentDilutionStep >= 5) {
        alert('Max dilutions reached for this set.');
        return;
    }

    const pip = document.getElementById('dilPipette');
    const pipLiq = document.getElementById('dilPipetteLiquid');
    const targetLiq = document.getElementById('dilLiquidTarget');
    const targetLbl = document.getElementById('dilTargetLbl');
    const feedback = document.getElementById('simFeedback');

    currentDilutionStep++;
    dilutionConc = dilutionConc / 2; // half dilution

    // Set colors based on concentration
    const blueIntensity = Math.min(0.85, dilutionConc * 0.75 + 0.1);
    const finalColor = `rgba(0, 100, 255, ${blueIntensity})`;

    feedback.textContent = "Drawing stock solute...";
    pip.style.transform = 'translate(-40px, 40px)';
    
    setTimeout(() => {
        pipLiq.style.height = '60%';
        
        setTimeout(() => {
            feedback.textContent = "Transferring to target beaker & adding solvent...";
            pip.style.transform = 'translate(40px, 40px)';
            
            setTimeout(async () => {
                pipLiq.style.height = '0%';
                targetLiq.style.height = '80%';
                targetLiq.style.backgroundColor = finalColor;
                targetLbl.textContent = `Dil. #${currentDilutionStep} (${dilutionConc.toFixed(3)}M)`;
                feedback.textContent = `Diluted to ${dilutionConc.toFixed(3)}M concentration.`;
                
                // Reposition pipette
                pip.style.transform = 'translateX(-50%)';

                const res = await addTrialToExperiment(activeExperiment._id, {
                    inputs: { step: currentDilutionStep, initial_concentration: dilutionConc * 2 },
                    observations: "Added equal part solvent (1:1 dilution)",
                    result: `${dilutionConc.toFixed(4)} M`
                });

                if (res) loadActiveExperimentView(res);
            }, 1000);
        }, 1000);
    }, 800);
}

// ---------------- 5. Reaction Rate ----------------
function initReactionRateSim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div class="beaker" style="width:120px; height:130px; margin-bottom:10px;">
            <div class="beaker-liquid" id="rateLiquid" style="height:70%; background:rgba(255,255,255,0.15);"></div>
        </div>
        <div id="rateTimer" style="font-family:var(--font-mono); font-size:1.5rem; color:var(--warning);">0.0s</div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">KIO3 Concentration (M)</label>
            <input type="number" id="rateConc" class="input" value="0.02" step="0.005">
        </div>
        <div class="form-group">
            <label class="label">Temperature (°C)</label>
            <input type="number" id="rateTemp" class="input" value="25" step="5">
        </div>
        <button class="btn btn-primary" onclick="runRateTrial()" id="rateBtn">Run Reaction</button>
    `;
}

function runRateTrial() {
    const conc = parseFloat(document.getElementById('rateConc').value) || 0.02;
    const temp = parseFloat(document.getElementById('rateTemp').value) || 25;
    const btn = document.getElementById('rateBtn');
    const timer = document.getElementById('rateTimer');
    const liquid = document.getElementById('rateLiquid');
    const feedback = document.getElementById('simFeedback');

    btn.disabled = true;
    liquid.style.backgroundColor = 'rgba(255,255,255,0.15)';
    feedback.textContent = "Reactants mixed. Tracking time to color change...";

    // Calculate time based on Arrhenius & concentration relations:
    // Rate ∝ concentration * Temp. So Time ∝ 1 / (concentration * Temp)
    const baseTime = 1.0 / (conc * (temp + 273.15) * 0.05);
    const finalTime = Math.max(1.5, Math.min(60.0, baseTime)); // bound time

    let curTime = 0.0;
    const clockInterval = setInterval(() => {
        curTime += 0.1;
        timer.textContent = `${curTime.toFixed(1)}s`;

        if (curTime >= finalTime) {
            clearInterval(clockInterval);
            liquid.style.backgroundColor = 'rgba(0, 0, 50, 0.9)'; // Turns blue-black
            feedback.textContent = `Endpoint reached! Sudden blue-black color change observed.`;
            btn.disabled = false;

            saveRateResults(conc, temp, finalTime);
        }
    }, 100);
}

async function saveRateResults(conc, temp, time) {
    const rate = 1 / time;
    const res = await addTrialToExperiment(activeExperiment._id, {
        inputs: { concentration_M: conc, temperature_C: temp },
        observations: "Sudden starch-iodine blue-black reaction",
        result: `${time.toFixed(1)} s`
    });

    if (res) loadActiveExperimentView(res);
}

// ---------------- 6. Beer-Lambert Law ----------------
function initBeerLambertSim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
            <div style="background:#112233; border:2px solid #00d4ff; width:160px; height:80px; display:flex; align-items:center; justify-content:center; border-radius:8px;">
                <div style="color:#00ff88; font-family:var(--font-mono); font-size:1.6rem;" id="specReadout">0.000 A</div>
            </div>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <div class="test-tube" style="width:24px; height:80px;">
                    <div class="tube-liquid" id="specCuvette" style="height:90%; background:rgba(0,100,255,0.05);"></div>
                </div>
            </div>
        </div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">CuSO4 Concentration (M)</label>
            <input type="number" id="specConc" class="input" value="0.2" step="0.05">
        </div>
        <button class="btn btn-primary" onclick="runSpectrophotometer()">Read Absorbance</button>
    `;
}

async function runSpectrophotometer() {
    const conc = parseFloat(document.getElementById('specConc').value) || 0.0;
    const cuv = document.getElementById('specCuvette');
    const readout = document.getElementById('specReadout');
    const feedback = document.getElementById('simFeedback');

    // A = e * b * c. Assume e*b = 1.5
    const abs = 1.5 * conc;
    
    // Set color concentration
    const blueIntensity = Math.min(0.85, conc * 1.2 + 0.05);
    cuv.style.backgroundColor = `rgba(0, 100, 255, ${blueIntensity})`;
    
    feedback.textContent = "Wavelength configured to 635nm. Scanning cuvette...";
    
    setTimeout(async () => {
        readout.textContent = `${abs.toFixed(3)} A`;
        feedback.textContent = `Scan complete. Absorbance value recorded.`;

        const res = await addTrialToExperiment(activeExperiment._id, {
            inputs: { concentration_M: conc },
            observations: `Absorbance read at 635 nm`,
            result: `${abs.toFixed(3)} A`
        });

        if (res) loadActiveExperimentView(res);
    }, 600);
}

// ---------------- 7. Solubility and Temperature ----------------
function initSolubilitySim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center;">
            <div class="beaker" style="width:110px; height:120px; margin-bottom:10px; position:relative;">
                <div class="beaker-liquid" id="solubLiquid" style="height:65%; background:rgba(0,212,255,0.15);"></div>
                <div class="solute-particles" id="solubCrystals" style="bottom:10px; height:15px; width:100%; display:none; background:rgba(255,255,255,0.6);"></div>
            </div>
            <div style="font-family:var(--font-mono); font-size:1.2rem; color:var(--accent2);" id="solubTemp">25.0 °C</div>
        </div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">KNO3 Solute Mass (g)</label>
            <input type="number" id="solubMass" class="input" value="30" step="5">
        </div>
        <button class="btn btn-primary" onclick="runSolubilityTrial()">Heat & Dissolve</button>
    `;
}

async function runSolubilityTrial() {
    const mass = parseFloat(document.getElementById('solubMass').value) || 30;
    const tempDisp = document.getElementById('solubTemp');
    const crystals = document.getElementById('solubCrystals');
    const feedback = document.getElementById('simFeedback');

    crystals.style.display = 'block'; // Initially undissolved crystals
    feedback.textContent = "Heating water to dissolve solute...";

    let temp = 25.0;
    // Assume solubility curve: kno3 solubility = 0.5 * temp^2 + 10. Dissolves when solubility > mass
    const targetTemp = Math.sqrt((mass - 10) / 0.5);
    const finalTemp = Math.max(30.0, Math.min(95.0, targetTemp + 5.0));

    const heatInterval = setInterval(() => {
        temp += 1.5;
        tempDisp.textContent = `${temp.toFixed(1)} °C`;

        if (temp >= finalTemp) {
            clearInterval(heatInterval);
            crystals.style.display = 'none'; // All dissolved
            feedback.textContent = `Solute completely dissolved at ${temp.toFixed(1)}°C. Recording cooling crystallization point.`;
            
            // Cool down back and record temperature where crystals reappear
            setTimeout(async () => {
                const cryTemp = Math.max(25.0, targetTemp);
                tempDisp.textContent = `${cryTemp.toFixed(1)} °C`;
                crystals.style.display = 'block';
                feedback.textContent = `Recrystallization point detected at ${cryTemp.toFixed(1)}°C.`;

                const res = await addTrialToExperiment(activeExperiment._id, {
                    inputs: { solute_mass_g: mass },
                    observations: `Recrystallization detected on cooling`,
                    result: `${cryTemp.toFixed(1)} °C`
                });

                if (res) loadActiveExperimentView(res);
            }, 1200);
        }
    }, 60);
}

// ---------------- 8. Heat of Neutralization ----------------
function initHeatNeutralizationSim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div style="display:flex; justify-content:center; position:relative; width:100px;">
            <div class="calorimeter-body">
                <div class="beaker-liquid" id="calorimLiquid" style="height:0%; background:rgba(0,212,255,0.25);"></div>
            </div>
            <div class="thermometer">
                <div class="thermometer-mercury" id="thermMercury" style="height:35%;"></div>
            </div>
        </div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">HCl Vol (mL)</label>
            <input type="number" id="hclVol" class="input" value="50" disabled style="opacity:0.5">
        </div>
        <div class="form-group">
            <label class="label">NaOH Vol (mL)</label>
            <input type="number" id="naohVol" class="input" value="50" disabled style="opacity:0.5">
        </div>
        <button class="btn btn-primary" onclick="runHeatTrial()">Mix & Read Temp</button>
    `;
}

async function runHeatTrial() {
    const liq = document.getElementById('calorimLiquid');
    const merc = document.getElementById('thermMercury');
    const feedback = document.getElementById('simFeedback');

    feedback.textContent = "Mixing 50mL of 1M HCl and 50mL of 1M NaOH in calorimeter...";
    liq.style.height = '70%';
    merc.style.height = '35%';

    // Typical heat: dT = 6.8 C. End Temp = 31.8 C
    setTimeout(async () => {
        merc.style.height = '60%'; // temperature rises
        feedback.textContent = "Reaction completed. Temperature increased from 25.0°C to 31.8°C.";

        // Calculate dH
        const m = 100; // 100g water
        const c = 4.184; // specific heat
        const dT = 6.8;
        const q = (m * c * dT) / 1000; // kJ
        const moles = 0.05; // 50 mL of 1M
        const dH = -(q / moles); // kJ/mol

        const res = await addTrialToExperiment(activeExperiment._id, {
            inputs: { volume_acid_mL: 50, volume_base_mL: 50 },
            observations: `Initial Temp: 25.0°C, Max Temp: 31.8°C`,
            result: `${dH.toFixed(1)} kJ/mol`
        });

        if (res) loadActiveExperimentView(res);
    }, 1200);
}

// ---------------- 9. Stoichiometry of Precipitation ----------------
function initStoichiometrySim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div style="display:flex; gap:10px; align-items:flex-end;">
            <div class="beaker" style="width:90px; height:100px;">
                <div class="beaker-liquid" id="precipLiquid" style="height:70%; background:rgba(255,255,255,0.15);"></div>
                <div style="position:absolute; bottom:0; left:0; width:100%; height:0%; background:rgba(255,255,255,0.7); transition:height 0.8s;" id="precipBottom"></div>
            </div>
        </div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">BaCl2 Volume (mL)</label>
            <input type="number" id="stoichBaCl" class="input" value="20" step="5">
        </div>
        <div class="form-group">
            <label class="label">Na2SO4 Volume (mL)</label>
            <input type="number" id="stoichNaSO" class="input" value="30" step="5">
        </div>
        <button class="btn btn-primary" onclick="runStoichTrial()">React & Filter</button>
    `;
}

async function runStoichTrial() {
    const v1 = parseFloat(document.getElementById('stoichBaCl').value) || 20;
    const v2 = parseFloat(document.getElementById('stoichNaSO').value) || 30;
    const bottom = document.getElementById('precipBottom');
    const feedback = document.getElementById('simFeedback');

    feedback.textContent = "Mixing solutions. White barium sulfate precipitate forming...";
    
    // Precipitate thickness depends on the limiting reactant. BaCl2 or Na2SO4.
    // Assume 0.1M concentrations. Limiting moles = min(v1, v2) * 0.1 / 1000
    const limitingVol = Math.min(v1, v2);
    const moles = (limitingVol * 0.1) / 1000;
    const BaSO4_MM = 233.39;
    const theoreticalMass = moles * BaSO4_MM;

    bottom.style.height = `${Math.min(40, limitingVol * 1.2)}%`;

    setTimeout(async () => {
        feedback.textContent = `Precipitate filtered, dried and weighed: ${theoreticalMass.toFixed(3)}g BaSO4 obtained.`;

        const res = await addTrialToExperiment(activeExperiment._id, {
            inputs: { volume_BaCl2_mL: v1, volume_Na2SO4_mL: v2 },
            observations: `Limiting reactant volume: ${limitingVol} mL`,
            result: `${theoreticalMass.toFixed(3)} g`
        });

        if (res) loadActiveExperimentView(res);
    }, 1200);
}

// ---------------- 10. Electrochemistry ----------------
function initElectrochemistrySim() {
    const app = document.getElementById('simApparatus');
    const ctrl = document.getElementById('simControls');

    app.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:flex-end; gap:1.5rem; position:relative; width:100%;">
            <div class="beaker" style="width:75px; height:80px; position:relative;">
                <div class="beaker-liquid" style="height:70%; background:rgba(0,100,255,0.08);"></div>
                <div class="electrode zinc"></div>
            </div>
            <div class="salt-bridge-u"></div>
            <div class="beaker" style="width:75px; height:80px; position:relative;">
                <div class="beaker-liquid" style="height:70%; background:rgba(0,100,255,0.18);"></div>
                <div class="electrode copper"></div>
            </div>
            <div style="position:absolute; top:-40px; background:#112233; border:2px solid gold; border-radius:4px; padding:3px 10px; color:#ffdd44; font-family:var(--font-mono); font-size:1.1rem;" id="voltReadout">0.00 V</div>
        </div>
    `;

    ctrl.innerHTML = `
        <div class="form-group">
            <label class="label">Zn2+ Conc (M)</label>
            <input type="number" id="cellZn" class="input" value="1.0" step="0.1">
        </div>
        <div class="form-group">
            <label class="label">Cu2+ Conc (M)</label>
            <input type="number" id="cellCu" class="input" value="1.0" step="0.1">
        </div>
        <button class="btn btn-primary" onclick="runCellTrial()">Connect Voltmeter</button>
    `;
}

async function runCellTrial() {
    const zn = parseFloat(document.getElementById('cellZn').value) || 1.0;
    const cu = parseFloat(document.getElementById('cellCu').value) || 1.0;
    const readout = document.getElementById('voltReadout');
    const feedback = document.getElementById('simFeedback');

    feedback.textContent = "Connecting electrodes and measuring potential difference...";

    // E_cell = E° - (0.0592/n) * log(Q)
    // E° for Zn-Cu is 1.10 V. n = 2. Q = [Zn2+] / [Cu2+]
    const Q = zn / cu;
    const emf = 1.10 - (0.0592 / 2) * Math.log10(Q);

    setTimeout(async () => {
        readout.textContent = `${emf.toFixed(3)} V`;
        feedback.textContent = `Spontaneous galvanic cell reading stabilized.`;

        const res = await addTrialToExperiment(activeExperiment._id, {
            inputs: { Zn2_concentration: zn, Cu2_concentration: cu },
            observations: `Redox electron transfer established`,
            result: `${emf.toFixed(3)} V`
        });

        if (res) loadActiveExperimentView(res);
    }, 1000);
}

// =================== GENERAL UTILITIES ===================

async function addTrialToExperiment(experimentId, trialData) {
    if (!auth.isLoggedIn()) {
        // Guest mode support
        const exp = activeExperiment;
        const newTrial = {
            trial_number: exp.trials.length + 1,
            inputs: trialData.inputs,
            observations: trialData.observations,
            result: trialData.result,
            date: new Date()
        };
        exp.trials.push(newTrial);

        // Calculate average result locally
        const values = exp.trials.map(t => parseFloat(t.result)).filter(v => !isNaN(v));
        if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            exp.average_result = parseFloat((sum / values.length).toFixed(4));
            
            const deviations = values.map(v => Math.abs(v - exp.average_result));
            const avgDev = deviations.reduce((a, b) => a + b, 0) / deviations.length;
            exp.percentage_error = exp.average_result !== 0 ? parseFloat(((avgDev / Math.abs(exp.average_result)) * 100).toFixed(2)) : 0;
        }

        return exp;
    }

    try {
        const res = await api.post(`/experiments/${experimentId}/trials`, trialData);
        if (res && res.experiment) {
            return res.experiment;
        }
    } catch (e) {
        console.error('Could not save trial', e);
    }
    return null;
}

// Bind load on start
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderExperimentHub === 'function') renderExperimentHub();
});
