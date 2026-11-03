import React, { useState } from 'react';

const VirtualBeaker = () => {
  const [beakerContents, setBeakerContents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reactionResult, setReactionResult] = useState(null);
  const [temperature, setTemperature] = useState(25); // Celsius

  const categories = ['WATER', 'ACIDS', 'BASES', 'SALTS', 'NEUTRALS', 'INDICATORS', 'ORGANIC'];
  const chemicalsMap = {
    WATER: ['H2O'],
    ACIDS: ['HCl', 'H2SO4'],
    BASES: ['NaOH', 'KOH'],
    SALTS: ['NaCl', 'AgNO3'],
    NEUTRALS: ['Na', 'K'], // Keeping simple for demo
    INDICATORS: ['Phenolphthalein'],
    ORGANIC: ['Ethanol']
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setModalOpen(true);
  };

  const handleAddChemical = async (chemical) => {
    setModalOpen(false);
    const newContents = [...beakerContents, chemical];
    setBeakerContents(newContents);

    if (newContents.length >= 2) {
      setLoading(true);
      try {
        const response = await fetch('/api/reactions/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reactants: newContents })
        });
        const data = await response.json();
        
        setReactionResult(data);
        if (data.temperatureShift) {
            const shift = parseInt(data.temperatureShift.replace('°C', '').replace('+', ''));
            if (!isNaN(shift)) setTemperature(25 + shift);
        }
      } catch (error) {
        console.error("Simulation failed:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="virtual-lab-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a1929', color: '#e8f4fd', fontFamily: 'sans-serif' }}>
      
      {/* Top Collapsible Information Drawer */}
      <div className="top-drawer" style={{ background: '#112850', padding: '1rem', display: 'flex', gap: '2rem' }}>
        <div className="tab-contents" style={{ flex: 1, border: '1px solid #00d4ff', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ color: '#00d4ff', margin: '0 0 10px 0' }}>CONTENTS</h3>
          {beakerContents.length === 0 ? <p>Beaker is empty</p> : (
            <ul>
              {beakerContents.map((chem, idx) => <li key={idx}>{chem}</li>)}
            </ul>
          )}
          {reactionResult && <p style={{ color: '#8ab4d4' }}>State: {reactionResult.moles}</p>}
        </div>

        <div className="tab-reactions" style={{ flex: 1, border: '1px solid #a855f7', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ color: '#a855f7', margin: '0 0 10px 0' }}>REACTIONS</h3>
          {loading ? (
            <div className="loader" style={{ color: '#00ff88', animation: 'pulse 1s infinite' }}>Calculating...</div>
          ) : (
            reactionResult && (
              <div>
                <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', marginBottom: '10px' }}>
                  {reactionResult.equation}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {reactionResult.thermodynamics === 'Exothermic' && (
                    <span style={{ background: '#ff6b35', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      🔥 Exothermic Reaction
                    </span>
                  )}
                  {reactionResult.hazards.map((hazard, i) => (
                    <span key={i} style={{ background: 'rgba(255, 107, 53, 0.2)', border: '1px solid #ff6b35', color: '#ff6b35', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      ⚠️ {hazard}
                    </span>
                  ))}
                  {reactionResult.byproducts.map((bp, i) => (
                    <span key={i} style={{ background: 'rgba(0, 212, 255, 0.2)', border: '1px solid #00d4ff', color: '#00d4ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      🫧 {bp}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Central Beaker Interaction Area */}
      <div className="interaction-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        
        {/* Temperature Slider */}
        <div className="temp-slider" style={{ position: 'absolute', left: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '10px', color: reactionResult?.thermodynamics === 'Exothermic' ? '#ff6b35' : '#00d4ff', fontWeight: 'bold' }}>
            {temperature}°C
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={temperature} 
            onChange={(e) => setTemperature(e.target.value)}
            style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '200px' }} 
          />
        </div>

        {/* Glass Beaker */}
        <div className="glass-beaker" style={{
          width: '200px',
          height: '250px',
          border: '4px solid rgba(255, 255, 255, 0.2)',
          borderTop: 'none',
          borderRadius: '10px 10px 40px 40px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)',
          position: 'relative',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.1) inset'
        }}>
          {/* Volume Scale */}
          <div className="volume-scale" style={{ position: 'absolute', right: '-40px', top: '10px', height: '90%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#8ab4d4', fontSize: '0.8rem' }}>
            <span>350mL</span>
            <span>250mL</span>
            <span>150mL</span>
            <span>50mL</span>
          </div>

          {/* Liquid Fill */}
          <div className="liquid" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: beakerContents.length > 0 ? `${Math.min(100, beakerContents.length * 30)}%` : '0%',
            background: beakerContents.includes('Phenolphthalein') && beakerContents.includes('NaOH') ? 'rgba(255, 20, 147, 0.6)' : 'rgba(0, 212, 255, 0.3)',
            borderRadius: '0 0 36px 36px',
            transition: 'height 0.5s ease-in-out, background 0.5s ease-in-out'
          }}>
            {reactionResult?.thermodynamics === 'Exothermic' && (
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,107,53,0.4) 0%, transparent 70%)' }}></div>
            )}
          </div>
        </div>

        {/* Clear Button */}
        <button 
          onClick={() => { setBeakerContents([]); setReactionResult(null); setTemperature(25); }}
          style={{ position: 'absolute', right: '10%', padding: '10px 20px', background: 'rgba(255, 107, 53, 0.2)', color: '#ff6b35', border: '1px solid #ff6b35', borderRadius: '8px', cursor: 'pointer' }}>
          Empty Beaker
        </button>
      </div>

      {/* Bottom Category Navigation Bar */}
      <div className="bottom-nav" style={{ background: '#050e20', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '10px', borderTop: '1px solid rgba(0,212,255,0.2)' }}>
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => handleCategoryClick(cat)}
            style={{ padding: '12px 24px', background: 'transparent', color: '#8ab4d4', border: 'none', borderBottom: activeCategory === cat ? '2px solid #00d4ff' : '2px solid transparent', cursor: 'pointer', fontWeight: 'bold' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Chemical Selection Modal */}
      {modalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" style={{ background: '#0a1929', border: '1px solid #00d4ff', padding: '2rem', borderRadius: '12px', minWidth: '300px' }}>
            <h2 style={{ color: '#e8f4fd', margin: '0 0 20px 0' }}>Select from {activeCategory}</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {(chemicalsMap[activeCategory] || []).map((chem) => (
                <button 
                  key={chem} 
                  onClick={() => handleAddChemical(chem)}
                  style={{ padding: '12px', background: 'rgba(0,212,255,0.1)', border: '1px solid #00d4ff', color: '#00d4ff', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem' }}>
                  {chem}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setModalOpen(false)}
              style={{ marginTop: '20px', width: '100%', padding: '10px', background: 'transparent', color: '#8ab4d4', border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualBeaker;
