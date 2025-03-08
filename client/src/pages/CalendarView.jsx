// src/pages/CalendarView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import GoogleCalendarSync from '../components/calendar/GoogleCalendarSync';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorAlert from '../components/UI/ErrorAlert';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Create a context to maintain date range between page navigations
export const CalendarContext = React.createContext();

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    isConnected: false,
    inProgress: false
  });
  // Date range state from localStorage or defaults
  const [dateRange, setDateRange] = useState(() => {
    const savedRange = localStorage.getItem('calendarDateRange');
    if (savedRange) {
      const parsed = JSON.parse(savedRange);
      return {
        start: new Date(parsed.start),
        end: new Date(parsed.end),
        view: parsed.view || 'month'
      };
    }
    return {
      start: new Date(),
      end: new Date(moment().add(1, 'months').endOf('month')),
      view: 'month'
    };
  });

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the date range in the API call
      const formattedStart = moment(dateRange.start).format('YYYY-MM-DD');
      const formattedEnd = moment(dateRange.end).format('YYYY-MM-DD');
      
      // Use the range endpoint if we have a date range
      const endpoint = `/api/events/range/${formattedStart}/${formattedEnd}`;
      const response = await axios.get(endpoint);
      
      // Transform the events for the calendar
      const formattedEvents = response.data.map(event => ({
        id: event.event_id,
        title: event.summary || 'Untitled Event',
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        allDay: event.all_day,
        desc: event.description,
        location: event.location,
        status: event.status
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      // If date range endpoint fails, fallback to all events
      try {
        const response = await axios.get('/api/events');
        const formattedEvents = response.data.map(event => ({
          id: event.event_id,
          title: event.summary || 'Untitled Event',
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          allDay: event.all_day,
          desc: event.description,
          location: event.location,
          status: event.status
        }));
        setEvents(formattedEvents);
      } catch (fallbackErr) {
        setError('Failed to load events. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // Save date range to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('calendarDateRange', JSON.stringify({
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      view: dateRange.view
    }));
  }, [dateRange]);

  // Check sync status on component mount and fetch events
  useEffect(() => {
    // Fetch events
    fetchEvents();
    
    // Check if connected to Google
    const checkConnection = async () => {
      try {
        const response = await axios.get('/api/google/calendars');
        setSyncStatus(prev => ({
          ...prev, 
          isConnected: true
        }));
      } catch (err) {
        setSyncStatus(prev => ({
          ...prev,
          isConnected: false
        }));
      }
    };
    
    checkConnection();
    
    // Check URL for sync success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('syncSuccess') === 'true') {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date()
      }));
      // Remove parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Fetch events again to get the newly synced ones
      fetchEvents();
    }
  }, [fetchEvents]);

  // Handle manual sync (exposed directly in the UI)
  const handleManualSync = async () => {
    setSyncStatus(prev => ({
      ...prev,
      inProgress: true
    }));
    
    try {
      await axios.post('/api/google/sync');
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        inProgress: false
      }));
      // Refresh events after sync
      fetchEvents();
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus(prev => ({
        ...prev,
        inProgress: false
      }));
    }
  };

  // Handle date range selection
  const handleRangeSelect = ({ start, end }) => {
    // Update the date range when a user selects dates
    setDateRange({
      start,
      end,
      view: dateRange.view
    });
    // Fetch events for the new date range
    fetchEvents();
  };

  // Handle view change
  const handleViewChange = (view) => {
    setDateRange(prev => ({
      ...prev,
      view
    }));
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Handle creating a new event
  const handleCreateEvent = ({ start, end }) => {
    // Open modal with pre-filled start and end times
    setSelectedEvent({ start, end, title: 'New Event' });
    setIsModalOpen(true);
  };

  // Event styling
  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    
    // Different color based on event status
    if (event.status === 'tentative') {
      style.backgroundColor = '#f39c12';
    } else if (event.status === 'cancelled') {
      style.backgroundColor = '#e74c3c';
      style.textDecoration = 'line-through';
    }
    
    return { style };
  };

  // Loading state
  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error && events.length === 0) {
    return (
      <ErrorAlert 
        message={error} 
        onRetry={fetchEvents}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <div className="flex space-x-2">
          {/* Direct sync button for immediate visibility */}
          <button
            onClick={handleManualSync}
            disabled={syncStatus.inProgress || !syncStatus.isConnected}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50"
          >
            <span className="mr-2">🔄</span>
            {syncStatus.inProgress ? 'Syncing...' : 'Sync Now'}
          </button>
          
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <span className="mr-2">⚙️</span>
            {syncStatus.isConnected ? 'Manage Sync' : 'Connect Calendar'}
          </button>
          
          {syncStatus.lastSync && (
            <span className="text-gray-400 text-sm flex items-center">
              Last synced: {moment(syncStatus.lastSync).fromNow()}
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden flex-grow min-h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleCreateEvent}
          selectable={true} // Enable click and drag selection
          longPressThreshold={250} // Make selection easier
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView={dateRange.view}
          date={dateRange.start}
          onRangeChange={handleRangeSelect} // Handle date range selection
          onView={handleViewChange} // Handle view change
          popup
          components={{
            event: CustomEvent,
            toolbar: props => (
              <CustomToolbar 
                {...props} 
                onSyncClick={handleManualSync}
                isSyncing={syncStatus.inProgress}
                isConnected={syncStatus.isConnected}
              />
            )
          }}
        />
      </div>
      
      {/* Google Calendar Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Google Calendar Sync</h2>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <GoogleCalendarSync 
              onSyncComplete={() => {
                setSyncStatus(prev => ({
                  ...prev,
                  lastSync: new Date()
                }));
                fetchEvents();
                setIsSyncModalOpen(false); // Close modal after sync
              }}
            />
          </div>
        </div>
      )}
      
      {/* Event Detail Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">{selectedEvent.title}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-white">
              <p className="mb-2">
                <strong>Time:</strong> {moment(selectedEvent.start).format('lll')} - {moment(selectedEvent.end).format('lll')}
              </p>
              {selectedEvent.location && (
                <p className="mb-2">
                  <strong>Location:</strong> {selectedEvent.location}
                </p>
              )}
              {selectedEvent.desc && (
                <p className="mb-2">
                  <strong>Description:</strong> {selectedEvent.desc}
                </p>
              )}
              
              {/* Financial data form would go here */}
              <div className="mt-4 bg-gray-700 rounded p-3">
                <h3 className="font-semibold mb-2">Financial Data</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-sm text-gray-400">Income</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-600 text-white p-2 rounded" 
                      placeholder="$0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Expenses</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-600 text-white p-2 rounded" 
                      placeholder="$0.00"
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-sm text-gray-400">Venue</label>
                  <select className="w-full bg-gray-600 text-white p-2 rounded">
                    <option value="">-- Select Venue --</option>
                    <option value="1">Grand Ballroom</option>
                    <option value="2">City Conference Center</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom event component
const CustomEvent = ({ event }) => {
  return (
    <div>
      <strong>{event.title}</strong>
      {event.location && (
        <div className="text-xs opacity-75 truncate">📍 {event.location}</div>
      )}
    </div>
  );
};

// Custom toolbar component with sync button
const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="rbc-toolbar-label">{date.format('MMMM YYYY')}</span>
    );
  };

  return (
    <div className="rbc-toolbar">
      <div className="rbc-btn-group">
        <button type="button" onClick={goToCurrent}>Today</button>
        <button type="button" onClick={goToBack}>Back</button>
        <button type="button" onClick={goToNext}>Next</button>
        {/* Add the sync button directly to the toolbar */}
        {toolbar.onSyncClick && (
          <button 
            type="button" 
            onClick={toolbar.onSyncClick}
            disabled={toolbar.isSyncing || !toolbar.isConnected}
            className={toolbar.isSyncing ? 'syncing' : ''}
          >
            {toolbar.isSyncing ? 'Syncing...' : 'Sync Calendar'}
          </button>
        )}
      </div>
      <div className="rbc-toolbar-label">{label()}</div>
      <div className="rbc-btn-group">
        <button type="button" onClick={() => toolbar.onView('month')}>Month</button>
        <button type="button" onClick={() => toolbar.onView('week')}>Week</button>
        <button type="button" onClick={() => toolbar.onView('day')}>Day</button>
        <button type="button" onClick={() => toolbar.onView('agenda')}>Agenda</button>
      </div>
    </div>
  );
};

export default CalendarView;