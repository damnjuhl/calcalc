// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useSearchParams, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Pages
import Dashboard from './pages/Dashboard';
import VenueManagement from './pages/VenueManagement';
import VenueList from './components/venues/VenueList';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// New component to handle Google callback
const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
 
  useEffect(() => {
    // Add the syncSuccess parameter to indicate successful authentication
    navigate('/?syncSuccess=true');
  }, [navigate]);
 
  return <div className="p-4 text-white">Processing Google authentication...</div>;
};

// Simplified Layout component if you don't have a Layout component
const SimpleLayout = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
           
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SimpleLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="venues" element={<VenueList />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              {/* Removed calendar and profile routes since you don't have those components yet */}
            </Route>
           
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
         
          <footer className="bg-gray-800 py-4 mt-8">
            <div className="container mx-auto px-4 text-center text-gray-400">
              <p>CalCalc - Income Management Application &copy; {new Date().getFullYear()}</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;