
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Authentication required" });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// Routes
// Registeing a new users
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    // Validating the inputs
    if (!username || !password || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Checking if username already exists
    const connection = await pool.getConnection();
    const [existingUsers] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Inserting new user
    const [result] = await connection.query(
      'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
      [username, hashedPassword, name]
    );
    
    const userId = result.insertId;
    
    //account number random
    const accountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    //inserting into accounts table
    await connection.query(
      'INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES (?, ?, ?, ?)',
      [userId, accountNumber, 'Savings', 100.00]
    );
    
    connection.release();
    
    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login authentication
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      connection.release();
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    connection.release();
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    const [accounts] = await connection.query(
      'SELECT * FROM accounts WHERE user_id = ?',
      [userId]
    );
    
    if (accounts.length === 0) {
      connection.release();
      return res.status(404).json({ error: "No accounts found for this user" });
    }
    
    
    const account = accounts[0];
    
    // reteriving transactions query
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 10',
      [account.id]
    );
    
    connection.release();
    
    res.json({
      name: req.user.name,
      accountNumber: account.account_number,
      accountType: account.account_type,
      balance: parseFloat(account.balance),
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceAfter: parseFloat(t.balance_after),
        date: t.created_at
      }))
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: "Server error fetching profile data" });
  }
});

// Process a transaction (deposit or withdraw)
app.post('/api/transaction', authenticateToken, async (req, res) => {
  try {
    const { type, amount } = req.body;
    const userId = req.user.id;
    
    // Validating the transaction
    if (!['deposit', 'withdraw'].includes(type)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const [accounts] = await connection.query(
        'SELECT * FROM accounts WHERE user_id = ?',
        [userId]
      );
      
      if (accounts.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "No account found" });
      }
      
      const account = accounts[0];
      
      // Checking the witdraw is possible 
      if (type === 'withdraw' && numAmount > account.balance) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: "Insufficient funds" });
      }
      
      //  new balance
      const newBalance = type === 'deposit'
        ? parseFloat(account.balance) + numAmount
        : parseFloat(account.balance) - numAmount;
      
      // Updating  balance
      await connection.query(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [newBalance, account.id]
      );
      
      // Recording the  transaction
      await connection.query(
        'INSERT INTO transactions (account_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
        [account.id, type, numAmount, newBalance]
      );
      
      await connection.commit();
      
      // Get updated transactions
      const [transactions] = await connection.query(
        'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 10',
        [account.id]
      );
      
      connection.release();
      
      res.json({
        success: true,
        balance: newBalance,
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          balanceAfter: parseFloat(t.balance_after),
          date: t.created_at
        }))
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: "Server error processing transaction" });
  }
});

// Get transaction history
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const connection = await pool.getConnection();
    
    // Get the account
    const [accounts] = await connection.query(
      'SELECT * FROM accounts WHERE user_id = ?',
      [userId]
    );
    
    if (accounts.length === 0) {
      connection.release();
      return res.status(404).json({ error: "No account found" });
    }
    
    const accountId = accounts[0].id;
    
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;
    
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [accountId, limit, offset]
    );
    
    // Count total transactions
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM transactions WHERE account_id = ?',
      [accountId]
    );
    
    connection.release();
    
    res.json({
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceAfter: parseFloat(t.balance_after),
        date: t.created_at
      })),
      totalCount: countResult[0].total,
      page,
      limit
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: "Server error fetching transactions" });
  }
});

// server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
