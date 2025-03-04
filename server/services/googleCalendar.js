// server/services/googleCalendar.js
const { google } = require('googleapis');
const { pool } = require('../index');

// Create an OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

/**
 * Generate a URL that asks for permissions to access the user's calendar
 */
const getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' gets refresh token
    scope: scopes,
    prompt: 'consent' // Forces to approve the consent again
  });
};

/**
 * Get tokens using the authorization code
 */
const getTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

/**
 * Get a list of all available calendars
 */
const listCalendars = async (auth) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.calendarList.list();
    return response.data.items;
  } catch (error) {
    console.error('Error listing calendars:', error);
    throw error;
  }
};

/**
 * Get calendar events within a date range
 */
const getEvents = async (auth, calendarId, timeMin, timeMax) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ahead
      singleEvents: true,
      orderBy: 'startTime'
    });
    return response.data.items;
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};

/**
 * Create a new event in Google Calendar
 */
const createEvent = async (auth, calendarId, eventData) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.insert({
      calendarId,
      resource: eventData
    });
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Update an existing event in Google Calendar
 */
const updateEvent = async (auth, calendarId, eventId, eventData) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.update({
      calendarId,
      eventId,
      resource: eventData
    });
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event from Google Calendar
 */
const deleteEvent = async (auth, calendarId, eventId) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({
      calendarId,
      eventId
    });
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Sync events from Google Calendar to our database
 */
const syncEventsToDatabase = async (userId, auth, calendarId) => {
  try {
    // Get events from Google Calendar
    const events = await getEvents(auth, calendarId);
    
    // Begin transaction
    const client = await pool.query('BEGIN');
    try {
      // Get calendar details to insert or update in our db
      const calendar = google.calendar({ version: 'v3', auth });
      const calDetails = await calendar.calendarList.get({ calendarId });
      
      // Insert/update calendar in our database
      const calendarQuery = `
        INSERT INTO calendars (calendar_id, name, timezone_id, prod_id, method)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (calendar_id) 
        DO UPDATE SET 
          name = $2,
          timezone_id = $3,
          prod_id = $4,
          method = $5
      `;
      
      await pool.query(calendarQuery, [
        calendarId,
        calDetails.data.summary,
        calDetails.data.timeZone,
        '', // prod_id is not available in Google Calendar API
        '' // method is not applicable
      ]);
      
      // Process each event
      for (const event of events) {
        // Format dates
        let startTime, endTime, allDay = false;
        
        if (event.start.dateTime) {
          // This is a timed event
          startTime = new Date(event.start.dateTime);
          endTime = new Date(event.end.dateTime);
        } else {
          // This is an all-day event
          startTime = new Date(event.start.date);
          endTime = new Date(event.end.date);
          allDay = true;
        }
        
        // Insert/update event in our database
        const eventQuery = `
          INSERT INTO events (
            event_id, calendar_id, summary, description, location,
            start_time, end_time, all_day, timezone_id, transparency,
            status, created_at, updated_at, sequence, recurring_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (event_id) 
          DO UPDATE SET 
            calendar_id = $2,
            summary = $3,
            description = $4,
            location = $5,
            start_time = $6,
            end_time = $7,
            all_day = $8,
            timezone_id = $9,
            transparency = $10,
            status = $11,
            updated_at = $13,
            sequence = $14,
            recurring_id = $15
        `;
        
        const eventParams = [
          event.id,
          calendarId,
          event.summary || '',
          event.description || '',
          event.location || '',
          startTime,
          endTime,
          allDay,
          event.start.timeZone || calDetails.data.timeZone,
          event.transparency || 'opaque',
          event.status || 'confirmed',
          new Date(event.created),
          new Date(event.updated),
          event.sequence || 0,
          event.recurringEventId || null
        ];
        
        await pool.query(eventQuery, eventParams);
        
        // Handle recurrence
        if (event.recurrence) {
          const recurrenceQuery = `
            INSERT INTO recurrences (event_id, rrule, exdate, recurrence_instance)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (recurrence_id) 
            DO UPDATE SET 
              rrule = $2,
              exdate = $3,
              recurrence_instance = $4
          `;
          
          const rrule = event.recurrence.find(r => r.startsWith('RRULE:')) || '';
          const exdate = event.recurrence.find(r => r.startsWith('EXDATE:')) || '';
          
          await pool.query(recurrenceQuery, [
            event.id,
            rrule.replace('RRULE:', ''),
            exdate.replace('EXDATE:', ''),
            null // recurrence_instance is not applicable for the original event
          ]);
        }
        
        // Handle attendees
        if (event.attendees && event.attendees.length > 0) {
          // First delete existing attendees
          await pool.query('DELETE FROM attendees WHERE event_id = $1', [event.id]);
          
          // Then insert new attendees
          for (const attendee of event.attendees) {
            const attendeeQuery = `
              INSERT INTO attendees (event_id, email, display_name, response_status)
              VALUES ($1, $2, $3, $4)
            `;
            
            await pool.query(attendeeQuery, [
              event.id,
              attendee.email,
              attendee.displayName || '',
              attendee.responseStatus || 'needsAction'
            ]);
          }
        }
      }
      
      // Update user settings with last sync time
      const updateUserQuery = `
        UPDATE user_settings
        SET google_sync_time = NOW()
        WHERE user_id = $1
      `;
      
      await pool.query(updateUserQuery, [userId]);
      
      // Commit transaction
      await pool.query('COMMIT');
      
      return { success: true, count: events.length };
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error in transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error syncing events:', error);
    throw error;
  }
};

/**
 * Set up auth client with tokens
 */
const setupAuthWithTokens = (tokens) => {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

module.exports = {
  getAuthUrl,
  getTokens,
  listCalendars,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  syncEventsToDatabase,
  setupAuthWithTokens
};