// server/db/models/User.js
const { pool } = require('../../index');
const bcrypt = require('bcrypt');

const userModel = {
  async create(userData) {
    const { email, password, firstName, lastName, role = 'user' } = userData;
   
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
   
    const query = `
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at
    `;
   
    const values = [email, hashedPassword, firstName, lastName, role];
    const result = await pool.query(query, values);
   
    return result.rows[0];
  },
 
  async findByEmail(email) {
    const query = `
      SELECT * FROM users
      WHERE email = $1
    `;
   
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },
 
  async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
   
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },
 
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
  
  async ensureAdminExists() {
    try {
      // Check if admin user already exists
      const adminEmail = 'admin@calcalc.com';
      const existingAdmin = await this.findByEmail(adminEmail);
     
      if (existingAdmin) {
        console.log('Admin user already exists');
        return existingAdmin;
      }
     
      // Admin doesn't exist, create one
      const adminData = {
        email: adminEmail,
        password: 'admin',  // Simple password for development only!
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      };
     
      const admin = await this.create(adminData);
      console.log('Admin user created successfully');
      return admin;
    } catch (error) {
      console.error('Error ensuring admin exists:', error);
      throw error;
    }
  }
};

module.exports = userModel;