import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, ArrowRight, Gift, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ShopLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { shopName, location, role: 'operator' },
            emailRedirectTo: window.location.origin
          }
        });
        if (signUpError) throw signUpError;

        // Store operator session
        localStorage.setItem('cloudcopy_operator', JSON.stringify({
          email,
          shopName,
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
        setCheckEmail(true);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Check trial from stored data or mock
        const stored = localStorage.getItem('cloudcopy_operator');
        if (!stored) {
          localStorage.setItem('cloudcopy_operator', JSON.stringify({
            email,
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }));
        }
        navigate('/operator');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '460px', marginTop: '4vh' }}>
      {/* Trial Banner */}
      <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(255, 149, 0, 0.08), rgba(0, 122, 255, 0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ padding: '0.6rem', background: 'rgba(255,149,0,0.15)', borderRadius: '12px' }}>
            <Gift size={24} color="var(--accent-secondary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>1-Month Free Trial</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No credit card required</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            'Operator Dashboard',
            'PIN Release Queue',
            'Kill Switch',
            'Job Analytics'
          ].map(feature => (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
              <CheckCircle size={14} color="var(--accent-success)" />
              {feature}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          After trial: <strong>5,000 CFA/month</strong> for the Basic plan.
        </div>
      </div>

      {/* Auth Form */}
      <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Store size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.35rem' }}>Shop Portal</h2>
        </div>

        <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.95rem',
              background: mode === 'login' ? 'var(--accent-secondary)' : 'transparent',
              color: mode === 'login' ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition)'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.95rem',
              background: mode === 'register' ? 'var(--accent-secondary)' : 'transparent',
              color: mode === 'register' ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition)'
            }}
          >
            Register Shop
          </button>
        </div>

        {checkEmail ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(255, 149, 0, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
              <Mail size={32} color="var(--accent-secondary)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Check your email</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              We've sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your operator account and start your trial.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setCheckEmail(false);
                setMode('login');
              }}
              style={{ width: '100%', background: 'var(--accent-secondary)' }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'register' && (
            <>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Shop Name"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  required
                  style={{ paddingLeft: '2.75rem' }}
                />
                <Store size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Location (e.g. Molyko, UB Gate)"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  style={{ paddingLeft: '2.75rem' }}
                />
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>📍</span>
              </div>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <input
              type="email"
              className="input-field"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ paddingLeft: '2.75rem' }}
            />
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ paddingLeft: '2.75rem' }}
            />
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem', background: 'var(--accent-secondary)' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'register' ? 'Register & Start Trial' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
