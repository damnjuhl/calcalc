// server/db/migrations/add_sync_settings.js
const { pool } = require('../../index'); // Use the existing pool from index.js

async function addSyncSettings() {
  const client = await pool.connect();
  try {
    // Update user_settings table with new sync fields
    await client.query(`
      ALTER TABLE user_settings
      ADD COLUMN IF NOT EXISTS sync_direction VARCHAR(10) DEFAULT 'both',
      ADD COLUMN IF NOT EXISTS sync_frequency VARCHAR(10) DEFAULT 'daily',
      ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_sync TIMESTAMP;
    `);
    
    // Add new fields to events table for Google integration
    await client.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS calendar_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 0;
      
      -- Add index for faster lookups by Google ID
      CREATE INDEX IF NOT EXISTS events_google_id_idx ON events(google_id);
    `);
    
    // Add financial data fields to events
    await client.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS income DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS expenses DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS venue_id INTEGER;
    `);
    
    console.log('Sync settings added successfully');
  } catch (err) {
    console.error('Error adding sync settings:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { addSyncSettings };