/**
 * interactive_lab.js
 * Implements the architecture for Virtual Lab: State Manager, Drag/Drop, Reaction Engine, VFX
 */

class LabStateManager {
    constructor() {
        this.state = {
            beakerContents: [],
            temperature: 25.0,
            pH: 7.0,
            isReacting: false,
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    _notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    addChemical(chemical) {
        if (this.state.isReacting) return;

        this.state.beakerContents.push(chemical);
        if (typeof window.addObs === 'function') {
            window.addObs(`[ ADD ] Added ${chemical.formula} (${chemical.name}) to beaker.`, 'info');
        }
        
        // Visual indicator on bench
        const dot = document.createElement('div');
        dot.className = 'equipment-item';
        dot.style.cssText = `left:${Math.random()*60+10}%;top:${Math.random()*40+10}%;font-size:1.8rem;position:absolute`;
        dot.innerHTML = `<span style="background:rgba(0,0,0,0.5);border:2px solid ${chemical.color};border-radius:8px;padding:4px 8px;font-size:0.75rem;font-weight:700;color:${chemical.color};letter-spacing:1px">${chemical.formula}</span>`;
        document.getElementById('benchSurface').appendChild(dot);

        this._notify();
        ReactionEngine.evaluate(this);
    }

    clear() {
        this.state.beakerContents = [];
        this.state.temperature = 25.0;
        this.state.pH = 7.0;
        this.state.isReacting = false;
        
        const s = document.getElementById('benchSurface');
        if (s) {
            // keep bench-label and reaction-display
            while (s.children.length > 2) {
                s.removeChild(s.lastChild);
            }
        }
        const rd = document.getElementById('reactionDisplay');
        if(rd) rd.style.display = 'none';
        
        const tempEl = document.getElementById('tempVal');
        const phEl = document.getElementById('phVal');
        if(tempEl) tempEl.textContent = '25.0°C';
        if(phEl) phEl.textContent = '7.0';
        
        if (typeof window.addObs === 'function') window.addObs('[ CLR ] Bench cleared.', '');
        this._notify();
    }

    updateMetrics({ temperature, pH, isReacting }) {
        if (temperature !== undefined) {
            this.state.temperature = temperature;
            const tempEl = document.getElementById('tempVal');
            if (tempEl) tempEl.textContent = `${temperature.toFixed(1)}°C`;
        }
        if (pH !== undefined) {
            this.state.pH = pH;
            const phEl = document.getElementById('phVal');
            if (phEl) phEl.textContent = pH.toFixed(1);
        }
        if (isReacting !== undefined) this.state.isReacting = isReacting;
        this._notify();
    }
}

window.labState = new LabStateManager();

class DragDropController {
    constructor() {
        this.initDraggables();
        this.initDropzone();
    }

    initDraggables() {
        const chemicals = document.querySelectorAll('.lab-shelf .chem-item');
        chemicals.forEach(chem => {
            chem.setAttribute('draggable', true);
            // Change cursor to indicate grab
            chem.style.cursor = 'grab';
            
            chem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    formula: chem.dataset.formula,
                    name: chem.dataset.name,
                    color: chem.dataset.color
                }));
                e.dataTransfer.effectAllowed = 'copy';
                chem.classList.add('dragging');
                chem.style.opacity = '0.5';
            });

            chem.addEventListener('dragend', (e) => {
                chem.classList.remove('dragging');
                chem.style.opacity = '1';
            });
        });
    }

    initDropzone() {
        const beaker = document.getElementById('benchSurface');
        if (!beaker) return;
        
        beaker.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            beaker.style.boxShadow = 'inset 0 0 30px rgba(0, 212, 255, 0.4)';
        });

        beaker.addEventListener('dragleave', () => {
            beaker.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5)';
        });

        beaker.addEventListener('drop', (e) => {
            e.preventDefault();
            beaker.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5)';

            try {
                const text = e.dataTransfer.getData('text/plain');
                if (text) {
                    const data = JSON.parse(text);
                    if (data && data.formula) {
                        labState.addChemical(data);
                    }
                }
            } catch (err) {
                console.error("Drop parse error", err);
            }
        });
    }
}

