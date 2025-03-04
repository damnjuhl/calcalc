// server/db/migrate.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initial schema (using existing SQL from note.txt)
const initialSchema = `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS calendars (
    calendar_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    timezone_id VARCHAR(255),
    prod_id VARCHAR(255),
    method VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR(255) PRIMARY KEY,
    calendar_id VARCHAR(255),
    summary TEXT,
    description TEXT,
    location TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    all_day BOOLEAN,
    timezone_id VARCHAR(255),
    transparency VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    sequence INT,
    recurring_id VARCHAR(255),
    FOREIGN KEY (calendar_id) REFERENCES calendars(calendar_id)
);

CREATE TABLE IF NOT EXISTS recurrences (
    recurrence_id SERIAL PRIMARY KEY,
    event_id VARCHAR(255),
    rrule TEXT,
    exdate TEXT,
    recurrence_instance TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE IF NOT EXISTS attendees (
    attendee_id SERIAL PRIMARY KEY,
    event_id VARCHAR(255),
    email VARCHAR(255),
    display_name VARCHAR(255),
    response_status VARCHAR(50),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE IF NOT EXISTS alarms (
    alarm_id SERIAL PRIMARY KEY,
    event_id VARCHAR(255),
    action VARCHAR(50),
    trigger VARCHAR(50),
    description TEXT,
    acknowledged TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Venues table to track venue information
CREATE TABLE IF NOT EXISTS venues (
    venue_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    capacity INTEGER,
    location TEXT,
    base_rate DECIMAL(10,2),
    event_keywords TEXT,
    typical_revenue DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial data table to track income and expenses
CREATE TABLE IF NOT EXISTS financial_data (
    financial_id SERIAL PRIMARY KEY,
    event_id VARCHAR(255),
    venue_id INTEGER,
    income DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- Categories for events
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    description TEXT
);

-- Event categories (many-to-many relationship)
CREATE TABLE IF NOT EXISTS event_categories (
    event_id VARCHAR(255),
    category_id INTEGER,
    PRIMARY KEY (event_id, category_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- User settings for application and sync preferences
CREATE TABLE IF NOT EXISTS user_settings (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    google_auth_token TEXT,
    google_refresh_token TEXT,
    default_calendar_id VARCHAR(255),
    default_tax_rate DECIMAL(5,2) DEFAULT 0,
    sync_frequency VARCHAR(50) DEFAULT 'daily',
    dark_mode BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
`;

// Seed data for initial setup
const seedData = `
-- Insert default categories
INSERT INTO categories (name, color, description)
VALUES 
('Wedding', '#4CAF50', 'Wedding events'),
('Corporate', '#FF9800', 'Business and corporate events'),
('Club', '#9C27B0', 'Nightclub and entertainment events'),
('Private Party', '#FFEB3B', 'Private gatherings and parties')
ON CONFLICT (category_id) DO NOTHING;

-- Insert sample venues
INSERT INTO venues (name, type, capacity, location, base_rate, event_keywords, typical_revenue)
VALUES 
('Grand Ballroom', 'Wedding', 300, 'Downtown', 5000.00, 'Banquet, Gala, Reception', 7000.00),
('City Conference Center', 'Corporate', 500, 'Midtown', 8000.00, 'Expo, Seminar, Conference', 10000.00),
('Lakeside Pavilion', 'Wedding', 200, 'Lakeview', 4000.00, 'Outdoor, Wedding, Reception', 6000.00),
('Club Lounge', 'Club', 150, 'Downtown', 3000.00, 'Party, DJ, Nightlife', 5000.00)
ON CONFLICT (venue_id) DO NOTHING;
`;

// Run migration
async function migrate() {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    console.log('Applying database schema...');
    await client.query(initialSchema);
    
    console.log('Seeding initial data...');
    await client.query(seedData);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Release client
    client.release();
    
    // Close pool
    pool.end();
  }
}

// Run migration
migrate().catch(console.error);