// src/components/calendar/CalendarContainer.jsx
import React, { useEffect, useState, useCallback, memo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import { CalendarProvider, useCalendar } from '../../contexts/CalendarContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorAlert from '../UI/ErrorAlert';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// The actual Calendar view component - memoize to prevent unnecessary re-renders
const CalendarView = memo(({ onSelectSlot, onAddEvent }) => {
  // Single source of truth for events
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    isConnected: false,
    inProgress: false
  });
  
  // Get calendar context
  const { dateRange, updateDateRange, changeView } = useCalendar();

  // Fetch events from API - wrapped in useCallback to maintain reference
  const fetchEvents = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous fetches
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the date range in the API call if available
      let response;
      try {
        response = await axios.get('/api/events');
        console.log('Fetched events:', response.data);
        
        // Transform the events for the calendar
        const formattedEvents = response.data.map(event => ({
          id: event.event_id || event.id,
          title: event.summary || event.title || 'Untitled Event',
          start: new Date(event.start_time || event.start),
          end: new Date(event.end_time || event.end),
          allDay: event.all_day || event.allDay || false,
          income: event.income || 0,
          expenses: event.expenses || 0,
          venue: event.location || event.venue || '',
          description: event.description || ''
        }));
        
        setEvents(formattedEvents);
        
        // If onAddEvent callback is provided, update parent component
        if (onAddEvent) {
          onAddEvent(formattedEvents);
        }
      } catch (err) {
        console.error('Error fetching events from API:', err);
        setError('Failed to load events from server. Using local data instead.');
        
        // Don't use mock data unless absolutely necessary
        if (events.length === 0) {
          // Only use mock data if we have no events
          const mockEvents = [
            {
              id: 1,
              title: 'Wedding at Grand Ballroom',
              start: new Date(2025, 2, 15),
              end: new Date(2025, 2, 16),
              income: 3000,
              expenses: 800,
              venue: 'Grand Ballroom'
            },
            {
              id: 2,
              title: 'Corporate Event',
              start: new Date(2025, 2, 20),
              end: new Date(2025, 2, 20),
              income: 2500,
              expenses: 600,
              venue: 'City Conference Center'
            }
          ];
          
          setEvents(mockEvents);
          
          // If onAddEvent callback is provided, update parent component
          if (onAddEvent) {
            onAddEvent(mockEvents);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [events.length, isLoading, onAddEvent]);

  // Initial fetch of events
  useEffect(() => {
    fetchEvents();
    // Check connection status
    checkConnection();
  }, [fetchEvents]);

  // Add an event through the API
  const addEvent = useCallback(async (eventData) => {
    try {
      const response = await axios.post('/api/events', eventData);
      console.log('Event created:', response.data);
      
      // Add the new event to the calendar
      const newEvent = {
        id: response.data.event_id || response.data.id || Date.now(),
        title: response.data.summary || response.data.title || eventData.summary || eventData.title,
        start: new Date(response.data.start_time || response.data.start || eventData.start_time || eventData.start),
        end: new Date(response.data.end_time || response.data.end || eventData.end_time || eventData.end),
        allDay: response.data.all_day || response.data.allDay || eventData.all_day || eventData.allDay || false,
        income: response.data.income || eventData.income || 0,
        expenses: response.data.expenses || eventData.expenses || 0,
        venue: response.data.location || response.data.venue || eventData.location || eventData.venue || '',
        description: response.data.description || eventData.description || ''
      };
      
      setEvents(prevEvents => [...prevEvents, newEvent]);
      
      // If onAddEvent callback is provided, update parent component
      if (onAddEvent) {
        onAddEvent([...events, newEvent]);
      }
      
      return { success: true, event: newEvent };
    } catch (error) {
      console.error('Error creating event:', error);
      // Add event locally even if API fails
      const newEvent = {
        id: Date.now(),
        title: eventData.summary || eventData.title,
        start: new Date(eventData.start_time || eventData.start),
        end: new Date(eventData.end_time || eventData.end),
        allDay: eventData.all_day || eventData.allDay || false,
        income: eventData.income || 0,
        expenses: eventData.expenses || 0,
        venue: eventData.location || eventData.venue || '',
        description: eventData.description || ''
      };
      
      setEvents(prevEvents => [...prevEvents, newEvent]);
      
      // If onAddEvent callback is provided, update parent component
      if (onAddEvent) {
        onAddEvent([...events, newEvent]);
      }
      
      return { success: false, event: newEvent, error: error.message };
    }
  }, [events, onAddEvent]);

  // Check Google Calendar connection
  const checkConnection = useCallback(async () => {
    try {
      const response = await axios.get('/api/google/calendars');
      console.log('Google Calendar connection successful:', response.data);
      setSyncStatus(prev => ({
        ...prev,
        isConnected: true
      }));
    } catch (err) {
      console.log('Google Calendar not connected. Error:', err.message);
      setSyncStatus(prev => ({
        ...prev,
        isConnected: false
      }));
    }
  }, []);

  // Handle manual sync - wrapped in useCallback
  const handleManualSync = useCallback(async () => {
    setSyncStatus(prev => ({
      ...prev,
      inProgress: true
    }));
    
    try {
      // First try to check/establish Google connection
      try {
        await checkConnection();
      } catch (connErr) {
        console.error('Failed to check Google connection:', connErr);
        // Continue anyway - maybe we're just syncing local events
      }
      
      // Attempt to sync
      try {
        await axios.post('/api/google/sync');
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          inProgress: false
        }));
        // Refresh events after sync
        fetchEvents();
      } catch (syncErr) {
        console.error('Google Calendar sync error:', syncErr);
        setSyncStatus(prev => ({
          ...prev,
          inProgress: false
        }));
        alert('Failed to sync with Google Calendar. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Sync process error:', err);
      setSyncStatus(prev => ({
        ...prev,
        inProgress: false
      }));
    }
  }, [fetchEvents, checkConnection]);

  // Handle date navigation - wrapped in useCallback
  const handleNavigate = useCallback((date) => {
    updateDateRange({
      start: date
    });
  }, [updateDateRange]);

  // Handle view change - wrapped in useCallback
  const handleViewChange = useCallback((view) => {
    changeView(view);
  }, [changeView]);

  // Handle creating a new event - wrapped in useCallback
  const handleSelectSlot = useCallback((slotInfo) => {
    // If parent component provided a handler, call it
    if (onSelectSlot) {
      onSelectSlot(slotInfo);
    }
  }, [onSelectSlot]);

  // Event styling - wrapped in useCallback
  const eventStyleGetter = useCallback((event) => {
    let style = {
      backgroundColor: '#3174ad',
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    
    if (event.status === 'tentative') {
      style.backgroundColor = '#f39c12';
    } else if (event.status === 'cancelled') {
      style.backgroundColor = '#e74c3c';
      style.textDecoration = 'line-through';
    }
    
    return { style };
  }, []);

  // Loading state
  if (isLoading && events.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="calendar-container h-full">
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mb-2 text-sm">
          {error}
        </div>
      )}
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectSlot={handleSelectSlot}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        selectable={true}
        longPressThreshold={250}
        date={dateRange.start}
        view={dateRange.view || 'month'}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        popup
        components={{
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
  );
});

// Custom toolbar component - memoize to prevent unnecessary re-renders
const CustomToolbar = memo((toolbar) => {
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
            disabled={toolbar.isSyncing}
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
});

// Main container component that provides context
function CalendarContainer({ onSelectSlot, onAddEvent }) {
  // Export the addEvent method for parent components to use
  return (
    <CalendarProvider>
      <CalendarView 
        onSelectSlot={onSelectSlot} 
        onAddEvent={onAddEvent}
      />
    </CalendarProvider>
  );
}

// Add display names for debugging
CalendarView.displayName = 'CalendarView';
CustomToolbar.displayName = 'CustomToolbar';

export default CalendarContainer;