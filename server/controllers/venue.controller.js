// server/controllers/venue.controller.js
const pool = require('../index');

const venueController = {
  // Get all venues
  getAllVenues: async (req, res) => {
    try {
      const query = `
        SELECT * FROM venues
        ORDER BY name
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting venues:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get venue by ID
  getVenueById: async (req, res) => {
    const { id } = req.params;
    try {
      const query = `
        SELECT * FROM venues
        WHERE venue_id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting venue by ID:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Create new venue
  createVenue: async (req, res) => {
    const { 
      name, 
      type, 
      capacity, 
      location, 
      base_rate, 
      event_keywords, 
      typical_revenue
    } = req.body;
    
    try {
      const query = `
        INSERT INTO venues (
          name, 
          type, 
          capacity, 
          location, 
          base_rate, 
          event_keywords, 
          typical_revenue,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        name, 
        type, 
        capacity, 
        location, 
        base_rate, 
        event_keywords, 
        typical_revenue
      ];
      
      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating venue:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Update venue
  updateVenue: async (req, res) => {
    const { id } = req.params;
    const { 
      name, 
      type, 
      capacity, 
      location, 
      base_rate, 
      event_keywords, 
      typical_revenue
    } = req.body;
    
    try {
      const query = `
        UPDATE venues
        SET 
          name = $1,
          type = $2,
          capacity = $3,
          location = $4,
          base_rate = $5,
          event_keywords = $6,
          typical_revenue = $7,
          updated_at = NOW()
        WHERE venue_id = $8
        RETURNING *
      `;
      
      const values = [
        name, 
        type, 
        capacity, 
        location, 
        base_rate, 
        event_keywords, 
        typical_revenue,
        id
      ];
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating venue:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Delete venue
  deleteVenue: async (req, res) => {
    const { id } = req.params;
    
    try {
      // First check if there are any financial_data entries referencing this venue
      const checkQuery = `
        SELECT COUNT(*) FROM financial_data
        WHERE venue_id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete venue with associated financial data' 
        });
      }
      
      // If no references, delete the venue
      const deleteQuery = `
        DELETE FROM venues
        WHERE venue_id = $1
        RETURNING *
      `;
      
      const deleteResult = await pool.query(deleteQuery, [id]);
      
      if (deleteResult.rows.length === 0) {
        return res.status(404).json({ error: 'Venue not found' });
      }
      
      res.json({ message: 'Venue deleted successfully' });
    } catch (error) {
      console.error('Error deleting venue:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get venue revenue analytics
  getVenueRevenue: async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    try {
      let query = `
        SELECT 
          v.name AS venue_name,
          SUM(f.income) AS total_revenue,
          SUM(f.expenses) AS total_expenses,
          SUM(f.income - f.expenses) AS net_profit,
          COUNT(DISTINCT e.event_id) AS event_count,
          COALESCE(SUM(f.income) / NULLIF(COUNT(DISTINCT e.event_id), 0), 0) AS avg_event_revenue
        FROM venues v
        LEFT JOIN financial_data f ON v.venue_id = f.venue_id
        LEFT JOIN events e ON f.event_id = e.event_id
      `;
      
      const values = [];
      let whereClause = [];
      
      // Add venue ID condition
      whereClause.push(`v.venue_id = $${values.length + 1}`);
      values.push(id);
      
      // Add date range conditions if provided
      if (startDate) {
        whereClause.push(`e.start_time >= $${values.length + 1}`);
        values.push(startDate);
      }
      
      if (endDate) {
        whereClause.push(`e.end_time <= $${values.length + 1}`);
        values.push(endDate);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY v.venue_id, v.name`;
      
      const result = await pool.query(query, values);
      
      // If no venue found
      if (result.rows.length === 0) {
        const venueCheck = await pool.query('SELECT * FROM venues WHERE venue_id = $1', [id]);
        
        if (venueCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Venue not found' });
        }
        
        // Venue exists but no revenue data
        return res.json({
          venue_name: venueCheck.rows[0].name,
          total_revenue: 0,
          total_expenses: 0,
          net_profit: 0,
          event_count: 0,
          avg_event_revenue: 0
        });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting venue revenue:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get venue utilization
  getVenueUtilization: async (req, res) => {
    const { id } = req.params;
    const { year } = req.query;
    
    try {
      const currentYear = year || new Date().getFullYear();
      
      // Query to get monthly event counts for the venue
      const query = `
        SELECT 
          v.venue_id,
          v.name AS venue_name,
          EXTRACT(MONTH FROM e.start_time) AS month,
          COUNT(DISTINCT e.event_id) AS event_count
        FROM venues v
        LEFT JOIN events e ON v.venue_id = $1 AND e.location LIKE '%' || v.name || '%'
        WHERE v.venue_id = $1
        AND EXTRACT(YEAR FROM e.start_time) = $2
        GROUP BY v.venue_id, v.name, month
        ORDER BY month
      `;
      
      const result = await pool.query(query, [id, currentYear]);
      
      // If no venue found
      if (result.rows.length === 0) {
        const venueCheck = await pool.query('SELECT * FROM venues WHERE venue_id = $1', [id]);
        
        if (venueCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Venue not found' });
        }
        
        // Venue exists but no utilization data
        const emptyUtilization = {
          venue_id: venueCheck.rows[0].venue_id,
          venue_name: venueCheck.rows[0].name,
          utilization: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            event_count: 0
          }))
        };
        
        return res.json(emptyUtilization);
      }
      
      // Format the response to include all months (even those with zero events)
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthData = result.rows.find(row => parseInt(row.month) === i + 1);
        return {
          month: i + 1,
          event_count: monthData ? parseInt(monthData.event_count) : 0
        };
      });
      
      res.json({
        venue_id: result.rows[0].venue_id,
        venue_name: result.rows[0].venue_name,
        utilization: monthlyData
      });
    } catch (error) {
      console.error('Error getting venue utilization:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = venueController;