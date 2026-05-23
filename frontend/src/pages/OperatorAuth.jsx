import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

const OperatorAuth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('choice'); // choice | login | signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      login(data.access_token, { role: data.role, name: data.name, email: loginEmail });
      navigate('/operator/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!signupName || !signupEmail || !signupPassword || !shopName || !shopLocation) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register/operator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          shop_name: shopName,
          shop_location: shopLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      login(data.access_token, { role: data.role, name: data.name, email: signupEmail });
      navigate('/operator/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container hero">
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="glass-card" style={{ maxWidth: '450px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Cloud size={40} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ marginBottom: '0.25rem' }}>Operator Access</h2>
          <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>Manage your print shop</p>
        </div>

        {error && (
          <div
            style={{
              background: '#fed7d7',
              color: '#c53030',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {step === 'choice' && (
          <div>
            <button
              className="btn success"
              onClick={() => {
                setStep('login');
                setError('');
              }}
              style={{ width: '100%', marginBottom: '1rem', padding: '1rem' }}
            >
              ✓ Sign In to Existing Account
            </button>

            <button
              className="btn"
              onClick={() => {
                setStep('signup');
                setError('');
              }}
              style={{ width: '100%', background: '#e2e8f0', color: '#4a5568', padding: '1rem' }}
            >
              + Create New Shop Account
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#a0aec0', marginTop: '1.5rem' }}>
              🔒 Your shop data is secure and encrypted
            </p>
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Email Address
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem' }}>
              <Mail size={18} color="#a0aec0" style={{ marginRight: '0.5rem' }} />
              <input
                type="email"
                placeholder="shop@university.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem' }}
              />
            </div>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Password
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '0.5rem', marginBottom: '1.5rem' }}>
              <Lock size={18} color="#a0aec0" style={{ marginRight: '0.5rem' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem' }}
              />
            </div>

            <button
              className="btn success"
              type="submit"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('choice');
                setError('');
                setLoginEmail('');
                setLoginPassword('');
              }}
              style={{
                width: '100%',
                marginTop: '1rem',
                background: '#e2e8f0',
                color: '#4a5568',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </form>
        )}

        {step === 'signup' && (
          <form onSubmit={handleSignup}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
              }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="shop@university.edu"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
              }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
              }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Shop Name
            </label>
            <input
              type="text"
              placeholder="UB Main Campus Print Shop"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
              }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Shop Location
            </label>
            <input
              type="text"
              placeholder="Near IT Center, Block A"
              value={shopLocation}
              onChange={(e) => setShopLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
                fontSize: '1rem',
              }}
            />

            <button
              className="btn success"
              type="submit"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Creating account...' : 'Create Shop Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('choice');
                setError('');
                setSignupName('');
                setSignupEmail('');
                setSignupPassword('');
                setShopName('');
                setShopLocation('');
              }}
              style={{
                width: '100%',
                marginTop: '1rem',
                background: '#e2e8f0',
                color: '#4a5568',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OperatorAuth;
