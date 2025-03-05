// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

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

// API Routes
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/google', googleAuthRoutes);
app.use('/api/auth', authRoutes);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});