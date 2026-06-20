import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Cloud, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

export default function StudentLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // On mount, check if already logged in and route based on DB role
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const roleRes = await api.post('/auth/check-role', {
            userId: session.user.id,
            email: session.user.email
          });
          if (roleRes.data.role === 'operator') {
            navigate('/operator');
          } else {
            navigate('/student');
          }
        } catch (err) {
          // If role check fails, still navigate to student as fallback
          navigate('/student');
        }
      }
    });
  }, [navigate]);

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { name, role: 'student' },
            emailRedirectTo: window.location.origin + '/login'
          }
        });
        if (signUpError) throw signUpError;
        
        // Register student in backend database
        if (data.user) {
          try {
            await api.post('/auth/student-register', {
              id: data.user.id,
              email: data.user.email,
              name: name
            });
          } catch (backendErr) {
            console.error('Backend student registration error:', backendErr);
            // Don't block — they can still use the app
          }
        }
        localStorage.setItem('cloudcopy_free_uses', '0');
        setCheckEmail(true);
      } else {
        // Login flow
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Check role from backend database (source of truth)
        try {
          const roleRes = await api.post('/auth/check-role', {
            userId: data.user.id,
            email: data.user.email
          });

          if (roleRes.data.role === 'operator') {
            // This person is an operator, redirect them
            setError('This account is registered as a shop operator. Please use the Shop Portal login.');
            await supabase.auth.signOut();
            return;
          }
        } catch (roleErr) {
          console.error('Role check failed:', roleErr);
          // Continue as student if role check fails
        }

        localStorage.setItem('cloudcopy_free_uses', '0');
        navigate('/student');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const m = params.get('mode');
    if (m === 'signup') setMode('signup');
  }, [location.search]);

  const remainingUses = 5 - parseInt(localStorage.getItem('cloudkopii_free_uses') || '0', 10);
  const isLocked = remainingUses <= 0;

  return (
    <div className="container" style={{ maxWidth: '460px', marginTop: '4vh' }}>
      {/* Pro Plan Banner */}
      <div className="glass-card animate-fade-in" style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(255, 149, 0, 0.08))' }}>
        <Cloud size={40} color="var(--accent-primary)" style={{ marginBottom: '0.75rem' }} />
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Cloudkopii Pro</h2>
        {isLocked ? (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            You've used your 5 free prints. Create an account to continue.
          </p>
        ) : (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            You have <strong style={{ color: 'var(--accent-primary)' }}>{remainingUses}</strong> free print{remainingUses !== 1 ? 's' : ''} remaining.
          </p>
        )}

        <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'left' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Pro Plan Benefits</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
            {[
              'Unlimited uploads',
              'Schedule pickups',
              'Priority queue',
              'Premium finishing',
              'Edit instructions',
              'Pro shop access'
            ].map(benefit => (
              <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--accent-success)' }}>✓</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.95rem',
              background: mode === 'login' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'login' ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition)'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.95rem',
              background: mode === 'signup' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'signup' ? 'white' : 'var(--text-secondary)',
              transition: 'var(--transition)'
            }}
          >
            Sign Up
          </button>
        </div>

        {checkEmail ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(0, 122, 255, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
              <Mail size={32} color="var(--accent-primary)" />
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Check your email</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              We've sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account and continue.
            </p>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setCheckEmail(false);
                setMode('login');
              }}
              style={{ width: '100%' }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>👤</span>
            </div>
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
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
            />
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
        )}

        {!isLocked && (
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={() => navigate('/')}
          >
            Continue as Guest ({remainingUses} prints left)
          </button>
        )}
      </div>
    </div>
  );
}
