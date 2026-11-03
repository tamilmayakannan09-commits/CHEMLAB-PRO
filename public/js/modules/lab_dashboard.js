// =================== LAB DASHBOARD & HISTORY MODULE ===================
// Core logic to query backend stats and render Chart.js charts, aggregate accomplishments, and manage history tables

let dashChartCalc = null;
let dashChartActivity = null;
let dashChartAccuracy = null;

// 1. Core dashboard data loader
async function loadLabDashboard() {
    const statsContainer = document.getElementById('labDashContent');
    if (!statsContainer) return;

    if (!auth.isLoggedIn()) {
        renderGuestLabDashboard();
        return;
    }

    try {
        const stats = await api.get('/dashboard/stats');
        const history = await api.get('/experiments/history');
        
        if (stats.error || history.error) {
            renderGuestLabDashboard();
            return;
        }

        renderLabDashboard(stats, history);
    } catch (e) {
        console.error('Could not load dashboard data', e);
        renderGuestLabDashboard();
    }
}

// 2. Render guest mode warning
function renderGuestLabDashboard() {
    const container = document.getElementById('labDashContent');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:3rem;" class="glass-panel">
            <div style="font-size:3rem; margin-bottom:1rem;">🔒</div>
            <h3 style="color:var(--accent); font-family:var(--font-title); font-size:1.4rem; margin-bottom:0.5rem;">Access Protected</h3>
            <p style="color:var(--text3); margin-bottom:1.5rem;">Please log in or sign up to record experiment trials, view progress analytics, and track statistics.</p>
            <button class="btn btn-primary" onclick="showAuthModal('login')">Login / Sign Up</button>
        </div>
    `;
}

// 3. Render dashboard with charts
function renderLabDashboard(stats, history) {
    const container = document.getElementById('labDashContent');
    if (!container) return;

    // Calculate level and XP
    const totalXP = (stats.totalCalculations * 10) + (stats.completedExperiments * 100) + (stats.totalTrials * 5);
    const level = Math.floor(totalXP / 200) + 1;
    const xpPercent = Math.min(100, ((totalXP % 200) / 200) * 100);

    // Build the grid UI
    container.innerHTML = `
        <div class="grid-4" style="margin-bottom:2rem;">
            <div class="glass-panel stat-card">
                <div class="stat-icon">🧪</div>
                <div class="stat-info">
                    <h3>XP Score</h3>
                    <p style="color:var(--accent);">${totalXP} XP</p>
                </div>
            </div>
            <div class="glass-panel stat-card">
                <div class="stat-icon">🏅</div>
                <div class="stat-info">
                    <h3>Lab Level</h3>
                    <p style="color:var(--accent2);">Lv. ${level}</p>
                </div>
            </div>
            <div class="glass-panel stat-card">
                <div class="stat-icon">⚗️</div>
                <div class="stat-info">
                    <h3>Completed Labs</h3>
                    <p>${stats.completedExperiments} / 10</p>
                </div>
            </div>
            <div class="glass-panel stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-info">
                    <h3>Total Trials</h3>
                    <p>${stats.totalTrials}</p>
                </div>
            </div>
        </div>

        <div class="grid-2" style="margin-bottom:2rem;">
            <div class="card glass-panel">
                <div class="card-title">Completed Experiments Progress</div>
                <div style="display:flex; justify-content:center; align-items:center; height:200px;">
                    <div class="progress-ring-container">
                        <svg width="120" height="120">
                            <circle stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="transparent" r="50" cx="60" cy="60"/>
                            <circle class="progress-ring-circle" stroke="var(--accent)" stroke-width="8" fill="transparent" r="50" cx="60" cy="60"
                                    stroke-dasharray="314.15" stroke-dashoffset="${314.15 - (314.15 * (stats.completedExperiments / 10))}"/>
                        </svg>
                        <div class="progress-ring-text">${Math.round((stats.completedExperiments / 10) * 100)}%</div>
                    </div>
                </div>
            </div>
            <div class="card glass-panel">
                <div class="card-title">Calculations Breakdown</div>
                <div class="chart-container-wrapper">
                    <canvas id="chartCalcTypesCanvas"></canvas>
                </div>
            </div>
        </div>

        <div class="grid-2" style="margin-bottom:2rem;">
            <div class="card glass-panel">
                <div class="card-title">Trials Run per Experiment</div>
                <div class="chart-container-wrapper">
                    <canvas id="chartActivityCanvas"></canvas>
                </div>
            </div>
            <div class="card glass-panel">
                <div class="card-title">Average Precision & Accuracy</div>
                <div style="display:flex; flex-direction:column; justify-content:center; height:200px; text-align:center; gap:20px;">
                    <div>
                        <div style="font-size:0.9rem; color:var(--text3); text-transform:uppercase;">Overall Lab Accuracy</div>
                        <div style="font-size:2.2rem; font-family:var(--font-title); color:var(--accent2); font-weight:bold;">${stats.averageAccuracy}%</div>
                    </div>
                    <div>
                        <div style="font-size:0.9rem; color:var(--text3); text-transform:uppercase;">Level Progress</div>
                        <div class="progress-bar-bg" style="width:70%; margin:8px auto 0 auto; height:10px;">
                            <div class="progress-fill" style="width:${xpPercent}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Render charts using helper
    renderDashboardCharts(stats);
}