class ReactionEngine {
    static evaluate(stateManager) {
        const contents = stateManager.state.beakerContents.map(c => c.formula).sort();
        if (contents.length < 2) {
            if (contents.includes('CuSO4')) {
                this.displayResult(
                    'CuSO₄(aq) — Bright blue solution\nCu²⁺ ions give characteristic blue color',
                    'rgba(0,100,255,0.15)'
                );
            }
            return;
        }

        stateManager.updateMetrics({ isReacting: true });
        const reactionKey = contents.join('+'); 
        const reactionData = this.getReactionData(reactionKey);

        if (reactionData) {
            if (typeof window.addObs === 'function') window.addObs(`[ SYS ] Auto-Reaction Triggered!`, 'info');
            this.animateReaction(stateManager, reactionData);
        } else {
            if (typeof window.addObs === 'function') window.addObs(`[ SYS ] No reaction occurred between ${contents.join(' and ')}.`, '');
            stateManager.updateMetrics({ isReacting: false });
        }
    }

    static getReactionData(key) {
        const database = {
            'HCl+NaOH': {
                equation: 'HCl + NaOH → NaCl + H₂O\nAcid-Base Neutralization\nΔH = -57.1 kJ/mol',
                targetTemp: 28.0,
                targetPH: 7.0,
                color: 'rgba(0,200,100,0.15)',
                vfx: 'bubbles'
            },
            'AgNO3+NaCl': {
                equation: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃\nWhite precipitate formed',
                targetTemp: 25.0,
                targetPH: 6.5,
                color: 'rgba(200,200,200,0.15)',
                vfx: 'precipitate'
            },
            'HCl+Na2CO3': {
                equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑\nEffervescence observed — CO₂ gas evolved',
                targetTemp: 26.0,
                targetPH: 3.5,
                color: 'rgba(0,212,255,0.08)',
                vfx: 'bubbles'
            },
            'H2O2+KMnO4': {
                equation: '2KMnO₄ + 5H₂O₂ + 3H₂SO₄ → 2MnSO₄ + K₂SO₄ + 8H₂O + 5O₂\nDecolorization — KMnO₄ reduced',
                targetTemp: 30.0,
                targetPH: 2.0,
                color: 'rgba(150,0,150,0.08)',
                vfx: 'bubbles'
            }
        };
        return database[key];
    }

    static animateReaction(stateManager, data) {
        const rd = document.getElementById('reactionDisplay');
        const rt = document.getElementById('reactionText');
        
        rd.style.display = 'flex';
        rd.style.background = data.color;
        rt.innerText = data.equation;

        // VFX
        if (data.vfx === 'bubbles' && typeof window.createBubbles === 'function') {
            window.createBubbles(rd, 'rgba(255,255,255,0.6)', 5);
        } else if (data.vfx === 'precipitate' && typeof window.createPrecipitate === 'function') {
            window.createPrecipitate(rd, 'rgba(230,230,230,0.5)');
        }

        // Animate metrics smoothly
        const steps = 20;
        const intervalTime = 1500 / steps;
        let currentStep = 0;
        const startTemp = stateManager.state.temperature;
        const startPH = stateManager.state.pH;
        
        const tempStep = (data.targetTemp - startTemp) / steps;
        const phStep = (data.targetPH - startPH) / steps;

        const animInterval = setInterval(() => {
            currentStep++;
            stateManager.updateMetrics({
                temperature: startTemp + (tempStep * currentStep),
                pH: startPH + (phStep * currentStep)
            });

            if (currentStep >= steps) {
                clearInterval(animInterval);
                stateManager.updateMetrics({ isReacting: false });
                if (typeof window.addObs === 'function') window.addObs(`[ SYS ] Reaction Complete.`, 'info');
            }
        }, intervalTime);
    }
    
    static displayResult(text, color) {
        const rd = document.getElementById('reactionDisplay');
        const rt = document.getElementById('reactionText');
        rd.style.display = 'flex';
        rd.style.background = color;
        rt.innerText = text;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Override the global clearBench to use the state manager
    window.clearBench = () => labState.clear();
    
    // Initialize drag and drop
    new DragDropController();
});
