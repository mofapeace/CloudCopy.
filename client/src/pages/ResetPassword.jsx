import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for the password recovery event
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // The user is authenticated temporarily to change their password
        console.log('Password recovery mode enabled.');
      }
    });
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      // Wait a few seconds then navigate to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '460px', marginTop: '10vh' }}>
      <div className="glass-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(0, 122, 255, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <Lock size={32} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Update Password</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please enter your new password below.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <CheckCircle size={48} color="var(--accent-success)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-success)' }}>Password Updated!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/login')}
              style={{ width: '100%' }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="New Password"
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading || password.length < 6}>
              {loading ? 'Updating...' : 'Save New Password'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
