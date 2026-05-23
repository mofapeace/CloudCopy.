import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Search, Power, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [pin, setPin] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const pendingJobs = [
    { id: 1, name: 'internship_report.pdf', pages: 12, cost: 300, time: '2 mins ago' },
    { id: 2, name: 'chapter_4_notes.docx', pages: 5, cost: 125, time: '15 mins ago' },
    { id: 3, name: 'presentation_slides.pdf', pages: 20, cost: 500, time: '1 hour ago' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user || user.role !== 'operator') {
    return (
      <div className="container hero">
        <p>Unauthorized access. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ color: '#1a202c', marginBottom: '0.5rem' }}>Operator Dashboard</h1>
          <p style={{ color: '#718096' }}>{user?.name || 'Print Shop'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className={`btn ${isOnline ? 'success' : ''}`}
            onClick={() => setIsOnline(!isOnline)}
            style={{ background: isOnline ? 'var(--success)' : '#e2e8f0', color: isOnline ? 'white' : '#4a5568' }}
          >
            <Power size={18} />
            {isOnline ? 'Shop Online' : 'Shop Offline'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#fed7d7',
              color: '#c53030',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>Release Job</h2>
          <div className="pin-input-group">
            <input 
              type="text" 
              maxLength="4" 
              placeholder="----" 
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button className="btn" style={{ width: '100%' }} disabled={pin.length !== 4}>
            <Search size={18} /> Find Document
          </button>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#2d3748' }}>Autopilot Queue</h2>
            <span style={{ background: 'var(--blue-100)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 'bold' }}>
              {pendingJobs.length} Jobs
            </span>
          </div>

          <div className="job-list">
            {pendingJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-info">
                  <h3>{job.name}</h3>
                  <div className="job-meta">
                    <span>{job.pages} pages</span>
                    <span>•</span>
                    <span>{job.cost} CFA</span>
                    <span>•</span>
                    <span>{job.time}</span>
                  </div>
                </div>
                <button className="btn" style={{ padding: '0.5rem 1rem' }}>
                  <Printer size={16} /> Print
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
