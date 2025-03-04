import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GoogleCalendarSync = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Check if connected on component mount
  useEffect(() => {
    checkConnection();
    
    // Check for sync success from redirect
    const urlParams = new URLSearchParams(window.location.search);
    const syncSuccess = urlParams.get('syncSuccess');
    
    if (syncSuccess === 'true') {
      setMessage('Successfully connected to Google Calendar and synced events!');
      // Remove the query param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check if connected to Google Calendar
  const checkConnection = async () => {
    try {
      setLoading(true);
      // Try to fetch calendars, if it succeeds, we're connected
      const response = await axios.get('/api/google/calendars');
      setCalendars(response.data);
      setConnected(true);
      
      // Find the default calendar (primary)
      const primaryCalendar = response.data.find(cal => cal.primary);
      if (primaryCalendar) {
        setSelectedCalendar(primaryCalendar.id);
      } else if (response.data.length > 0) {
        setSelectedCalendar(response.data[0].id);
      }
    } catch (err) {
      setConnected(false);
      console.log('Not connected to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  // Connect to Google Calendar
  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get auth URL from backend
      const response = await axios.get('/api/google/auth-url');
      
      // Redirect to Google OAuth
      window.location.href = response.data.url;
    } catch (err) {
      setError('Failed to connect to Google Calendar. Please try again.');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync calendar manually
  const handleSync = async () => {
    try {
      setLoading(true);
      setMessage('');
      setError('');
      
      const response = await axios.post('/api/google/sync');
      setMessage(response.data.message);
    } catch (err) {
      setError('Failed to sync calendar. Please try again.');
      console.error('Sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update default calendar
  const handleCalendarChange = async (e) => {
    const calendarId = e.target.value;
    setSelectedCalendar(calendarId);
    
    try {
      setLoading(true);
      setMessage('');
      setError('');
      
      await axios.put('/api/google/default-calendar', { calendarId });
      setMessage('Default calendar updated successfully!');
    } catch (err) {
      setError('Failed to update default calendar.');
      console.error('Calendar update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Google Calendar Sync</h2>
      
      {message && (
        <div className="bg-green-600 text-white p-3 rounded mb-4">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!connected ? (
        <div>
          <p className="text-gray-300 mb-4">
            Connect your Google Calendar to sync events automatically.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" />
                </svg>
                Connect Google Calendar
              </>
            )}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-green-400 mb-4">
            ✓ Connected to Google Calendar
          </p>
          
          <div className="mb-4">
            <label className="block text-white mb-2">Default Calendar:</label>
            <select
              value={selectedCalendar}
              onChange={handleCalendarChange}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              disabled={loading}
            >
              {calendars.map(calendar => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleSync}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center"
          >
            {loading ? (
              <span>Syncing...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Sync Now
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSync;