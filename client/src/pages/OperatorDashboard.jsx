import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import JobCard from '../components/JobCard';
import OfflineToggle from '../components/OfflineToggle';
import TwoFactorModal from '../components/TwoFactorModal';
import api from '../lib/api';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [shopId] = useState('00000000-0000-0000-0000-000000000000');
  const [operatorInfo, setOperatorInfo] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('cloudcopy_operator');
    if (stored) {
      const info = JSON.parse(stored);
      setOperatorInfo(info);
      const trialEnd = new Date(info.trialEndsAt);
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
      setTrialDaysLeft(daysLeft);
    }
  }, []);

  const handleInitialVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (pin.length >= 4) {
      setShow2FA(true);
    }
  };

  const handle2FAVerify = async (code) => {
    try {
      const res = await api.post('/pin/verify', { pin, shopId, twoFactorCode: code });
      setJob(res.data);
      setShow2FA(false);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid PIN, expired job, or wrong 2FA code.';
      setError(msg);
      setJob(null);
      setShow2FA(false);
    }
  };

  const handleRelease = () => {
    setJob(null);
    setPin('');
  };

  const handleLogout = () => {
    localStorage.removeItem('cloudcopy_operator');
    navigate('/operator/login');
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      {/* Trial Banner */}
      {trialDaysLeft !== null && trialDaysLeft <= 30 && (
        <div className="animate-fade-in" style={{
          background: trialDaysLeft <= 7
            ? 'rgba(255, 59, 48, 0.08)'
            : 'rgba(255, 149, 0, 0.08)',
          border: `1px solid ${trialDaysLeft <= 7 ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 149, 0, 0.2)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem'
        }}>
          <span>
            {trialDaysLeft > 0
              ? `🎁 Free trial: ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`
              : '⚠️ Trial expired. Please subscribe to continue.'}
          </span>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
            Upgrade
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Operator Dashboard</h1>
          {operatorInfo && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {operatorInfo.shopName || operatorInfo.email}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <OfflineToggle initialShopId={shopId} initialStatus={true} />
          <button className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }} onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* PIN Entry */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield size={20} color="var(--accent-primary)" />
          <h3>Enter Student PIN</h3>
        </div>
        <form onSubmit={handleInitialVerify} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="• • • •" 
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            style={{ fontSize: '1.75rem', letterSpacing: '0.5em', textAlign: 'center', maxWidth: '200px', fontWeight: 600 }}
            maxLength={4}
          />
          <button type="submit" className="btn btn-primary" disabled={pin.length < 4}>
            Verify
          </button>
        </form>
        {error && (
          <div style={{ 
            marginTop: '1rem', 
            background: 'rgba(255,59,48,0.08)', 
            border: '1px solid rgba(255,59,48,0.2)', 
            borderRadius: 'var(--radius-md)', 
            padding: '0.75rem', 
            color: 'var(--accent-danger)', 
            fontSize: '0.9rem' 
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Job Card */}
      {job && (
        <div className="animate-fade-in">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success)', display: 'inline-block' }} />
            Job Ready to Release
          </h3>
          <JobCard job={job} onRelease={handleRelease} />
        </div>
      )}

      <TwoFactorModal 
        isOpen={show2FA} 
        onClose={() => setShow2FA(false)} 
        onVerify={handle2FAVerify} 
      />
    </div>
  );
}
