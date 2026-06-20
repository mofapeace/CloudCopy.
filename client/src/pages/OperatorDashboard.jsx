import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import JobCard from '../components/JobCard';
import OfflineToggle from '../components/OfflineToggle';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [shopId, setShopId] = useState('');
  const [operatorInfo, setOperatorInfo] = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('cloudkopii_operator');
    if (stored) {
      const info = JSON.parse(stored);
      setOperatorInfo(info);
      if (info.shopId) {
        setShopId(info.shopId);
      }
      const trialEnd = new Date(info.trialEndsAt);
      const now = new Date();
      const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
      setTrialDaysLeft(daysLeft);
    }
    fetchQueue();
  }, [shopId]);

  const fetchQueue = async () => {
    if (!shopId) return;
    try {
      const res = await api.get(`/jobs/shop/${shopId}`);
      setQueue(res.data);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    }
  };

  const handleInitialVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (pin.length >= 4) {
      try {
        const res = await api.post('/pin/verify', { pin, shopId });
        setJob(res.data);
      } catch (err) {
        const msg = err.response?.data?.error || 'Invalid PIN or expired job.';
        setError(msg);
        setJob(null);
      }
    }
  };

  // Poll for student confirmation if job is pending confirmation
  useEffect(() => {
    let interval;
    if (job && !job.studentConfirmed) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/job/${job.id}`);
          if (res.data) {
            setJob(prev => ({ 
              ...prev, 
              studentConfirmed: res.data.studentConfirmed,
              twoFAVerified: res.data.twoFAVerified
            }));
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [job]);

  const handleRelease = () => {
    // We don't setJob(null) here anymore! We just refresh the queue.
    setJob(prev => ({ ...prev, status: 'printing' }));
    fetchQueue();
  };

  const handleComplete = () => {
    setJob(null);
    setPin('');
    fetchQueue();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cloudkopii_operator');
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
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: job.studentConfirmed ? 'var(--accent-success)' : 'var(--accent-warning)', display: 'inline-block' }} />
            {job.studentConfirmed ? 'Job Ready to Release' : 'Waiting for Student Confirmation...'}
          </h3>

          {!job.studentConfirmed && job.twoFARequired && job.twoFACode && (
             <div style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '1.5rem', background: 'rgba(0,122,255,0.05)', border: '2px dashed rgba(0,122,255,0.3)', borderRadius: '12px' }}>
               <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Give this 6-digit code to the student:</h4>
               <div style={{ fontSize: '2.5rem', letterSpacing: '0.25em', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                 {job.twoFACode}
               </div>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                 They need to enter this in their app to confirm the print details and price.
               </p>
             </div>
          )}

          <div style={{ opacity: job.studentConfirmed ? 1 : 0.6, pointerEvents: job.studentConfirmed ? 'auto' : 'none' }}>
            <JobCard job={job} onRelease={handleRelease} onComplete={handleComplete} />
          </div>
        </div>
      )}

      {/* Pending Queue */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Pending Queue ({queue.length})</h3>
        {queue.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No pending jobs.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {queue.map(qJob => (
              <div 
                key={qJob.id} 
                onClick={async () => {
                  try {
                    const res = await api.get(`/job/${qJob.id}`);
                    setJob(res.data);
                  } catch (err) {
                    setError('Failed to load job details');
                  }
                }}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem', 
                  background: 'rgba(0,0,0,0.03)', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: job?.id === qJob.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  transition: 'var(--transition)'
                }}
              >
                <div>
                  <strong>{qJob.student_name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {qJob.page_count} pages • {qJob.color ? 'Color' : 'B&W'} • {qJob.copies} copies
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>{qJob.price_cfa} CFA</strong>
                  <div style={{ fontSize: '0.8rem', color: qJob.status === 'printing' ? 'var(--accent-primary)' : qJob.student_confirmed ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                    {qJob.status === 'printing' ? 'Printing...' : qJob.student_confirmed ? 'Confirmed' : 'Waiting for student'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
