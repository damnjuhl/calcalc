// src/components/calendar/CalendarContainer.jsx
import React from 'react';
import { CalendarProvider } from '../../contexts/CalendarContext';
import CalendarView from '../../pages/CalendarView';

/**
 * Container component that wraps the CalendarView with the CalendarProvider
 * This ensures that calendar state is maintained even when navigating away
 */
function CalendarContainer() {
  return (
    <CalendarProvider>
      <CalendarView />
    </CalendarProvider>
  );
}

export default CalendarContainer;