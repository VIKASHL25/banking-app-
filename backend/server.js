
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'svbank-jwt-secret';

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'svbank',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    // Check if username exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Insert user with plain text password as requested
    const newUser = await pool.query(
      'INSERT INTO users (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, name',
      [username, password, name]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = userResult.rows[0];
    
    // Compare plain text passwords as requested
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, isStaff: false },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Staff login (using email and password)
app.post('/api/staff/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find staff
    const staffResult = await pool.query(
      'SELECT * FROM staff WHERE email = $1',
      [email]
    );
    
    if (staffResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const staff = staffResult.rows[0];
    
    // Compare plain text passwords as requested
    if (password !== staff.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: staff.id, email: staff.email, role: staff.role, isStaff: true },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Staff login successful',
      token,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: 'Server error during staff login' });
  }
});

// Get current user
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    if (req.user.isStaff) {
      // Get staff information
      const staffResult = await pool.query(
        'SELECT id, email, name, role FROM staff WHERE id = $1',
        [req.user.id]
      );
      
      if (staffResult.rows.length === 0) {
        return res.status(404).json({ error: 'Staff not found' });
      }
      
      res.json({ staff: staffResult.rows[0], isStaff: true });
    } else {
      // Get user information
      const userResult = await pool.query(
        'SELECT id, username, name, balance FROM users WHERE id = $1',
        [req.user.id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ user: userResult.rows[0], isStaff: false });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error while getting user information' });
  }
});

// Get pending loans (staff only)
app.get('/api/staff/loans/pending', authenticateToken, async (req, res) => {
  try {
    // Check if staff
    if (!req.user.isStaff) {
      return res.status(403).json({ error: 'Access denied. Staff only.' });
    }
    
    // Get pending loans
    const loansResult = await pool.query(`
      SELECT l.id, l.principal_amount, l.interest_rate, l.due_date, l.created_at,
             u.id as user_id, u.name as user_name,
             lt.name as loan_type
      FROM loans l
      JOIN users u ON l.user_id = u.id
      JOIN loan_types lt ON l.loan_type_id = lt.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at DESC
    `);
    
    const pendingLoans = loansResult.rows.map(loan => ({
      id: loan.id,
      userId: loan.user_id,
      userName: loan.user_name,
      loanType: loan.loan_type,
      principalAmount: loan.principal_amount,
      interestRate: loan.interest_rate,
      dueDate: loan.due_date,
      createdAt: loan.created_at
    }));
    
    res.json({ pendingLoans });
  } catch (error) {
    console.error('Get pending loans error:', error);
    res.status(500).json({ error: 'Server error while getting pending loans' });
  }
});

// Process loan (approve or reject) - staff only
app.post('/api/staff/loans/:id/process', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    // Check if staff
    if (!req.user.isStaff) {
      return res.status(403).json({ error: 'Access denied. Staff only.' });
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Invalid action. Must be approve or reject.' });
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update loan status
      await client.query(
        `UPDATE loans SET 
         status = $1, 
         approved_by = $2, 
         approved_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [action === 'approve' ? 'approved' : 'rejected', req.user.id, id]
      );
      
      // If approved, add loan amount to user's balance
      if (action === 'approve') {
        // Get loan details
        const loanResult = await client.query(
          'SELECT user_id, principal_amount FROM loans WHERE id = $1',
          [id]
        );
        
        if (loanResult.rows.length === 0) {
          throw new Error('Loan not found');
        }
        
        const { user_id, principal_amount } = loanResult.rows[0];
        
        // Add loan amount to user's balance
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [principal_amount, user_id]
        );
        
        // Record transaction
        await client.query(
          `INSERT INTO transactions 
           (user_id, amount, transaction_type, description, reference_id) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            user_id, 
            principal_amount, 
            'loan_disbursement',
            'Loan approved and disbursed',
            id
          ]
        );
      }
      
      await client.query('COMMIT');
      
      // Get updated pending loans
      const loansResult = await pool.query(`
        SELECT l.id, l.principal_amount, l.interest_rate, l.due_date, l.created_at,
               u.id as user_id, u.name as user_name,
               lt.name as loan_type
        FROM loans l
        JOIN users u ON l.user_id = u.id
        JOIN loan_types lt ON l.loan_type_id = lt.id
        WHERE l.status = 'pending'
        ORDER BY l.created_at DESC
      `);
      
      const pendingLoans = loansResult.rows.map(loan => ({
        id: loan.id,
        userId: loan.user_id,
        userName: loan.user_name,
        loanType: loan.loan_type,
        principalAmount: loan.principal_amount,
        interestRate: loan.interest_rate,
        dueDate: loan.due_date,
        createdAt: loan.created_at
      }));
      
      res.json({ 
        message: `Loan ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 
        pendingLoans 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Process loan error:`, error);
    res.status(500).json({ error: `Server error while processing loan` });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
