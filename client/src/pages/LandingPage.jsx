import React from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Users, Store } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-header">
        <div className="landing-hero">
          <div className="hero-icon">
            <Cloud size={48} color="var(--accent-primary)" />
          </div>
          <h1>CloudCopy</h1>
          <p className="hero-tagline">Campus printing, unchained.</p>
          <p className="hero-subtitle">
            Upload from your room. Pay at the counter. No flash drives. No queues.
          </p>
        </div>
      </div>

      <div className="landing-container">
        <h2 style={{ marginBottom: '2rem', fontSize: '1.35rem', color: 'var(--text-primary)' }}>
          Who are you?
        </h2>
        
        <div className="role-selector">
          <Link to="/student" className="role-card client-card">
            <div className="role-icon">
              <Users size={40} />
            </div>
            <h3>I'm a Student</h3>
            <p>Upload documents and get a PIN to print at any CloudCopy shop.</p>
            <div className="role-arrow">→</div>
          </Link>

          <Link to="/operator/login" className="role-card operator-card">
            <div className="role-icon">
              <Store size={40} />
            </div>
            <h3>I'm an Operator</h3>
            <p>Manage print jobs and shop settings from your dashboard.</p>
            <div className="role-arrow">→</div>
          </Link>
        </div>
      </div>

      <footer style={{
        marginTop: '4rem',
        padding: '2rem 0',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem'
      }}>
        <p>&copy; {new Date().getFullYear()} CloudCopy — Campus printing, unchained.</p>
      </footer>
    </div>
  );
}
