// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import CalendarView from './pages/CalendarView'; // Import the new CalendarView

// Navigation component
const Navigation = () => (
  <nav className="bg-gray-800 text-white py-4 px-6">
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center">
        <span className="text-xl font-bold">CalCalc</span>
      </div>
      <div className="flex space-x-6">
        <a href="/dashboard" className="flex items-center space-x-1">
          <span role="img" aria-label="dashboard">📊</span>
          <span>Dashboard</span>
        </a>
        <a href="/calendar" className="flex items-center space-x-1">
          <span role="img" aria-label="calendar">📅</span>
          <span>Calendar</span>
        </a>
        <a href="/venues" className="flex items-center space-x-1">
          <span role="img" aria-label="venues">🏢</span>
          <span>Venues</span>
        </a>
        <a href="/analytics" className="flex items-center space-x-1">
          <span role="img" aria-label="analytics">📈</span>
          <span>Analytics</span>
        </a>
      </div>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }}
        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
      >
        Logout
      </button>
    </div>
  </nav>
);

// Google callback component
const GoogleCallback = () => {
  React.useEffect(() => {
    window.location.href = '/?syncSuccess=true';
  }, []);
 
  return <div className="p-4 text-white">Processing Google authentication...</div>;
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
                  <>
                    <Navigation />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <VenueManagement />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AnalyticsDashboard />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <div className="container mx-auto px-4 py-8">
                      <CalendarView />
                    </div>
                  </>
                </ProtectedRoute>
              }
            />
           
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