// src/contexts/CalendarContext.js
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import moment from 'moment';

// Create context
const CalendarContext = createContext(null);

// Provider component
export const CalendarProvider = ({ children }) => {
  // Date range state from localStorage or defaults
  const [dateRange, setDateRange] = useState(() => {
    const savedRange = localStorage.getItem('calendarDateRange');
    if (savedRange) {
      try {
        const parsed = JSON.parse(savedRange);
        return {
          start: new Date(parsed.start),
          end: new Date(parsed.end),
          view: parsed.view || 'month'
        };
      } catch (error) {
        console.error('Error parsing saved date range:', error);
      }
    }
    // Default range: current month
    return {
      start: moment().startOf('month').toDate(),
      end: moment().endOf('month').toDate(),
      view: 'month'
    };
  });

  // Save date range to localStorage when it changes, but not on every render
  useEffect(() => {
    const data = {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      view: dateRange.view
    };
    
    localStorage.setItem('calendarDateRange', JSON.stringify(data));
  }, [dateRange.start, dateRange.end, dateRange.view]);

  // Update the date range - memoized to prevent recreation on each render
  const updateDateRange = useCallback((newRange) => {
    setDateRange(prev => {
      const updatedRange = { ...prev, ...newRange };
      
      // Ensure end date is updated if start date changed
      if (newRange.start && !newRange.end) {
        let endDate;
        
        switch (prev.view) {
          case 'month':
            endDate = moment(newRange.start).endOf('month').toDate();
            break;
          case 'week':
            endDate = moment(newRange.start).endOf('week').toDate();
            break;
          case 'day':
            endDate = moment(newRange.start).endOf('day').toDate();
            break;
          default:
            endDate = moment(newRange.start).add(1, 'month').endOf('month').toDate();
        }
        
        updatedRange.end = endDate;
      }
      
      return updatedRange;
    });
  }, []);

  // Change the view (month, week, day, agenda) - memoized
  const changeView = useCallback((view) => {
    setDateRange(prev => {
      let start = prev.start;
      let end;
      
      // Update start/end based on new view
      switch (view) {
        case 'month':
          start = moment(prev.start).startOf('month').toDate();
          end = moment(start).endOf('month').toDate();
          break;
        case 'week':
          start = moment(prev.start).startOf('week').toDate();
          end = moment(start).endOf('week').toDate();
          break;
        case 'day':
          start = moment(prev.start).startOf('day').toDate();
          end = moment(start).endOf('day').toDate();
          break;
        default:
          // For agenda view
          start = moment(prev.start).startOf('month').toDate();
          end = moment(start).add(3, 'months').endOf('month').toDate();
      }
      
      return { start, end, view };
    });
  }, []);

  // Navigate to previous/next period - memoized
  const navigate = useCallback((direction) => {
    setDateRange(prev => {
      const { view } = prev;
      let newStart, newEnd;

      switch (view) {
        case 'month':
          newStart = moment(prev.start)[direction === 'next' ? 'add' : 'subtract'](1, 'month').startOf('month').toDate();
          newEnd = moment(newStart).endOf('month').toDate();
          break;
        case 'week':
          newStart = moment(prev.start)[direction === 'next' ? 'add' : 'subtract'](1, 'week').startOf('week').toDate();
          newEnd = moment(newStart).endOf('week').toDate();
          break;
        case 'day':
          newStart = moment(prev.start)[direction === 'next' ? 'add' : 'subtract'](1, 'day').startOf('day').toDate();
          newEnd = moment(newStart).endOf('day').toDate();
          break;
        default:
          // For agenda view, move by month
          newStart = moment(prev.start)[direction === 'next' ? 'add' : 'subtract'](1, 'month').startOf('month').toDate();
          newEnd = moment(newStart).add(3, 'months').endOf('month').toDate();
      }

      return {
        start: newStart,
        end: newEnd,
        view
      };
    });
  }, []);

  // Jump to today - memoized
  const goToToday = useCallback(() => {
    setDateRange(prev => {
      const { view } = prev;
      let newStart, newEnd;

      switch (view) {
        case 'month':
          newStart = moment().startOf('month').toDate();
          newEnd = moment().endOf('month').toDate();
          break;
        case 'week':
          newStart = moment().startOf('week').toDate();
          newEnd = moment().endOf('week').toDate();
          break;
        case 'day':
          newStart = moment().startOf('day').toDate();
          newEnd = moment().endOf('day').toDate();
          break;
        default:
          // For agenda view
          newStart = moment().startOf('month').toDate();
          newEnd = moment().add(3, 'months').endOf('month').toDate();
      }

      return {
        start: newStart,
        end: newEnd,
        view
      };
    });
  }, []);

  // Value to be provided to consumers - memoized to prevent unnecessary context updates
  const value = useMemo(() => ({
    dateRange,
    updateDateRange,
    changeView,
    navigate,
    goToToday
  }), [dateRange, updateDateRange, changeView, navigate, goToToday]);

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

// Custom hook to use the calendar context
export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export default CalendarContext;