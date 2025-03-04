// server/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

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

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Import routes
const eventRoutes = require('./routes/event.routes');
const venueRoutes = require('./routes/venue.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const googleAuthRoutes = require('./routes/googleAuth.routes');

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/google', googleAuthRoutes);

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});