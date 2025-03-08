// server/controllers/settings.controller.js
const { pool } = require('../index');

const settingsController = {
  // Get all settings for a user
  getSettings: async (req, res) => {
    const userId = req.user ? req.user.id : 1; // In a real app, always from req.user
    
    try {
      const query = `
        SELECT 
          default_calendar_id,
          sync_direction,
          sync_frequency,
          last_sync,
          next_sync,
          default_tax_rate,
          dark_mode
        FROM user_settings
        WHERE user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Settings not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  },
  
  // Get sync settings for a user
  getSyncSettings: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    
    try {
      const query = `
        SELECT 
          default_calendar_id,
          sync_direction,
          sync_frequency,
          last_sync,
          next_sync,
          google_auth_token IS NOT NULL as is_connected
        FROM user_settings
        WHERE user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return res.json({
          syncDirection: 'both',
          syncFrequency: 'daily',
          isConnected: false
        });
      }
      
      res.json({
        defaultCalendarId: result.rows[0].default_calendar_id,
        syncDirection: result.rows[0].sync_direction || 'both',
        syncFrequency: result.rows[0].sync_frequency || 'daily',
        lastSync: result.rows[0].last_sync,
        nextSync: result.rows[0].next_sync,
        isConnected: result.rows[0].is_connected
      });
    } catch (error) {
      console.error('Error getting sync settings:', error);
      res.status(500).json({ error: 'Failed to get sync settings' });
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
        // Settings don't exist yet, create them
        const insertQuery = `
          INSERT INTO user_settings (
            user_id, 
            sync_direction, 
            sync_frequency,
            next_sync
          )
          VALUES (
            $1, 
            $2, 
            $3,
            CASE 
              WHEN $3 = 'hourly' THEN NOW() + INTERVAL '1 hour'
              WHEN $3 = 'daily' THEN NOW() + INTERVAL '1 day'
              WHEN $3 = 'weekly' THEN NOW() + INTERVAL '1 week'
              ELSE NULL
            END
          )
          RETURNING *
        `;
        
        const insertResult = await pool.query(insertQuery, [
          userId, 
          syncDirection || 'both', 
          syncFrequency || 'daily'
        ]);
        
        return res.json({
          syncDirection: insertResult.rows[0].sync_direction,
          syncFrequency: insertResult.rows[0].sync_frequency,
          nextSync: insertResult.rows[0].next_sync
        });
      }
      
      res.json({
        syncDirection: result.rows[0].sync_direction,
        syncFrequency: result.rows[0].sync_frequency,
        nextSync: result.rows[0].next_sync
      });
    } catch (error) {
      console.error('Error updating sync settings:', error);
      res.status(500).json({ error: 'Failed to update sync settings' });
    }
  },
  
  // Update UI preferences
  updateUiPreferences: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    const { darkMode } = req.body;
    
    try {
      const query = `
        UPDATE user_settings
        SET dark_mode = $2, updated_at = NOW()
        WHERE user_id = $1
        RETURNING dark_mode
      `;
      
      const result = await pool.query(query, [userId, darkMode]);
      
      if (result.rows.length === 0) {
        // Settings don't exist yet, create them
        const insertQuery = `
          INSERT INTO user_settings (user_id, dark_mode)
          VALUES ($1, $2)
          RETURNING dark_mode
        `;
        
        const insertResult = await pool.query(insertQuery, [userId, darkMode]);
        
        return res.json({ darkMode: insertResult.rows[0].dark_mode });
      }
      
      res.json({ darkMode: result.rows[0].dark_mode });
    } catch (error) {
      console.error('Error updating UI preferences:', error);
      res.status(500).json({ error: 'Failed to update UI preferences' });
    }
  },
  
  // Update financial preferences
  updateFinancialPreferences: async (req, res) => {
    const userId = req.user ? req.user.id : 1;
    const { defaultTaxRate } = req.body;
    
    try {
      const query = `
        UPDATE user_settings
        SET default_tax_rate = $2, updated_at = NOW()
        WHERE user_id = $1
        RETURNING default_tax_rate
      `;
      
      const result = await pool.query(query, [userId, defaultTaxRate]);
      
      if (result.rows.length === 0) {
        // Settings don't exist yet, create them
        const insertQuery = `
          INSERT INTO user_settings (user_id, default_tax_rate)
          VALUES ($1, $2)
          RETURNING default_tax_rate
        `;
        
        const insertResult = await pool.query(insertQuery, [userId, defaultTaxRate]);
        
        return res.json({ defaultTaxRate: insertResult.rows[0].default_tax_rate });
      }
      
      res.json({ defaultTaxRate: result.rows[0].default_tax_rate });
    } catch (error) {
      console.error('Error updating financial preferences:', error);
      res.status(500).json({ error: 'Failed to update financial preferences' });
    }
  }
};

module.exports = settingsController;