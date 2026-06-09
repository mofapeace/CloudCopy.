import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud,
  UploadCloud,
  Key,
  Printer,
  Zap,
  Shield,
  Wifi,
  MapPin,
  Trash2,
  Users,
  Store,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">

      {/* ── HERO ── */}
      <section className="landing-hero-section">
        <div className="hero-content">
          <div className="hero-cloud-icon">
            <Cloud size={34} strokeWidth={2} color="var(--accent-primary)" />
          </div>

          <h1 className="hero-title">
            Campus Printing, <span>Unchained</span>
          </h1>

          <p className="hero-tagline">
            Upload from your room. Get a <strong>4-digit PIN</strong>. Walk to
            any partner shop, pay cash, and collect your prints.{' '}
            <strong>No flash drives. No queues.</strong>
          </p>

          <div className="hero-cta-group">
            <Link to="/student" className="btn-hero-primary" id="hero-cta-student">
              <UploadCloud size={18} />
              Print a Document
            </Link>
            <Link to="/operator/login" className="btn-hero-secondary" id="hero-cta-operator">
              <Store size={18} />
              I'm a Shop Operator
            </Link>
          </div>

          <div className="hero-trust">
            <span className="trust-item">
              <span className="trust-dot" />
              Works on 3G
            </span>
            <span className="trust-item">
              <span className="trust-dot" />
              No app download
            </span>
            <span className="trust-item">
              <span className="trust-dot" />
              Files auto-deleted
            </span>
          </div>
        </div>

        <div className="scroll-indicator">
          <span>How it works</span>
          <ChevronDown size={18} />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-section">
        <span className="section-label">Simple as 1-2-3</span>
        <h2 className="section-title">How CloudCopy Works</h2>
        <p className="section-subtitle">
          No accounts needed. No app to install. Just upload, get a PIN, and
          print at any CloudCopy shop on campus.
        </p>

        <div className="steps-flow">
          <div className="step-item">
            <div className="step-number">
              <UploadCloud size={22} />
            </div>
            <h3>Upload Your File</h3>
            <p>
              Pick your PDF or document, choose color or B&W, single or
              double-sided, and see the price instantly.
            </p>
          </div>

          <div className="step-item">
            <div className="step-number">
              <Key size={22} />
            </div>
            <h3>Get Your PIN</h3>
            <p>
              Receive a secure 4-digit PIN linked to your name — your ticket to
              print at any Cloudkopii shop.
            </p>
          </div>

          <div className="step-item">
            <div className="step-number">
              <Printer size={22} />
            </div>
            <h3>Collect & Pay</h3>
            <p>
              Walk to any partner shop, tell them your PIN, confirm your name,
              pay cash, and pick up your prints.
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-section features-section">
        <div style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <span className="section-label">Built for Campus</span>
          <h2 className="section-title">Why Students Love Cloudkopii</h2>
          <p className="section-subtitle">
            Designed for African universities — fast, secure, and built to work
            on any device.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={22} />
              </div>
              <h3>Instant Pricing</h3>
              <p>
                See the exact CFA cost before uploading — no surprises at the
                counter.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={22} />
              </div>
              <h3>PIN + Name Security</h3>
              <p>
                Your PIN alone can't release a job. The operator verifies your
                name too.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Wifi size={22} />
              </div>
              <h3>Works on 3G</h3>
              <p>
                Files are compressed on upload. The interface is lightweight and
                mobile-first.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <MapPin size={22} />
              </div>
              <h3>Find Nearby Shops</h3>
              <p>
                See all partner shops on a live map with busyness indicators.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Trash2 size={22} />
              </div>
              <h3>Auto-Delete Files</h3>
              <p>
                Every document is permanently deleted within 10 minutes of
                printing.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <UploadCloud size={22} />
              </div>
              <h3>No USB, No App</h3>
              <p>
                Open Cloudkopii in your browser — works on any phone or laptop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GET STARTED ── */}
      <section className="landing-section cta-section">
        <span className="section-label">Get Started</span>
        <h2 className="section-title">Ready to Print?</h2>
        <p className="section-subtitle" style={{ margin: '0 auto 2.5rem' }}>
          Whether you're a student needing prints or a shop owner looking to
          modernize — Cloudkopii has you covered.
        </p>

        <div className="role-cards">
          <Link to="/student" className="role-card student-card" id="role-student">
            <div className="role-card-icon">
              <Users size={26} />
            </div>
            <h3>I'm a Student</h3>
            <p>
              Upload documents, customize print settings, and get a PIN to
              collect at any partner shop.
            </p>
            <span className="role-card-arrow">
              Start printing <ArrowRight size={15} />
            </span>
          </Link>

          <Link to="/operator/login" className="role-card operator-card" id="role-operator">
            <div className="role-card-icon">
              <Store size={26} />
            </div>
            <h3>I'm a Shop Operator</h3>
            <p>
              Manage your print queue, release jobs by PIN, and run your shop
              without USB sticks.
            </p>
            <span className="role-card-arrow">
              Open dashboard <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-links">
          <Link to="/map">Shop Map</Link>
          <a href="mailto:support@cloudkopii.cm">Contact</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Cloudkopii — Built for Buea. Scaling to every campus in Africa.</p>
      </footer>
    </div>
  );
}
