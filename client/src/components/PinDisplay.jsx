import React from 'react';
import { CheckCircle, MapPin, Copy } from 'lucide-react';

export default function PinDisplay({ pin, price, priceMin, priceMax, pinMode, shopName }) {
  const copyPin = () => {
    navigator.clipboard.writeText(pin);
  };

  const isPriceRange = priceMin !== undefined && priceMax !== undefined && priceMin !== null && priceMax !== null;

  return (
    <div className="glass-card animate-fade-in" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '1rem' }}>
        <CheckCircle size={52} color="var(--accent-success)" />
      </div>
      
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Upload Successful!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {pinMode === 'locked' 
          ? 'Your print is reserved at your selected shop.'
          : 'Show this PIN to the operator at any Cloudkopii shop to release your document.'}
      </p>
      
      {/* PIN Box */}
      <div style={{ 
        background: 'rgba(0, 122, 255, 0.06)', 
        padding: '2rem', 
        borderRadius: 'var(--radius-lg)', 
        marginBottom: '1.5rem', 
        border: '2px dashed rgba(0, 122, 255, 0.2)' 
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          Your PIN
        </div>
        <div style={{ 
          fontSize: '3.5rem', 
          fontWeight: 700, 
          letterSpacing: '0.25em', 
          color: 'var(--accent-primary)', 
          marginBottom: '0.75rem',
          fontFamily: 'monospace'
        }}>
          {pin}
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          onClick={copyPin}
        >
          <Copy size={14} />
          Copy PIN
        </button>
      </div>

      {/* Cost Summary */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 1.25rem', 
        background: 'rgba(0,0,0,0.03)', 
        borderRadius: 'var(--radius-md)', 
        marginBottom: '1rem' 
      }}>
        <span style={{ color: 'var(--text-secondary)' }}>
          {isPriceRange ? 'Estimated Cost' : 'Total Cost'}
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
          {isPriceRange 
            ? `${priceMin} - ${priceMax} CFA`
            : `${price} CFA`}
        </span>
      </div>

      {/* Shop Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <MapPin size={16} />
        <span>
          {pinMode === 'locked' 
            ? shopName || 'Selected Cloudkopii Shop'
            : shopName || 'Any Cloudkopii Shop'}
        </span>
      </div>

      {/* Info Box */}
      {isPriceRange && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          💡 Price varies by shop. You pay the shop's rate when you arrive.
        </div>
      )}
    </div>
  );
}
