// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const cron = require('node-cron');
const googleCalendarService = require('./services/googleCalendar');

// Create the database pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Export the pool separately
exports.pool = pool;

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import User model for admin creation
const User = require('./db/models/User');

// Initialize database and create admin user
const initializeApp = async () => {
  try {
    // Initialize database with users table
    const client = await pool.connect();
    try {
      // Create users table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      // Run migrations
      const { addSyncSettings } = require('./db/migrations/add_sync_settings');
      await addSyncSettings();
      
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    } finally {
      client.release();
    }
    
    // Ensure admin user exists
    await User.ensureAdminExists();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Continue running the server even if initialization fails
  }
};

// Run the initialization function
initializeApp();

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Import routes
const venueRoutes = require('./routes/venue.routes');
const eventRoutes = require('./routes/event.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const googleAuthRoutes = require('./routes/googleAuth.routes');
const authRoutes = require('./routes/auth.routes');
const settingsRoutes = require('./routes/settings.routes');

// API Routes
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/google', googleAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Test route for Google Auth
app.get('/api/google/test', (req, res) => {
  res.json({
    clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    secretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl: process.env.GOOGLE_REDIRECT_URL
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CalCalc API' });
});

// Static files (if you're serving frontend from the same server)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
 
  // Catch-all route for frontend (in production)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Set up automatic calendar sync using cron
const setupCalendarSyncCron = async () => {
  // Schedule event to run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('Running scheduled calendar sync check...');
      
      // Find users with scheduled syncs due
      const query = `
        SELECT 
          user_id, google_auth_token, google_refresh_token, 
          default_calendar_id, sync_direction
        FROM user_settings
        WHERE next_sync <= NOW()
          AND google_auth_token IS NOT NULL
          AND google_refresh_token IS NOT NULL
          AND default_calendar_id IS NOT NULL
      `;
      
      const result = await pool.query(query);
      
      console.log(`Found ${result.rows.length} users with pending sync`);
      
      // Process each user's sync
      for (const user of result.rows) {
        try {
          console.log(`Syncing calendar for user ${user.user_id}...`);
          
          // Set up auth with tokens
          const auth = googleCalendarService.setupAuthWithTokens({
            access_token: user.google_auth_token,
            refresh_token: user.google_refresh_token
          });
          
          // Perform sync based on direction
          const syncDirection = user.sync_direction || 'both';
          
          if (syncDirection === 'import' || syncDirection === 'both') {
            await googleCalendarService.syncEventsToDatabase(
              user.user_id,
              auth,
              user.default_calendar_id
            );
          }
          
          if (syncDirection === 'export' || syncDirection === 'both') {
            // Get local events that need to be exported
            const localEventsQuery = `
              SELECT e.event_id, e.summary, e.description, e.location,
                     e.start_time, e.end_time, e.all_day, e.timezone_id
              FROM events e
              WHERE e.google_id IS NULL AND e.calendar_id IS NULL
            `;
            
            const localEvents = await pool.query(localEventsQuery);
            
            // Export each event
            for (const event of localEvents.rows) {
              try {
                const googleEvent = await googleCalendarService.createEvent(
                  auth,
                  user.default_calendar_id,
                  googleCalendarService.formatEventForGoogle(event)
                );
                
                // Update local event with Google ID
                await pool.query(
                  `UPDATE events 
                   SET google_id = $1, calendar_id = $2
                   WHERE event_id = $3`,
                  [googleEvent.id, user.default_calendar_id, event.event_id]
                );
              } catch (exportError) {
                console.error(`Error exporting event ${event.event_id}:`, exportError);
              }
            }
          }
          
          // Update last sync time and schedule next sync
          const updateQuery = `
            UPDATE user_settings
            SET last_sync = NOW(),
                next_sync = CASE
                  WHEN sync_frequency = 'hourly' THEN NOW() + INTERVAL '1 hour'
                  WHEN sync_frequency = 'daily' THEN NOW() + INTERVAL '1 day'
                  WHEN sync_frequency = 'weekly' THEN NOW() + INTERVAL '1 week'
                  ELSE NULL
                END
            WHERE user_id = $1
          `;
          
          await pool.query(updateQuery, [user.user_id]);
          
          console.log(`Sync completed for user ${user.user_id}`);
        } catch (userError) {
          console.error(`Error syncing for user ${user.user_id}:`, userError);
        }
      }
    } catch (error) {
      console.error('Error in scheduled calendar sync:', error);
    }
  });
  
  console.log('Calendar sync cron job initialized');
};

// Start cron job for calendar sync
setupCalendarSyncCron();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});