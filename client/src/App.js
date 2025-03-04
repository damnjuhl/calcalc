// In your client/src/App.js file
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import VenueManagement from './pages/VenueManagement';
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

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 shadow-md">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xl font-bold mr-2">CalCalc</span>
                <span className="text-sm text-gray-400">Income Management</span>
              </div>
              <nav>
                <ul className="flex space-x-4">
                  <li>
                    <Link to="/" className="px-3 py-2 hover:bg-gray-700 rounded-md transition">Dashboard</Link>
                  </li>
                  <li>
                    <Link to="/venues" className="px-3 py-2 hover:bg-gray-700 rounded-md transition">Venues</Link>
                  </li>
                  <li>
                    <Link to="/analytics" className="px-3 py-2 hover:bg-gray-700 rounded-md transition">Analytics</Link>
                  </li>
                </ul>
              </nav>
              <div>
                <button className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md transition">
                  Sync Calendar
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto py-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/venues" element={<VenueManagement />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
          </Routes>
        </main>
        
        <footer className="bg-gray-800 py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <p>CalCalc - Income Management Application &copy; {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;