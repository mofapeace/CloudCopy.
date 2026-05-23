import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Printer, Users } from 'lucide-react';

const RoleSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="container hero">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Cloud size={40} color="var(--primary)" />
          <h1 style={{ margin: 0 }}>CloudCopy</h1>
        </div>
        <p style={{ fontSize: '1.1rem', color: '#718096' }}>
          Campus printing, unchained.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* Client Card */}
        <div className="glass-card" style={{ cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center', padding: '2rem' }}>
          <Users size={56} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem', color: '#2d3748' }}>I'm a Client</h2>
          <p style={{ marginBottom: '2rem', color: '#718096' }}>
            Upload documents, get a PIN, and print from anywhere on campus.
          </p>
          <button 
            className="btn" 
            style={{ width: '100%' }}
            onClick={() => navigate('/client/auth')}
          >
            Continue as Client
          </button>
        </div>

        {/* Operator Card */}
        <div className="glass-card" style={{ cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center', padding: '2rem' }}>
          <Printer size={56} color="var(--success)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem', color: '#2d3748' }}>I'm an Operator</h2>
          <p style={{ marginBottom: '2rem', color: '#718096' }}>
            Manage your print shop queue and release jobs securely.
          </p>
          <button 
            className="btn success" 
            style={{ width: '100%' }}
            onClick={() => navigate('/operator/auth')}
          >
            Continue as Operator
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
