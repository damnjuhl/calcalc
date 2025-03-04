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
    const userId = 1; // In a real app, get this from session/JWT
    
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

  // Manually trigger calendar sync
  syncCalendar: async (req, res) => {
    const userId = 1; // In a real app, get this from session/JWT
    
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
      
      if (!user.google_auth_token || !user.default_calendar_id) {
        return res.status(400).json({ error: 'Google Calendar not connected' });
      }
      
      // Set up auth with tokens
      const auth = googleCalendar.setupAuthWithTokens({
        access_token: user.google_auth_token,
        refresh_token: user.google_refresh_token
      });
      
      // Sync events
      const result = await googleCalendar.syncEventsToDatabase(
        userId, 
        auth, 
        user.default_calendar_id
      );
      
      res.json({ 
        success: true, 
        message: `Successfully synced ${result.count} events from Google Calendar` 
      });
    } catch (error) {
      console.error('Error syncing calendar:', error);
      res.status(500).json({ error: 'Failed to sync calendar' });
    }
  },

  // List available calendars
  listCalendars: async (req, res) => {
    const userId = 1; // In a real app, get this from session/JWT
    
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
    const userId = 1; // In a real app, get this from session/JWT
    const { calendarId } = req.body;
    
    if (!calendarId) {
      return res.status(400).json({ error: 'Calendar ID is required' });
    }
    
    try {
      const query = `
        UPDATE user_settings
        SET default_calendar_id = $1
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
  }
};

module.exports = googleAuthController;