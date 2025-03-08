// src/components/layout/Navigation.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const { logout } = useAuth();
  const location = useLocation();

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/venues', label: 'Venues', icon: '🏢' },
    { path: '/analytics', label: 'Analytics', icon: '📈' }
  ];

  return (
    <nav className="bg-gray-800 text-white py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-1">
          <span className="text-xl font-bold">CalCalc</span>
        </div>
        <div className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center space-x-1 hover:text-blue-300 transition ${
                  isActive ? 'text-blue-400 border-b-2 border-blue-400' : ''
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="md:hidden flex justify-around mt-4 border-t border-gray-700 pt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center space-y-1 hover:text-blue-300 transition ${
                isActive ? 'text-blue-400' : ''
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;