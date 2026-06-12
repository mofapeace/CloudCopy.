import React from 'react';
import { Palette, Copy, CheckSquare } from 'lucide-react';

export default function PrintCustomizer({ options, setOptions, pageCount, colorPagesMap, isPro }) {
  const { color, doubleSided, copies } = options;

  const toggleColor = () => setOptions({ ...options, color: !color });
  const toggleDoubleSided = () => setOptions({ ...options, doubleSided: !doubleSided });
  
  const handleCopiesChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setOptions({ ...options, copies: val });
    }
  };

  // Pricing calculation
  let totalCost = 0;
  let sheetsCount = 0;

  if (doubleSided) {
    // Group into sheets
    for (let i = 0; i < pageCount; i += 2) {
      sheetsCount++;
      const page1Color = colorPagesMap[i] || false;
      const page2Color = colorPagesMap[i + 1] || false;
      
      // If either side has color and user wants color, sheet is 75. Otherwise 25.
      if (color && (page1Color || page2Color)) {
        totalCost += 75;
      } else {
        totalCost += 25;
      }
    }
  } else {
    // Single sided
    sheetsCount = pageCount;
    for (let i = 0; i < pageCount; i++) {
      const isColorPage = colorPagesMap[i] || false;
      if (color && isColorPage) {
        totalCost += 75;
      } else {
        totalCost += 25;
      }
    }
  }

  const finalTotal = totalCost * copies;

  // Calculate range for non-pro users
  const { minBw = 15, maxBw = 25 } = options;
  // Let's assume color min/max and double sided min/max are scaled similarly for the preview
  // For simplicity, we calculate the ratio
  const minRatio = minBw / 25; // 25 is the default bwPrice we used to calculate totalCost
  const maxRatio = maxBw / 25;
  const minTotal = Math.floor(finalTotal * minRatio);
  const maxTotal = Math.ceil(finalTotal * maxRatio);
  
  // Count how many color pages exist in the document (informational)
  const colorPageCount = colorPagesMap.filter(c => c).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        Print Options
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <Palette size={20} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>Color Printing</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Detected {colorPageCount} color page{colorPageCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className={`toggle-switch ${color ? 'active' : ''}`} onClick={toggleColor} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <Copy size={20} color="var(--accent-secondary)" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>Double Sided</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Saves {pageCount - sheetsCount} sheet{pageCount - sheetsCount !== 1 ? 's' : ''} of paper
            </div>
          </div>
        </div>
        <div className={`toggle-switch ${doubleSided ? 'active' : ''}`} onClick={toggleDoubleSided} />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <CheckSquare size={20} color="var(--accent-success)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>Copies: {copies}</div>
          </div>
        </div>
        <input 
          type="range" 
          min="1" 
          max="20"
          value={copies} 
          onChange={handleCopiesChange}
          className="soft-slider"
        />
      </div>

      <div style={{ 
        marginTop: '0.5rem', 
        padding: '1.25rem', 
        background: 'rgba(0,0,0,0.02)', 
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sheetsCount} sheet{sheetsCount !== 1 ? 's' : ''} × {copies} cop{copies !== 1 ? 'ies' : 'y'}</div>
          <div style={{ fontSize: '0.85rem' }}>{doubleSided ? 'Double-sided' : 'Single-sided'}</div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-primary)', textAlign: 'right' }}>
          {isPro ? (
            <>{finalTotal} CFA</>
          ) : (
            <>
              <div style={{ fontSize: '1.25rem' }}>{minTotal} - {maxTotal} CFA</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(Est. range)</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
