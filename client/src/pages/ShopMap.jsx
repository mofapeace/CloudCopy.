import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Users, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const congestionBadge = (level) => {
  const configs = {
    quiet:    { label: '🟢 Quiet',    bg: 'rgba(52, 199, 89, 0.12)', color: '#34C759' },
    moderate: { label: '🟡 Moderate', bg: 'rgba(255, 149, 0, 0.12)',  color: '#FF9500' },
    busy:     { label: '🔴 Busy',     bg: 'rgba(255, 59, 48, 0.12)',  color: '#FF3B30' },
  };
  const c = configs[level] || configs.quiet;
  return (
    <span style={{ background: c.bg, color: c.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
};

const getCongestionLevel = (jobsPerFiveMin) => {
  if (jobsPerFiveMin >= 11) return 'busy';
  if (jobsPerFiveMin >= 5)  return 'moderate';
  return 'quiet';
};

export default function ShopMap() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shop').then(res => {
      // Simulate congestion data for demo (would come from API in production)
      const withCongestion = (res.data || []).map(shop => ({
        ...shop,
        jobsPerFiveMin: Math.floor(Math.random() * 15),
        openSince: '8:00 AM',
      }));
      setShops(withCongestion);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const onlineShops = shops.filter(s => s.is_online !== false);
  const offlineShops = shops.filter(s => s.is_online === false);

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <MapPin size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--accent-primary)' }} />
          Find a Print Shop
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Walk into any online shop, pay cash, and redeem your PIN. That's it.
        </p>
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading shops...
        </div>
      ) : (
        <>
          {/* Online Shops */}
          {onlineShops.length === 0 && offlineShops.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No shops registered yet. Check back soon!
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {onlineShops.map((shop, idx) => {
                  const level = getCongestionLevel(shop.jobsPerFiveMin);
                  return (
                    <div
                      key={shop.id}
                      className="glass-card animate-fade-in"
                      style={{ padding: '1.5rem', cursor: 'pointer', animationDelay: `${idx * 0.05}s` }}
                      onClick={() => navigate('/')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{shop.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <MapPin size={14} />
                            {shop.location || 'Campus'}
                          </div>
                        </div>
                        <Wifi size={18} color="var(--accent-success)" />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {congestionBadge(level)}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <Users size={14} />
                          {shop.jobsPerFiveMin} jobs / 5 min
                        </span>
                      </div>

                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} />
                          Open since {shop.openSince}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          Upload →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Offline Shops */}
              {offlineShops.length > 0 && (
                <>
                  <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem' }}>Offline Shops</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {offlineShops.map(shop => (
                      <div key={shop.id} className="glass-card" style={{ padding: '1.5rem', opacity: 0.5, filter: 'grayscale(60%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{shop.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              <MapPin size={14} />
                              {shop.location || 'Campus'}
                            </div>
                          </div>
                          <WifiOff size={18} color="var(--text-secondary)" />
                        </div>
                        <div style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Currently offline
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
