// =================== EXPERIMENT UI COMPONENTS ===================
// Reusable components for virtual experiments: rendering tables, calculating statistics, and Chart.js integration

// 1. Render trial table
function renderTrialTable(experiment, onDeleteCallback) {
    const container = document.getElementById('trialsTableContainer');
    if (!container) return;

    if (!experiment.trials || experiment.trials.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:var(--text3);">
                No trials recorded yet. Adjust inputs above and click "Run Trial" to start.
            </div>
        `;
        return;
    }

    // Build the table header dynamically based on the first trial's inputs
    const sampleInputs = experiment.trials[0].inputs || {};
    const inputKeys = Object.keys(sampleInputs);
    
    let tableHtml = `
        <table class="breakdown-table" style="width:100%;">
            <thead>
                <tr>
                    <th>Trial</th>
                    ${inputKeys.map(k => `<th>${formatLabel(k)}</th>`).join('')}
                    <th>Observations</th>
                    <th>Result</th>
                    <th>Time</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${experiment.trials.map(t => {
                    const inputs = t.inputs || {};
                    const obs = typeof t.observations === 'object' ? JSON.stringify(t.observations) : (t.observations || '—');
                    const formattedResult = typeof t.result === 'object' && t.result.value !== undefined ? t.result.value : t.result;
                    const dateStr = new Date(t.date || t.date_time || Date.now()).toLocaleTimeString();

                    return `
                        <tr id="trial-row-${t._id || t.trial_number}">
                            <td style="font-weight:bold; color:var(--accent4);">#${t.trial_number}</td>
                            ${inputKeys.map(k => `<td>${inputs[k] !== undefined ? inputs[k] : '—'}</td>`).join('')}
                            <td style="font-size:0.8rem; color:var(--text3);">${formatObservations(t.observations)}</td>
                            <td style="font-family:var(--font-mono); color:var(--accent2);">${formattedResult}</td>
                            <td style="font-size:0.75rem; color:var(--text3);">${dateStr}</td>
                            <td>
                                <button class="btn btn-secondary" style="font-size:0.7rem; padding:2px 8px; color:var(--accent3);"
                                    onclick="deleteTrialDirectly('${experiment._id}', '${t._id || t.trial_number}')">✕</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Render Stats section
    let statsHtml = '';
    if (experiment.average_result !== null) {
        statsHtml = `
            <div class="grid-3" style="margin-top:1.5rem; border-top:1px solid rgba(0, 212, 255, 0.1); padding-top:1.5rem;">
                <div class="glass-panel" style="padding:1rem; border-radius:8px;">
                    <div style="font-size:0.8rem; color:var(--text3); text-transform:uppercase;">Average Result</div>
                    <div style="font-size:1.4rem; font-family:var(--font-title); color:var(--accent); font-weight:bold;">${experiment.average_result}</div>
                </div>
                <div class="glass-panel" style="padding:1rem; border-radius:8px;">
                    <div style="font-size:0.8rem; color:var(--text3); text-transform:uppercase;">Precision (Dev. Error)</div>
                    <div style="font-size:1.4rem; font-family:var(--font-title); color:var(--accent4); font-weight:bold;">${experiment.percentage_error !== null ? experiment.percentage_error + '%' : '0%'}</div>
                </div>
                ${experiment.percentage_error_from_theoretical !== null ? `
                <div class="glass-panel" style="padding:1rem; border-radius:8px;">
                    <div style="font-size:0.8rem; color:var(--text3); text-transform:uppercase;">Accuracy (vs Theoretical)</div>
                    <div style="font-size:1.4rem; font-family:var(--font-title); color:var(--accent2); font-weight:bold;">${(100 - experiment.percentage_error_from_theoretical).toFixed(1)}%</div>
                </div>
                ` : `
                <div class="glass-panel" style="padding:1rem; border-radius:8px;">
                    <div style="font-size:0.8rem; color:var(--text3); text-transform:uppercase;">Status</div>
                    <div style="font-size:1.4rem; font-family:var(--font-title); color:var(--accent5); font-weight:bold;">${experiment.experiment_status.toUpperCase()}</div>
                </div>
                `}
            </div>
        `;
    }

    container.innerHTML = tableHtml + statsHtml;
}

// Helper to format table labels
function formatLabel(str) {
    return str.split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
}

// Helper to format observations display in the row
function formatObservations(obs) {
    if (!obs) return '—';
    if (typeof obs === 'string') return obs;
    if (typeof obs === 'object') {
        return Object.entries(obs)
            .map(([k, v]) => `<b>${formatLabel(k)}</b>: ${v}`)
            .join(', ');
    }
    return '—';
}

// 2. Direct Trial Deletion from the UI
async function deleteTrialDirectly(experimentId, trialIdOrNum) {
    if (!confirm('Are you sure you want to delete this trial?')) return;
    
    // In our backend database, we can either call a delete trial endpoint, or we can fetch the experiment, 
    // remove the trial locally, and update the experiment. Let's do the latter or call the PUT route.
    // Wait! Let's check what routes are available in routes/experiments.js:
    // It has router.put('/:id', updateExperiment);
    // So we can fetch the experiment, filter out the trial, recalculate values, and call PUT.
    
    try {
        const res = await api.get(`/experiments/${experimentId}`);
        if (res.error) {
            alert('Could not find experiment.');
            return;
        }

        const exp = res;
        // Filter trials
        const originalLength = exp.trials.length;
        exp.trials = exp.trials.filter(t => (t._id && t._id !== trialIdOrNum) && (t.trial_number.toString() !== trialIdOrNum.toString()));
        
        // Renumber remaining trials
        exp.trials.forEach((t, i) => {
            t.trial_number = i + 1;
        });

        // Recalculate stats
        if (exp.trials.length > 0) {
            const results = exp.trials.map(t => {
                if (typeof t.result === 'object' && t.result.value !== undefined) {
                    return parseFloat(t.result.value);
                }
                return parseFloat(t.result);
            }).filter(v => !isNaN(v));

            if (results.length > 0) {
                const avg = results.reduce((a, b) => a + b, 0) / results.length;
                exp.average_result = parseFloat(avg.toFixed(4));
                
                const deviations = results.map(r => Math.abs(r - avg));
                const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
                exp.percentage_error = avg !== 0 ? parseFloat(((avgDeviation / Math.abs(avg)) * 100).toFixed(2)) : 0;
            }
        } else {
            exp.average_result = null;
            exp.percentage_error = null;
            exp.final_result = null;
            exp.error_value = null;
            exp.percentage_error_from_theoretical = null;
        }

        // Save back to backend
        const updateRes = await api.put(`/experiments/${experimentId}`, exp);
        if (updateRes.error) {
            alert('Error updating trials: ' + updateRes.error);
            return;
        }

        // Reload experiment active view UI
        if (typeof loadActiveExperimentView === 'function') {
            loadActiveExperimentView(updateRes.experiment);
        }
    } catch (err) {
        console.error('Delete trial error:', err);
    }
}

// 3. Render Chart.js helper
let currentActiveCharts = {}; // Track active chart instances to prevent duplication issues

function renderExperimentChart(canvasId, type, labels, datasets, customOptions = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart on this canvas if it exists
    if (currentActiveCharts[canvasId]) {
        currentActiveCharts[canvasId].destroy();
    }

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#8ab4d4', font: { family: 'Rajdhani', size: 12, weight: 'bold' } }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(0, 212, 255, 0.05)' },
                ticks: { color: '#8ab4d4', font: { family: 'Rajdhani' } }
            },
            y: {
                grid: { color: 'rgba(0, 212, 255, 0.05)' },
                ticks: { color: '#8ab4d4', font: { family: 'Rajdhani' } }
            }
        }
    };

    const mergedOptions = { ...defaultOptions, ...customOptions };
    
    // Apply nested scales options correctly
    if (customOptions.scales) {
        mergedOptions.scales = {
            x: { ...defaultOptions.scales.x, ...customOptions.scales.x },
            y: { ...defaultOptions.scales.y, ...customOptions.scales.y }
        };
    }

    const newChart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: mergedOptions
    });

    currentActiveCharts[canvasId] = newChart;
    return newChart;
}
