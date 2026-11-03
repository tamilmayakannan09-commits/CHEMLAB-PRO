async function loadHistory() {
    const historyContent = document.getElementById('historyContent');
    const token = localStorage.getItem('token');
    
    if (!token) {
        historyContent.innerHTML = `
            <div style="text-align:center; padding: 3rem; color: var(--text2);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                <h3>Authentication Required</h3>
                <p>Please login to view your calculation and experiment history.</p>
            </div>
        `;
        return;
    }

    historyContent.innerHTML = '<div style="text-align:center; padding: 2rem;">Loading history data...</div>';

    try {
        // Fetch dashboard stats to get recent calculations and experiments
        const response = await fetch('/api/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }

        const data = await response.json();
        const calcs = data.recentCalculations || [];
        const exps = data.recentExperiments || [];

        let html = '<div class="grid-2">';

        // Calculations Column
        html += '<div class="card">';
        html += '<div class="card-title">Recent Calculations</div>';
        if (calcs.length === 0) {
            html += '<p style="color:var(--text2)">No calculations recorded yet.</p>';
        } else {
            html += '<div style="display:flex;flex-direction:column;gap:10px">';
            calcs.forEach(c => {
                const date = new Date(c.date_time).toLocaleString();
                html += `
                    <div style="background:var(--bg2); padding:1rem; border-radius:8px; border-left: 4px solid var(--accent)">
                        <div style="font-size:0.8rem; color:var(--text2); margin-bottom:5px">${date}</div>
                        <div style="font-weight:bold; color:var(--text)">${c.calculation_type}</div>
                        <div style="font-family:monospace; margin-top:5px; color:var(--accent4)">${c.result}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        html += '</div>';

        // Experiments Column
        html += '<div class="card">';
        html += '<div class="card-title">Recent Experiments</div>';
        if (exps.length === 0) {
            html += '<p style="color:var(--text2)">No experiments recorded yet.</p>';
        } else {
            html += '<div style="display:flex;flex-direction:column;gap:10px">';
            exps.forEach(e => {
                const date = new Date(e.date_time).toLocaleString();
                const statusColor = e.experiment_status === 'completed' ? 'var(--success)' : 'var(--warning)';
                html += `
                    <div style="background:var(--bg2); padding:1rem; border-radius:8px; border-left: 4px solid ${statusColor}">
                        <div style="font-size:0.8rem; color:var(--text2); margin-bottom:5px">${date}</div>
                        <div style="font-weight:bold; color:var(--text)">${e.experiment_name}</div>
                        <div style="margin-top:5px; font-size:0.9rem">Status: <span style="color:${statusColor}">${e.experiment_status}</span></div>
                    </div>
                `;
            });
            html += '</div>';
        }
        html += '</div>';

        html += '</div>'; // close grid
        
        historyContent.innerHTML = html;

    } catch (error) {
        console.error('Error loading history:', error);
        historyContent.innerHTML = `
            <div style="text-align:center; padding: 2rem; color: var(--error);">
                Error loading history. Please try again later.
            </div>
        `;
    }
}