// 4. Chart renderers
function renderDashboardCharts(data) {
    // A. Calculation Doughnut
    const calcLabels = data.calcTypeDistribution.map(d => d._id);
    const calcCounts = data.calcTypeDistribution.map(d => d.count);
    
    if (calcLabels.length > 0) {
        renderExperimentChart('chartCalcTypesCanvas', 'doughnut', calcLabels, [{
            data: calcCounts,
            backgroundColor: ['#00d4ff', '#a855f7', '#00ff88', '#ff6b35', '#ffd700', '#ff69b4'],
            borderWidth: 0
        }], {
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, color: '#8ab4d4' } }
            }
        });
    }

    // B. Experiment Activity Bar
    // Build dummy/placeholder chart data if no calculations or experiments exist yet
    const activityLabels = ['Std Sol', 'Titration', 'pH Det', 'Dilution', 'Rate', 'Beer-L', 'Solub', 'Heat', 'Stoich', 'Electro'];
    const activityCounts = new Array(10).fill(0);
    
    if (data.recentExperiments) {
        data.recentExperiments.forEach(e => {
            const index = activityLabels.findIndex(l => e.experiment_name.toLowerCase().includes(l.toLowerCase().substring(0, 5)));
            if (index !== -1) {
                activityCounts[index] = e.trials.length;
            }
        });
    }

    renderExperimentChart('chartActivityCanvas', 'bar', activityLabels, [{
        label: 'Trials',
        data: activityCounts,
        backgroundColor: 'rgba(0, 212, 255, 0.4)',
        borderColor: '#00d4ff',
        borderWidth: 1.5
    }]);
}

// =================== HISTORY PAGE LOADER ===================

async function loadHistory() {
    const container = document.getElementById('historyContent');
    if (!container) return;

    if (!auth.isLoggedIn()) {
        container.innerHTML = `
            <div style="text-align:center; padding:3rem;" class="glass-panel">
                <div style="font-size:3rem; margin-bottom:1rem;">🔒</div>
                <h3 style="color:var(--accent); font-family:var(--font-title); font-size:1.4rem; margin-bottom:0.5rem;">History Locked</h3>
                <p style="color:var(--text3); margin-bottom:1.5rem;">Login to save and check your completed calculator results and lab trials history.</p>
                <button class="btn btn-primary" onclick="showAuthModal('login')">Login</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div style="color:var(--text3); text-align:center; padding:2rem;">Fetching history logs...</div>`;

    try {
        const calcsData = await api.get('/calculations?limit=20');
        const expsData = await api.get('/experiments?limit=20');

        if (calcsData.error || expsData.error) {
            container.innerHTML = `<div style="color:var(--accent3);">Failed to load history items.</div>`;
            return;
        }

        renderHistory(calcsData.calculations || [], expsData.experiments || []);
    } catch (e) {
        console.error('History load error', e);
        container.innerHTML = `<div style="color:var(--accent3);">Error querying calculations database.</div>`;
    }
}

function renderHistory(calculations, experiments) {
    const container = document.getElementById('historyContent');
    if (!container) return;

    let calcsTable = `
        <div class="card glass-panel" style="margin-bottom:2rem;">
            <div class="card-title">Recent Calculations Log</div>
            ${calculations.length === 0 ? '<div style="color:var(--text3); padding:1rem 0;">No calculations saved yet.</div>' : `
                <table class="breakdown-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Formula</th>
                            <th>Result</th>
                            <th>Date</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${calculations.map(c => `
                            <tr>
                                <td style="font-weight:bold; color:var(--accent);">${c.calculation_type}</td>
                                <td style="font-family:var(--font-mono); font-size:0.8rem;">${c.formula}</td>
                                <td style="color:var(--accent2); font-family:var(--font-mono); font-weight:bold;">${c.result} ${c.unit || ''}</td>
                                <td style="font-size:0.75rem; color:var(--text3);">${new Date(c.date_time).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-secondary" style="font-size:0.65rem; padding:2px 6px; color:var(--accent3);"
                                            onclick="deleteCalcLog('${c._id}')">✕</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
    `;

    let expsTable = `
        <div class="card glass-panel">
            <div class="card-title">Interactive Virtual Lab Log</div>
            ${experiments.length === 0 ? '<div style="color:var(--text3); padding:1rem 0;">No lab experiments started yet.</div>' : `
                <table class="breakdown-table" style="width:100%;">
                    <thead>
                        <tr>
                            <th>Experiment</th>
                            <th>Status</th>
                            <th>Trials</th>
                            <th>Average Result</th>
                            <th>Error</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${experiments.map(e => `
                            <tr>
                                <td style="font-weight:bold; color:var(--accent4);">${e.experiment_name}</td>
                                <td><span class="xp-badge" style="font-size:0.7rem; background:${e.experiment_status === 'completed' ? 'rgba(0,255,136,0.1)' : 'rgba(255,215,0,0.1)'}; color:${e.experiment_status === 'completed' ? 'var(--accent2)' : 'var(--accent5)'};">${e.experiment_status.toUpperCase()}</span></td>
                                <td style="font-family:var(--font-mono);">${e.trials.length}</td>
                                <td style="font-family:var(--font-mono);">${e.average_result !== null ? e.average_result : '—'}</td>
                                <td style="font-family:var(--font-mono); color:var(--accent3);">${e.percentage_error !== null ? e.percentage_error + '%' : '—'}</td>
                                <td>
                                    <button class="btn btn-secondary" style="font-size:0.65rem; padding:2px 6px; color:var(--accent3);"
                                            onclick="deleteExperimentLog('${e._id}')">✕</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
    `;

    container.innerHTML = calcsTable + expsTable;
}

// 5. Delete handlers
async function deleteCalcLog(id) {
    if (!confirm('Are you sure you want to delete this calculation record?')) return;
    const res = await api.delete(`/calculations/${id}`);
    if (res && !res.error) {
        loadHistory();
    }
}

async function deleteExperimentLog(id) {
    if (!confirm('Are you sure you want to delete this experiment record and all its trials?')) return;
    const res = await api.delete(`/experiments/${id}`);
    if (res && !res.error) {
        loadHistory();
    }
}
