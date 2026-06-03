import React, { useState } from 'react';
import api from '../lib/api';

export default function OfflineToggle({ initialShopId, initialStatus = true }) {
  const [isOnline, setIsOnline] = useState(initialStatus);

  const toggleStatus = async () => {
    try {
      const newStatus = !isOnline;
      await api.post('/shop/status', { shopId: initialShopId, isOnline: newStatus });
      setIsOnline(newStatus);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color: isOnline ? 'var(--accent-success)' : 'var(--text-secondary)', fontWeight: 500 }}>
        {isOnline ? 'Accepting Jobs' : 'Offline'}
      </span>
      <div className={`toggle-switch ${isOnline ? 'active' : ''}`} onClick={toggleStatus} />
    </div>
  );
}
