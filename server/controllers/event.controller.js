// server/controllers/event.controller.js
const { pool } = require('../index');

const eventController = {
  // Get all events
  getAllEvents: async (req, res) => {
    try {
      const query = `
        SELECT e.*, c.name as calendar_name, c.timezone_id
        FROM events e
        JOIN calendars c ON e.calendar_id = c.calendar_id
        ORDER BY e.start_time
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get event by ID
  getEventById: async (req, res) => {
    const { id } = req.params;
    try {
      const query = `
        SELECT e.*, c.name as calendar_name, c.timezone_id,
        (
          SELECT json_agg(json_build_object(
            'attendee_id', a.attendee_id,
            'email', a.email,
            'display_name', a.display_name,
            'response_status', a.response_status
          ))
          FROM attendees a
          WHERE a.event_id = e.event_id
        ) as attendees,
        (
          SELECT json_agg(json_build_object(
            'recurrence_id', r.recurrence_id,
            'rrule', r.rrule,
            'exdate', r.exdate,
            'recurrence_instance', r.recurrence_instance
          ))
          FROM recurrences r
          WHERE r.event_id = e.event_id
        ) as recurrences
        FROM events e
        JOIN calendars c ON e.calendar_id = c.calendar_id
        WHERE e.event_id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting event by ID:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get events by calendar ID
  getEventsByCalendar: async (req, res) => {
    const { calendarId } = req.params;
    try {
      const query = `
        SELECT e.*
        FROM events e
        WHERE e.calendar_id = $1
        ORDER BY e.start_time
      `;
      const result = await pool.query(query, [calendarId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting events by calendar:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get events by venue
  getEventsByVenue: async (req, res) => {
    const { venueId } = req.params;
    try {
      const query = `
        SELECT e.*
        FROM events e
        WHERE e.location LIKE $1
        ORDER BY e.start_time
      `;
      const result = await pool.query(query, [`%${venueId}%`]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting events by venue:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get events by date range - FIXED to handle overlap correctly
  getEventsByDateRange: async (req, res) => {
    const { startDate, endDate } = req.params;
    try {
      // Convert to valid dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate date inputs
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      // Modified query to catch all events that overlap with the date range
      const query = `
        SELECT e.*, c.name as calendar_name, c.timezone_id
        FROM events e
        JOIN calendars c ON e.calendar_id = c.calendar_id
        WHERE 
          -- Event starts within range
          (e.start_time >= $1 AND e.start_time <= $2)
          OR
          -- Event ends within range
          (e.end_time >= $1 AND e.end_time <= $2)
          OR
          -- Event spans the entire range
          (e.start_time <= $1 AND e.end_time >= $2)
        ORDER BY e.start_time
      `;
      
      const result = await pool.query(query, [start, end]);
      
      // Add debugging info
      console.log(`Found ${result.rows.length} events between ${start.toISOString()} and ${end.toISOString()}`);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting events by date range:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Create new event
  createEvent: async (req, res) => {
    const { 
      calendar_id, 
      summary, 
      description, 
      location, 
      start_time, 
      end_time, 
      all_day, 
      timezone_id,
      transparency,
      status,
      recurring_id,
      attendees,
      recurrences
    } = req.body;
    
    try {
      // Start a transaction
      await pool.query('BEGIN');
      
      // Insert event
      const eventQuery = `
        INSERT INTO events (
          event_id,
          calendar_id, 
          summary, 
          description, 
          location, 
          start_time, 
          end_time, 
          all_day, 
          timezone_id,
          transparency,
          status,
          created_at,
          updated_at,
          sequence,
          recurring_id
        )
        VALUES (
          uuid_generate_v4(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), 0, $11
        )
        RETURNING *
      `;
      
      const eventResult = await pool.query(eventQuery, [
        calendar_id, 
        summary, 
        description, 
        location, 
        start_time, 
        end_time, 
        all_day || false, 
        timezone_id,
        transparency || 'opaque',
        status || 'confirmed',
        recurring_id
      ]);
      
      const newEvent = eventResult.rows[0];
      
      // Insert attendees if provided
      if (attendees && attendees.length > 0) {
        for (const attendee of attendees) {
          const attendeeQuery = `
            INSERT INTO attendees (
              event_id,
              email,
              display_name,
              response_status
            )
            VALUES ($1, $2, $3, $4)
          `;
          
          await pool.query(attendeeQuery, [
            newEvent.event_id,
            attendee.email,
            attendee.display_name,
            attendee.response_status || 'needs-action'
          ]);
        }
      }
      
      // Insert recurrences if provided
      if (recurrences && recurrences.length > 0) {
        for (const recurrence of recurrences) {
          const recurrenceQuery = `
            INSERT INTO recurrences (
              event_id,
              rrule,
              exdate,
              recurrence_instance
            )
            VALUES ($1, $2, $3, $4)
          `;
          
          await pool.query(recurrenceQuery, [
            newEvent.event_id,
            recurrence.rrule,
            recurrence.exdate,
            recurrence.recurrence_instance
          ]);
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.status(201).json(newEvent);
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    const { id } = req.params;
    const { 
      calendar_id, 
      summary, 
      description, 
      location, 
      start_time, 
      end_time, 
      all_day, 
      timezone_id,
      transparency,
      status,
      recurring_id,
      attendees,
      recurrences
    } = req.body;
    
    try {
      // Start a transaction
      await pool.query('BEGIN');
      
      // Update event
      const eventQuery = `
        UPDATE events
        SET 
          calendar_id = $1,
          summary = $2,
          description = $3,
          location = $4,
          start_time = $5,
          end_time = $6,
          all_day = $7,
          timezone_id = $8,
          transparency = $9,
          status = $10,
          updated_at = NOW(),
          sequence = sequence + 1,
          recurring_id = $11
        WHERE event_id = $12
        RETURNING *
      `;
      
      const eventResult = await pool.query(eventQuery, [
        calendar_id, 
        summary, 
        description, 
        location, 
        start_time, 
        end_time, 
        all_day || false, 
        timezone_id,
        transparency || 'opaque',
        status || 'confirmed',
        recurring_id,
        id
      ]);
      
      if (eventResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      
      const updatedEvent = eventResult.rows[0];
      
      // Update attendees if provided
      if (attendees) {
        // Delete existing attendees
        await pool.query('DELETE FROM attendees WHERE event_id = $1', [id]);
        
        // Insert new attendees
        if (attendees.length > 0) {
          for (const attendee of attendees) {
            const attendeeQuery = `
              INSERT INTO attendees (
                event_id,
                email,
                display_name,
                response_status
              )
              VALUES ($1, $2, $3, $4)
            `;
            
            await pool.query(attendeeQuery, [
              id,
              attendee.email,
              attendee.display_name,
              attendee.response_status || 'needs-action'
            ]);
          }
        }
      }
      
      // Update recurrences if provided
      if (recurrences) {
        // Delete existing recurrences
        await pool.query('DELETE FROM recurrences WHERE event_id = $1', [id]);
        
        // Insert new recurrences
        if (recurrences.length > 0) {
          for (const recurrence of recurrences) {
            const recurrenceQuery = `
              INSERT INTO recurrences (
                event_id,
                rrule,
                exdate,
                recurrence_instance
              )
              VALUES ($1, $2, $3, $4)
            `;
            
            await pool.query(recurrenceQuery, [
              id,
              recurrence.rrule,
              recurrence.exdate,
              recurrence.recurrence_instance
            ]);
          }
        }
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json(updatedEvent);
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    const { id } = req.params;
    
    try {
      // Start a transaction
      await pool.query('BEGIN');
      
      // Delete attendees
      await pool.query('DELETE FROM attendees WHERE event_id = $1', [id]);
      
      // Delete recurrences
      await pool.query('DELETE FROM recurrences WHERE event_id = $1', [id]);
      
      // Delete alarms
      await pool.query('DELETE FROM alarms WHERE event_id = $1', [id]);
      
      // Delete event
      const result = await pool.query('DELETE FROM events WHERE event_id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = eventController;