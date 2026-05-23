import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

const ClientAuth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('method'); // method | google | phone
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // In production, you'd get an actual google_token from Google Sign-In library
      // For now, we'll do a mock login with the name/email
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_token: 'mock_token', // Mock token
          name: name || 'Client User',
          email: email || `client_${Date.now()}@cloudcopy.local`,
        }),
      });

      if (!response.ok) {
        throw new Error('Google login failed');
      }

      const data = await response.json();
      login(data.access_token, { role: data.role, name: data.name });
      navigate('/client/home');
    } catch (err) {
      setError(err.message || 'Google login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOTPRequest = async () => {
    // Just transition to phone step, don't validate yet
    setStep('phone-input');
    setError('');
  };

  const handlePhoneOTPSend = async () => {
    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }
    // In production, send OTP via Twilio/Africa's Talking
    setStep('phone-verify');
    setError('');
  };

  const handlePhoneOTPVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          otp: otp,
        }),
      });

      if (!response.ok) {
        throw new Error('Phone OTP verification failed');
      }

      const data = await response.json();
      login(data.access_token, { role: data.role, name: data.name, phone: phone });
      navigate('/client/home');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Try again.');
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
            gap: '0.5rem'
          }}
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="glass-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Cloud size={40} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ marginBottom: '0.25rem' }}>Client Login</h2>
          <p style={{ fontSize: '0.9rem', color: '#718096', margin: 0 }}>Upload & print from your room</p>
        </div>

        {error && (
          <div style={{
            background: '#fed7d7',
            color: '#c53030',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {step === 'method' && (
          <div>
            <button
              className="btn"
              onClick={() => setStep('google')}
              style={{ width: '100%', marginBottom: '1rem', background: 'white', color: '#333', border: '1px solid #ccc' }}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 18, height: 18, marginRight: 8 }} />
              Continue with Google
            </button>

            <button
              className="btn"
              onClick={handlePhoneOTPRequest}
              style={{ width: '100%', background: 'var(--primary)' }}
            >
              <Phone size={18} />
              Continue with Phone
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#a0aec0', marginTop: '1.5rem' }}>
              We respect your privacy. No passwords, no hassle.
            </p>
          </div>
        )}

        {step === 'google' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Your Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
              }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Your Email
            </label>
            <input
              type="email"
              placeholder="john@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
              }}
            />

            <button
              className="btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Logging in...' : 'Sign In with Google'}
            </button>

            <button
              onClick={() => setStep('method')}
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
          </div>
        )}

        {step === 'phone-input' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+237 6 XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
              }}
            />

            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1.5rem' }}>
              Enter your phone number (9+ digits). We'll send you a 6-digit code.
            </p>

            <button
              className="btn"
              onClick={handlePhoneOTPSend}
              disabled={loading || phone.length < 9}
              style={{ width: '100%' }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <button
              onClick={() => {
                setStep('method');
                setPhone('');
                setOtp('');
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
          </div>
        )}

        {step === 'phone-verify' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Phone Number
            </label>
            <div style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #cbd5e0',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              background: '#f7fafc',
              color: '#4a5568',
            }}>
              {phone}
            </div>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              placeholder="000000"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                fontSize: '1.5rem',
                letterSpacing: '0.25rem',
                textAlign: 'center',
              }}
            />

            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1.5rem' }}>
              In production, we'll send an OTP to your phone. For demo, any 6 digits work.
            </p>

            <button
              className="btn"
              onClick={handlePhoneOTPVerify}
              disabled={loading || otp.length !== 6}
              style={{ width: '100%' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              onClick={() => {
                setStep('method');
                setPhone('');
                setOtp('');
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAuth;
