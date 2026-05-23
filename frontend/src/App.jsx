import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Cloud, LayoutDashboard, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleSelector from './pages/RoleSelector';
import ClientAuth from './pages/ClientAuth';
import ClientHome from './pages/ClientHome';
import OperatorAuth from './pages/OperatorAuth';
import OperatorDashboard from './pages/OperatorDashboard';

const Navbar = () => {
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();

  if (location.pathname === '/' || location.pathname === '/client/auth' || location.pathname === '/operator/auth') {
    return null; // No navbar on auth pages
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <Cloud size={28} />
        CloudCopy
      </Link>
      <div className="nav-links">
        {isLoggedIn && (
          <>
            <span style={{ color: '#718096' }}>Welcome, {user?.name}</span>
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: '#c53030',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<RoleSelector />} />
          
          {/* Client Routes */}
          <Route path="/client/auth" element={<ClientAuth />} />
          <Route
            path="/client/home"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientHome />
              </ProtectedRoute>
            }
          />
          
          {/* Operator Routes */}
          <Route path="/operator/auth" element={<OperatorAuth />} />
          <Route
            path="/operator/dashboard"
            element={
              <ProtectedRoute requiredRole="operator">
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
