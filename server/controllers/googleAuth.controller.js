// server/controllers/googleAuth.controller.js
const { pool } = require('../index');
const googleCalendar = require('../services/googleCalendar');

const googleAuthController = {
  // Get Google OAuth URL
  getAuthUrl: (req, res) => {
    try {
      const url = googleCalendar.getAuthUrl();
      res.json({ url });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ error: 'Failed to generate authentication URL' });
    }
  },

  // Handle OAuth callback
  handleCallback: async (req, res) => {
    const { code } = req.query;
    const userId = req.user ? req.user.id : 1; // In a real app, get this from session/JWT
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    try {
      // Get tokens from Google
      const tokens = await googleCalendar.getTokens(code);
      
      // Set up the auth client with these tokens
      const auth = googleCalendar.setupAuthWithTokens(tokens);
      
      // Get list of user's calendars
      const calendars = await googleCalendar.listCalendars(auth);
      
      // Find primary calendar (or first one)
      const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0];
      
      if (!primaryCalendar) {
        return res.status(404).json({ error: 'No calendars found for this account' });
      }
      
      // Store tokens and calendar info in database
      const query = `
        INSERT INTO user_settings (
          user_id, email, google_auth_token, google_refresh_token, 
          default_calendar_id, sync_frequency, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          email = $2,
          google_auth_token = $3,
          google_refresh_token = $4,
          default_calendar_id = $5,
          sync_frequency = $6,
          updated_at = NOW()
      `;
      
      await pool.query(query, [
        userId,
        primaryCalendar.id.includes('@') ? primaryCalendar.id.split('@')[0] : 'user',
        tokens.access_token,
        tokens.refresh_token,
        primaryCalendar.id,
        'daily'
      ]);
      
      // Sync events from the primary calendar
      await googleCalendar.syncEventsToDatabase(userId, auth, primaryCalendar.id);
      
      // Redirect to the frontend with success status
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/google/callback${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`);
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
  },

  // Generic sync endpoint - handles bidirectional sync
  syncCalendar: async (req, res) => {
    const userId = req.user ? req.user.id : 1; // In a real app, get this from session/JWT
    
    try {
      // Get user settings with Google tokens
      const userQuery = `
        SELECT google_auth_token, google_refresh_token, default_calendar_id,
               sync_direction
        FROM user_settings
        WHERE user_id = $1
      `;
      
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found or not connected to Google' });
      }
      
      const user = userResult.rows[0];
      
      if (!user.google_auth_token || !user.default_calendar_id) {
        return res.status(400).json({ error: 'Google Calendar not connected' });
      }
      
      // Set up auth with tokens
      const auth = googleCalendar.setupAuthWithTokens({
        access_token: user.google_auth_token,
        refresh_token: user.google_refresh_token
      });
      
      // Get sync direction (default to 'both')
      const syncDirection = user.sync_direction || 'both';
      
      // Initialize result object
      const result = {
        imported: 0,
        exported: 0,
        errors: []
      };
      
      // Import events from Google if direction is 'import' or 'both'
      if (syncDirection === 'import' || syncDirection === 'both') {
        try {
          const importResult = await googleCalendar.syncEventsToDatabase(
            userId, 
            auth, 
            user.default_calendar_id
          );
          
          result.imported = importResult.count || 0;
        } catch (error) {
          console.error('Error importing events:', error);
          result.errors.push({
            type: 'import',
            message: error.message || 'Failed to import events'
          });
        }
      }
      
      // Export events to Google if direction is 'export' or 'both'
      if (syncDirection === 'export' || syncDirection === 'both') {
        try {
          // Get local events that don't have a Google ID yet
          const localEventsQuery = `
            SELECT e.event_id, e.summary, e.description, e.location,
                   e.start_time, e.end_time, e.all_day, e.timezone_id
            FROM events e
            WHERE e.google_id IS NULL
              AND e.calendar_id IS NULL
          `;
          
          const localEvents = await pool.query(localEventsQuery);
          
          // Export each event to Google
          for (const event of localEvents.rows) {
            try {
              const googleEvent = await googleCalendar.createEvent(
                auth,
                user.default_calendar_id,
                googleCalendar.formatEventForGoogle(event)
              );
              
              // Update local event with Google ID
              await pool.query(
                `UPDATE events 
                 SET google_id = $1, calendar_id = $2
                 WHERE event_id = $3`,
                [googleEvent.id, user.default_calendar_id, event.event_id]
              );
              
              result.exported++;
            } catch (exportError) {
              console.error(`Error exporting event ${event.event_id}:`, exportError);
              result.errors.push({
                type: 'export',
                eventId: event.event_id,
                message: exportError.message || 'Failed to export event'
              });
            }
          }
        } catch (error) {
          console.error('Error exporting events:', error);
          result.errors.push({
            type: 'export',
            message: error.message || 'Failed to export events'
          });
        }
      }
      
      // Update last sync time
      await pool.query(
        `UPDATE user_settings
         SET last_sync = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      
      // Calculate next scheduled sync based on frequency
      const updateNextSyncQuery = `
        UPDATE user_settings
        SET next_sync = CASE
          WHEN sync_frequency = 'hourly' THEN NOW() + INTERVAL '1 hour'
          WHEN sync_frequency = 'daily' THEN NOW() + INTERVAL '1 day'
          WHEN sync_frequency = 'weekly' THEN NOW() + INTERVAL '1 week'
          ELSE NULL
        END
        WHERE user_id = $1
        RETURNING next_sync
      `;
      
      const nextSyncResult = await pool.query(updateNextSyncQuery, [userId]);
      
      res.json({ 
        success: true, 
        message: `Successfully synced ${result.imported} imported and ${result.exported} exported events`,
        result,
        nextSync: nextSyncResult.rows[0]?.next_sync
      });
    } catch (error) {
      console.error('Error syncing calendar:', error);
      res.status(500).json({ error: 'Failed to sync calendar' });
    }
  },

  // Import events from Google Calendar
  importEvents: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    const { calendarId } = req.body;
    
    try {
      // Get user settings with Google tokens
      const userQuery = `
        SELECT google_auth_token, google_refresh_token, default_calendar_id
        FROM user_settings
        WHERE user_id = $1
      `;
      
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found or not connected to Google' });
      }
      
      const user = userResult.rows[0];
      
      if (!user.google_auth_token) {
        return res.status(400).json({ error: 'Google Calendar not connected' });
      }
      
      // Set up auth with tokens
      const auth = googleCalendar.setupAuthWithTokens({
        access_token: user.google_auth_token,
        refresh_token: user.google_refresh_token
      });
      
      // Use provided calendar ID or default
      const targetCalendarId = calendarId || user.default_calendar_id;
      
      if (!targetCalendarId) {
        return res.status(400).json({ error: 'No calendar specified' });
      }
      
      // Import events
      const result = await googleCalendar.syncEventsToDatabase(
        userId, 
        auth, 
        targetCalendarId
      );
      
      // Update last sync time
      await pool.query(
        `UPDATE user_settings
         SET last_sync = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      
      res.json({ 
        success: true, 
        message: `Successfully imported ${result.count} events from Google Calendar`,
        result
      });
    } catch (error) {
      console.error('Error importing events:', error);
      res.status(500).json({ error: 'Failed to import events' });
    }
  },

  // Export events to Google Calendar
  exportEvents: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    const { calendarId, eventIds } = req.body;
    
    try {
      // Get user settings with Google tokens
      const userQuery = `
        SELECT google_auth_token, google_refresh_token, default_calendar_id
        FROM user_settings
        WHERE user_id = $1
      `;
      
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found or not connected to Google' });
      }
      
      const user = userResult.rows[0];
      
      if (!user.google_auth_token) {
        return res.status(400).json({ error: 'Google Calendar not connected' });
      }
      
      // Set up auth with tokens
      const auth = googleCalendar.setupAuthWithTokens({
        access_token: user.google_auth_token,
        refresh_token: user.google_refresh_token
      });
      
      // Use provided calendar ID or default
      const targetCalendarId = calendarId || user.default_calendar_id;
      
      if (!targetCalendarId) {
        return res.status(400).json({ error: 'No calendar specified' });
      }
      
      // Get events to export (either specific IDs or all without Google ID)
      let eventsQuery;
      let queryParams;
      
      if (eventIds && eventIds.length > 0) {
        // Export specific events
        eventsQuery = `
          SELECT e.event_id, e.summary, e.description, e.location,
                 e.start_time, e.end_time, e.all_day, e.timezone_id,
                 e.google_id
          FROM events e
          WHERE e.event_id = ANY($1)
        `;
        queryParams = [eventIds];
      } else {
        // Export all events without Google ID
        eventsQuery = `
          SELECT e.event_id, e.summary, e.description, e.location,
                 e.start_time, e.end_time, e.all_day, e.timezone_id
          FROM events e
          WHERE e.google_id IS NULL
            AND e.calendar_id IS NULL
        `;
        queryParams = [];
      }
      
      const eventsResult = await pool.query(eventsQuery, queryParams);
      const events = eventsResult.rows;
      
      // Results tracking
      const result = {
        total: events.length,
        exported: 0,
        updated: 0,
        errors: []
      };
      
      // Export each event
      for (const event of events) {
        try {
          const googleEventData = googleCalendar.formatEventForGoogle(event);
          
          if (event.google_id) {
            // Update existing Google event
            const updatedEvent = await googleCalendar.updateEvent(
              auth,
              targetCalendarId,
              event.google_id,
              googleEventData
            );
            
            result.updated++;
          } else {
            // Create new Google event
            const newEvent = await googleCalendar.createEvent(
              auth,
              targetCalendarId,
              googleEventData
            );
            
            // Update local event with Google ID
            await pool.query(
              `UPDATE events 
               SET google_id = $1, calendar_id = $2
               WHERE event_id = $3`,
              [newEvent.id, targetCalendarId, event.event_id]
            );
            
            result.exported++;
          }
        } catch (error) {
          console.error(`Error exporting event ${event.event_id}:`, error);
          result.errors.push({
            eventId: event.event_id,
            message: error.message || 'Failed to export event'
          });
        }
      }
      
      // Update last sync time
      await pool.query(
        `UPDATE user_settings
         SET last_sync = NOW()
         WHERE user_id = $1`,
        [userId]
      );
      
      res.json({ 
        success: true, 
        message: `Successfully exported ${result.exported} events and updated ${result.updated} events in Google Calendar`,
        result
      });
    } catch (error) {
      console.error('Error exporting events:', error);
      res.status(500).json({ error: 'Failed to export events' });
    }
  },

  // List available calendars
  listCalendars: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    
    try {
      // Get user settings with Google tokens
      const userQuery = `
        SELECT google_auth_token, google_refresh_token
        FROM user_settings
        WHERE user_id = $1
      `;
      
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found or not connected to Google' });
      }
      
      const user = userResult.rows[0];
      
      if (!user.google_auth_token) {
        return res.status(400).json({ error: 'Google Calendar not connected' });
      }
      
      // Set up auth with tokens
      const auth = googleCalendar.setupAuthWithTokens({
        access_token: user.google_auth_token,
        refresh_token: user.google_refresh_token
      });
      
      // Get calendars
      const calendars = await googleCalendar.listCalendars(auth);
      
      res.json(calendars.map(calendar => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        primary: calendar.primary || false
      })));
    } catch (error) {
      console.error('Error listing calendars:', error);
      res.status(500).json({ error: 'Failed to list calendars' });
    }
  },

  // Update default calendar
  updateDefaultCalendar: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    const { calendarId } = req.body;
    
    if (!calendarId) {
      return res.status(400).json({ error: 'Calendar ID is required' });
    }
    
    try {
      const query = `
        UPDATE user_settings
        SET default_calendar_id = $1,
            updated_at = NOW()
        WHERE user_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [calendarId, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ success: true, message: 'Default calendar updated' });
    } catch (error) {
      console.error('Error updating default calendar:', error);
      res.status(500).json({ error: 'Failed to update default calendar' });
    }
  },

  // Update sync settings
  updateSyncSettings: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    const { syncDirection, syncFrequency } = req.body;
    
    try {
      // Validate sync direction
      const validDirections = ['import', 'export', 'both'];
      if (syncDirection && !validDirections.includes(syncDirection)) {
        return res.status(400).json({ error: 'Invalid sync direction' });
      }
      
      // Validate sync frequency
      const validFrequencies = ['manual', 'hourly', 'daily', 'weekly'];
      if (syncFrequency && !validFrequencies.includes(syncFrequency)) {
        return res.status(400).json({ error: 'Invalid sync frequency' });
      }
      
      // Build query based on provided values
      let query = 'UPDATE user_settings SET updated_at = NOW()';
      const values = [userId];
      let paramIndex = 2;
      
      if (syncDirection) {
        query += `, sync_direction = $${paramIndex}`;
        values.push(syncDirection);
        paramIndex++;
      }
      
      if (syncFrequency) {
        query += `, sync_frequency = $${paramIndex}`;
        values.push(syncFrequency);
        paramIndex++;
        
        // Update next sync time based on frequency
        if (syncFrequency !== 'manual') {
          query += `, next_sync = CASE 
                      WHEN $${paramIndex} = 'hourly' THEN NOW() + INTERVAL '1 hour'
                      WHEN $${paramIndex} = 'daily' THEN NOW() + INTERVAL '1 day'
                      WHEN $${paramIndex} = 'weekly' THEN NOW() + INTERVAL '1 week'
                      ELSE NULL
                    END`;
          values.push(syncFrequency);
          paramIndex++;
        } else {
          query += `, next_sync = NULL`;
        }
      }
      
      query += ` WHERE user_id = $1 RETURNING *`;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Sync settings updated',
        settings: {
          syncDirection: result.rows[0].sync_direction,
          syncFrequency: result.rows[0].sync_frequency,
          nextSync: result.rows[0].next_sync
        }
      });
    } catch (error) {
      console.error('Error updating sync settings:', error);
      res.status(500).json({ error: 'Failed to update sync settings' });
    }
  }
};

module.exports = googleAuthController;