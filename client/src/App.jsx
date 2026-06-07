import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Cloud, UploadCloud, MapPin, Store, FileText } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import StudentUpload from './pages/StudentUpload';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import ShopLogin from './pages/ShopLogin';
import ShopMap from './pages/ShopMap';
import './index.css';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      style={{
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontWeight: isActive ? 600 : 500,
        fontSize: '0.95rem',
        padding: '0.4rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        background: isActive ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
        transition: 'var(--transition)'
      }}
    >
      {children}
    </Link>
  );
}

function StudentNavbar() {
  return (
    <nav style={{ display: 'flex', gap: '0.35rem' }}>
      <NavLink to="/student">
        <UploadCloud size={17} />
        Upload
      </NavLink>
      <NavLink to="/student/dashboard">
        <FileText size={17} />
        My Prints
      </NavLink>
      <NavLink to="/map">
        <MapPin size={17} />
        Shops
      </NavLink>
    </nav>
  );
}

function OperatorNavbar() {
  return (
    <nav style={{ display: 'flex', gap: '0.35rem' }}>
      <NavLink to="/operator">
        <Store size={17} />
        Dashboard
      </NavLink>
    </nav>
  );
}

function AppRouter() {
  const location = useLocation();
  
  // Determine which navbar to show based on current route
  const isOperatorRoute = location.pathname.startsWith('/operator');
  const isStudentRoute = location.pathname.startsWith('/student') || location.pathname === '/map' || location.pathname === '/login';
  const isLandingPage = location.pathname === '/';
  
  // Show navbar only for student and operator routes, not on landing
  const showNavbar = isStudentRoute || isOperatorRoute;

  return (
    <>
      {showNavbar && (
        <header className="header">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" className="logo">
              <Cloud color="var(--accent-primary)" size={26} />
              CloudCopy
            </Link>
            {isOperatorRoute ? <OperatorNavbar /> : <StudentNavbar />}
          </div>
        </header>
      )}

      <main style={{ flex: 1, padding: showNavbar ? '2.5rem 0' : '0' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/student" element={<StudentUpload />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/map" element={<ShopMap />} />
          <Route path="/operator/login" element={<ShopLogin />} />
          <Route path="/operator" element={<OperatorDashboard />} />
        </Routes>
      </main>

      <footer style={{ 
        padding: '1.5rem 0', 
        textAlign: 'center', 
        color: 'var(--text-secondary)', 
        borderTop: '1px solid var(--border-color)', 
        fontSize: '0.85rem' 
      }}>
        <p>&copy; {new Date().getFullYear()} CloudCopy — Campus printing, unchained.</p>
      </footer>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
