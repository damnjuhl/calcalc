// server/controllers/analytics.controller.js
const pool = require('../index');

const analyticsController = {
  // Get financial overview
  getFinancialOverview: async (req, res) => {
    const { startDate, endDate, category, venue } = req.query;
    
    try {
      let query = `
        SELECT 
          SUM(f.income) AS total_income,
          SUM(f.expenses) AS total_expenses,
          SUM(f.income - f.expenses) AS net_profit,
          COUNT(DISTINCT e.event_id) AS event_count,
          COALESCE(SUM(f.income) / NULLIF(COUNT(DISTINCT e.event_id), 0), 0) AS avg_revenue
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
      `;
      
      const values = [];
      let whereClause = [];
      
      // Add date range conditions if provided
      if (startDate) {
        whereClause.push(`e.start_time >= $${values.length + 1}`);
        values.push(startDate);
      }
      
      if (endDate) {
        whereClause.push(`e.end_time <= $${values.length + 1}`);
        values.push(endDate);
      }
      
      // Add venue filter if provided
      if (venue && venue !== 'All') {
        whereClause.push(`f.venue_id = $${values.length + 1}`);
        values.push(venue);
      }
      
      // Add category filter if provided
      if (category && category !== 'All') {
        query = `
          ${query}
          JOIN event_categories ec ON e.event_id = ec.event_id
          JOIN categories c ON ec.category_id = c.category_id
        `;
        whereClause.push(`c.name = $${values.length + 1}`);
        values.push(category);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      const result = await pool.query(query, values);
      
      // If no data found, return zeros
      if (!result.rows[0].total_income) {
        return res.json({
          total_income: 0,
          total_expenses: 0,
          net_profit: 0,
          event_count: 0,
          avg_revenue: 0
        });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting financial overview:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get revenue trend
  getRevenueTrend: async (req, res) => {
    const { startDate, endDate, interval = 'month', category, venue } = req.query;
    
    try {
      let timeFormat;
      
      // Set time format based on interval
      switch(interval) {
        case 'day':
          timeFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          timeFormat = 'YYYY-"W"IW';
          break;
        case 'month':
        default:
          timeFormat = 'YYYY-MM';
          break;
        case 'quarter':
          timeFormat = 'YYYY-"Q"Q';
          break;
        case 'year':
          timeFormat = 'YYYY';
          break;
      }
      
      let query = `
        SELECT 
          TO_CHAR(e.start_time, '${timeFormat}') AS time_period,
          SUM(f.income) AS income,
          SUM(f.expenses) AS expenses,
          SUM(f.income - f.expenses) AS profit
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
      `;
      
      const values = [];
      let whereClause = [];
      
      // Add date range conditions if provided
      if (startDate) {
        whereClause.push(`e.start_time >= $${values.length + 1}`);
        values.push(startDate);
      }
      
      if (endDate) {
        whereClause.push(`e.end_time <= $${values.length + 1}`);
        values.push(endDate);
      }
      
      // Add venue filter if provided
      if (venue && venue !== 'All') {
        whereClause.push(`f.venue_id = $${values.length + 1}`);
        values.push(venue);
      }
      
      // Add category filter if provided
      if (category && category !== 'All') {
        query = `
          ${query}
          JOIN event_categories ec ON e.event_id = ec.event_id
          JOIN categories c ON ec.category_id = c.category_id
        `;
        whereClause.push(`c.name = $${values.length + 1}`);
        values.push(category);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY time_period ORDER BY time_period`;
      
      const result = await pool.query(query, values);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting revenue trend:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get breakdown by categories
  getCategoryBreakdown: async (req, res) => {
    const { startDate, endDate, venue } = req.query;
    
    try {
      let query = `
        SELECT 
          c.name AS category,
          SUM(f.income) AS income,
          SUM(f.expenses) AS expenses,
          SUM(f.income - f.expenses) AS profit,
          COUNT(DISTINCT e.event_id) AS event_count
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
        JOIN event_categories ec ON e.event_id = ec.event_id
        JOIN categories c ON ec.category_id = c.category_id
      `;
      
      const values = [];
      let whereClause = [];
      
      // Add date range conditions if provided
      if (startDate) {
        whereClause.push(`e.start_time >= $${values.length + 1}`);
        values.push(startDate);
      }
      
      if (endDate) {
        whereClause.push(`e.end_time <= $${values.length + 1}`);
        values.push(endDate);
      }
      
      // Add venue filter if provided
      if (venue && venue !== 'All') {
        whereClause.push(`f.venue_id = $${values.length + 1}`);
        values.push(venue);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY c.name ORDER BY income DESC`;
      
      const result = await pool.query(query, values);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting category breakdown:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get breakdown by venues
  getVenueBreakdown: async (req, res) => {
    const { startDate, endDate, category } = req.query;
    
    try {
      let query = `
        SELECT 
          v.name AS venue,
          SUM(f.income) AS income,
          SUM(f.expenses) AS expenses,
          SUM(f.income - f.expenses) AS profit,
          COUNT(DISTINCT e.event_id) AS event_count
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
        JOIN venues v ON f.venue_id = v.venue_id
      `;
      
      const values = [];
      let whereClause = [];
      
      // Add date range conditions if provided
      if (startDate) {
        whereClause.push(`e.start_time >= $${values.length + 1}`);
        values.push(startDate);
      }
      
      if (endDate) {
        whereClause.push(`e.end_time <= $${values.length + 1}`);
        values.push(endDate);
      }
      
      // Add category filter if provided
      if (category && category !== 'All') {
        query = `
          ${query}
          JOIN event_categories ec ON e.event_id = ec.event_id
          JOIN categories c ON ec.category_id = c.category_id
        `;
        whereClause.push(`c.name = $${values.length + 1}`);
        values.push(category);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY v.name ORDER BY income DESC`;
      
      const result = await pool.query(query, values);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting venue breakdown:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get year-over-year comparison
  getYearlyComparison: async (req, res) => {
    const { venue, category } = req.query;
    
    try {
      // Get current year and previous year
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const previousYear = currentYear - 1;
      
      let query = `
        SELECT 
          EXTRACT(YEAR FROM e.start_time) AS year,
          EXTRACT(QUARTER FROM e.start_time) AS quarter,
          SUM(f.income) AS income,
          SUM(f.expenses) AS expenses,
          SUM(f.income - f.expenses) AS profit
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
      `;
      
      const values = [];
      let whereClause = [];
      
      // Filter by years (current and previous)
      whereClause.push(`EXTRACT(YEAR FROM e.start_time) IN ($1, $2)`);
      values.push(previousYear, currentYear);
      
      // Add venue filter if provided
      if (venue && venue !== 'All') {
        whereClause.push(`f.venue_id = $${values.length + 1}`);
        values.push(venue);
      }
      
      // Add category filter if provided
      if (category && category !== 'All') {
        query = `
          ${query}
          JOIN event_categories ec ON e.event_id = ec.event_id
          JOIN categories c ON ec.category_id = c.category_id
        `;
        whereClause.push(`c.name = $${values.length + 1}`);
        values.push(category);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY year, quarter ORDER BY year, quarter`;
      
      const result = await pool.query(query, values);
      
      // Restructure data for easier comparison
      const yearlyData = {
        previousYear: {
          year: previousYear,
          quarters: Array(4).fill().map((_, i) => ({
            quarter: i + 1,
            income: 0,
            expenses: 0,
            profit: 0
          }))
        },
        currentYear: {
          year: currentYear,
          quarters: Array(4).fill().map((_, i) => ({
            quarter: i + 1,
            income: 0,
            expenses: 0,
            profit: 0
          }))
        }
      };
      
      // Fill in actual data
      result.rows.forEach(row => {
        const yearKey = parseInt(row.year) === currentYear ? 'currentYear' : 'previousYear';
        const quarterIndex = parseInt(row.quarter) - 1;
        
        if (quarterIndex >= 0 && quarterIndex < 4) {
          yearlyData[yearKey].quarters[quarterIndex] = {
            quarter: parseInt(row.quarter),
            income: parseFloat(row.income) || 0,
            expenses: parseFloat(row.expenses) || 0,
            profit: parseFloat(row.profit) || 0
          };
        }
      });
      
      res.json(yearlyData);
    } catch (error) {
      console.error('Error getting yearly comparison:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get quarterly comparison
  getQuarterlyComparison: async (req, res) => {
    const { year, venue, category } = req.query;
    
    try {
      const selectedYear = parseInt(year) || new Date().getFullYear();
      
      let query = `
        SELECT 
          EXTRACT(QUARTER FROM e.start_time) AS quarter,
          SUM(f.income) AS income,
          SUM(f.expenses) AS expenses,
          SUM(f.income - f.expenses) AS profit,
          COUNT(DISTINCT e.event_id) AS event_count
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
      `;
      
      const values = [selectedYear];
      let whereClause = [`EXTRACT(YEAR FROM e.start_time) = $1`];
      
      // Add venue filter if provided
      if (venue && venue !== 'All') {
        whereClause.push(`f.venue_id = $${values.length + 1}`);
        values.push(venue);
      }
      
      // Add category filter if provided
      if (category && category !== 'All') {
        query = `
          ${query}
          JOIN event_categories ec ON e.event_id = ec.event_id
          JOIN categories c ON ec.category_id = c.category_id
        `;
        whereClause.push(`c.name = $${values.length + 1}`);
        values.push(category);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY quarter ORDER BY quarter`;
      
      const result = await pool.query(query, values);
      
      // Create a complete quarters array (even for quarters with no data)
      const quarterlyData = Array(4).fill().map((_, i) => {
        const quarterData = result.rows.find(row => parseInt(row.quarter) === i + 1);
        return {
          quarter: i + 1,
          income: quarterData ? parseFloat(quarterData.income) || 0 : 0,
          expenses: quarterData ? parseFloat(quarterData.expenses) || 0 : 0,
          profit: quarterData ? parseFloat(quarterData.profit) || 0 : 0,
          event_count: quarterData ? parseInt(quarterData.event_count) || 0 : 0
        };
      });
      
      res.json({
        year: selectedYear,
        quarters: quarterlyData
      });
    } catch (error) {
      console.error('Error getting quarterly comparison:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get ROI analysis
  getRoiAnalysis: async (req, res) => {
    const { startDate, endDate, venue } = req.query;
    
    try {
      let query = `
        SELECT 
          c.name AS category,
          SUM(f.income) AS income,
          SUM(f.expenses) AS expenses,
          CASE 
            WHEN SUM(f.expenses) > 0 THEN (SUM(f.income) - SUM(f.expenses)) / SUM(f.expenses) * 100
            ELSE 0
          END AS roi,
          (SUM(f.income) - SUM(f.expenses)) / NULLIF(SUM(f.income), 0) * 100 AS profit_margin
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
        JOIN event_categories ec ON e.event_id = ec.event_id
        JOIN categories c ON ec.category_id = c.category_id
      `;
      
      const values = [];
      let whereClause = [];
      
      // Add date range conditions if provided
      if (startDate) {
        whereClause.push(`e.start_time >= $${values.length + 1}`);
        values.push(startDate);
      }
      
      if (endDate) {
        whereClause.push(`e.end_time <= $${values.length + 1}`);
        values.push(endDate);
      }
      
      // Add venue filter if provided
      if (venue && venue !== 'All') {
        whereClause.push(`f.venue_id = $${values.length + 1}`);
        values.push(venue);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY c.name ORDER BY roi DESC`;
      
      const result = await pool.query(query, values);
      
      // Calculate overall metrics
      let totalIncome = 0;
      let totalExpenses = 0;
      
      result.rows.forEach(row => {
        totalIncome += parseFloat(row.income) || 0;
        totalExpenses += parseFloat(row.expenses) || 0;
      });
      
      const overallRoi = totalExpenses > 0 ? 
        ((totalIncome - totalExpenses) / totalExpenses) * 100 : 0;
      
      const overallProfitMargin = totalIncome > 0 ? 
        ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
      
      res.json({
        categories: result.rows,
        overall: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          overall_roi: overallRoi,
          overall_profit_margin: overallProfitMargin
        }
      });
    } catch (error) {
      console.error('Error getting ROI analysis:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get venue growth analysis
  getVenueGrowth: async (req, res) => {
    const { category } = req.query;
    
    try {
      // Get last 5 years of data
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const startYear = currentYear - 4; // 5 years including current year
      
      let query = `
        SELECT 
          v.name AS venue,
          EXTRACT(YEAR FROM e.start_time) AS year,
          SUM(f.income) AS income
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
        JOIN venues v ON f.venue_id = v.venue_id
      `;
      
      const values = [startYear, currentYear];
      let whereClause = [`EXTRACT(YEAR FROM e.start_time) BETWEEN $1 AND $2`];
      
      // Add category filter if provided
      if (category && category !== 'All') {
        query = `
          ${query}
          JOIN event_categories ec ON e.event_id = ec.event_id
          JOIN categories c ON ec.category_id = c.category_id
        `;
        whereClause.push(`c.name = ${values.length + 1}`);
        values.push(category);
      }
      
      // Complete the query
      if (whereClause.length > 0) {
        query += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      query += ` GROUP BY v.name, year ORDER BY v.name, year`;
      
      const result = await pool.query(query, values);
      
      // Get all unique venues
      const venues = [...new Set(result.rows.map(row => row.venue))];
      
      // Create a data structure with all years for all venues
      const venueGrowthData = venues.map(venue => {
        const yearData = {};
        
        // Initialize all years with zero
        for (let year = startYear; year <= currentYear; year++) {
          yearData[year] = 0;
        }
        
        // Fill in actual data
        result.rows
          .filter(row => row.venue === venue)
          .forEach(row => {
            yearData[row.year] = parseFloat(row.income) || 0;
          });
        
        // Convert to array format
        const yearlyData = Object.keys(yearData).map(year => ({
          year: parseInt(year),
          income: yearData[year]
        }));
        
        return {
          venue,
          yearlyData
        };
      });
      
      res.json(venueGrowthData);
    } catch (error) {
      console.error('Error getting venue growth:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get income projections
  getIncomeProjections: async (req, res) => {
    const { months = 3 } = req.query;
    
    try {
      const projectMonths = parseInt(months) || 3;
      const currentDate = new Date();
      
      // Get historical monthly data for the past year
      const query = `
        SELECT 
          DATE_TRUNC('month', e.start_time) AS month,
          SUM(f.income) AS income
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
        WHERE e.start_time >= DATE_TRUNC('month', NOW() - INTERVAL '1 year')
        AND e.start_time < DATE_TRUNC('month', NOW())
        GROUP BY month
        ORDER BY month
      `;
      
      const result = await pool.query(query);
      
      // Calculate average monthly income
      let totalIncome = 0;
      result.rows.forEach(row => {
        totalIncome += parseFloat(row.income) || 0;
      });
      
      const avgMonthlyIncome = result.rows.length > 0 ? 
        totalIncome / result.rows.length : 0;
      
      // Generate projection for future months
      const projections = [];
      
      for (let i = 0; i < projectMonths; i++) {
        const projectedDate = new Date(currentDate);
        projectedDate.setMonth(currentDate.getMonth() + i);
        
        projections.push({
          month: projectedDate.toISOString().slice(0, 7), // YYYY-MM format
          projected_income: avgMonthlyIncome,
          confidence: 100 - (i * 10) // Decrease confidence for further months
        });
      }
      
      res.json({
        historical_data: result.rows,
        projections
      });
    } catch (error) {
      console.error('Error getting income projections:', error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get what-if scenario analysis
  getWhatIfAnalysis: async (req, res) => {
    const { 
      revenueGrowth = 0, 
      expenseChange = 0, 
      eventFrequency = 0, 
      taxRate = 0 
    } = req.body;
    
    try {
      // Get base metrics for the past year
      const query = `
        SELECT 
          SUM(f.income) AS total_income,
          SUM(f.expenses) AS total_expenses,
          COUNT(DISTINCT e.event_id) AS event_count
        FROM financial_data f
        JOIN events e ON f.event_id = e.event_id
        WHERE e.start_time >= NOW() - INTERVAL '1 year'
      `;
      
      const result = await pool.query(query);
      
      // Extract base values
      const baseIncome = parseFloat(result.rows[0].total_income) || 0;
      const baseExpenses = parseFloat(result.rows[0].total_expenses) || 0;
      const baseEventCount = parseInt(result.rows[0].event_count) || 0;
      
      // Calculate adjusted values based on what-if parameters
      const adjustedEventCount = baseEventCount * (1 + (parseFloat(eventFrequency) / 100));
      const avgIncomePerEvent = baseEventCount > 0 ? baseIncome / baseEventCount : 0;
      const avgExpensesPerEvent = baseEventCount > 0 ? baseExpenses / baseEventCount : 0;
      
      const adjustedIncome = (avgIncomePerEvent * adjustedEventCount) * 
        (1 + (parseFloat(revenueGrowth) / 100));
      
      const adjustedExpenses = (avgExpensesPerEvent * adjustedEventCount) * 
        (1 + (parseFloat(expenseChange) / 100));
      
      const adjustedNetProfit = adjustedIncome - adjustedExpenses;
      const taxAmount = adjustedNetProfit * (parseFloat(taxRate) / 100);
      const netProfitAfterTax = adjustedNetProfit - taxAmount;
      
      res.json({
        base: {
          total_income: baseIncome,
          total_expenses: baseExpenses,
          net_profit: baseIncome - baseExpenses,
          event_count: baseEventCount
        },
        adjusted: {
          total_income: adjustedIncome,
          total_expenses: adjustedExpenses,
          net_profit: adjustedNetProfit,
          tax_amount: taxAmount,
          net_profit_after_tax: netProfitAfterTax,
          event_count: adjustedEventCount
        },
        parameters: {
          revenueGrowth: parseFloat(revenueGrowth),
          expenseChange: parseFloat(expenseChange),
          eventFrequency: parseFloat(eventFrequency),
          taxRate: parseFloat(taxRate)
        }
      });
    } catch (error) {
      console.error('Error calculating what-if scenario:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = analyticsController;