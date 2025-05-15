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

// Staff authentication middleware
const authenticateStaff = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Authentication required" });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, staff) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    
    if (!staff.isStaff) {
      return res.status(403).json({ error: "Staff access required" });
    }
    
    req.staff = staff;
    next();
  });
};

// Routes
// Registering a new users
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

// Login authentication for regular users
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
      { id: user.id, username: user.username, name: user.name, isStaff: false },
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

// Staff login
app.post('/api/staff/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const connection = await pool.getConnection();
    const [staffMembers] = await connection.query('SELECT * FROM staff WHERE username = ?', [username]);
    
    if (staffMembers.length === 0) {
      connection.release();
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const staff = staffMembers[0];
    const match = await bcrypt.compare(password, staff.password);
    
    if (!match) {
      connection.release();
      return res.status(401).json({ error: "Invalid username or password" });
    }
    
    const token = jwt.sign(
      { id: staff.id, username: staff.username, name: staff.name, email: staff.email, role: staff.role, isStaff: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    connection.release();
    
    res.json({
      token,
      staff: {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: "Server error during staff login" });
  }
});

// User profile
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
    
    // Get user's loans
    const [loans] = await connection.query(
      'SELECT l.*, s.name as approved_by_name FROM loans l LEFT JOIN staff s ON l.approved_by = s.id WHERE l.user_id = ? ORDER BY l.created_at DESC',
      [userId]
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
      })),
      loans: loans.map(loan => ({
        id: loan.id,
        loanType: loan.loan_type,
        principalAmount: parseFloat(loan.principal_amount),
        interestRate: parseFloat(loan.interest_rate),
        startDate: loan.start_date, 
        dueDate: loan.due_date,
        status: loan.status,
        approvedBy: loan.approved_by_name,
        createdAt: loan.created_at
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

// Apply for a loan
app.post('/api/loans/apply', authenticateToken, async (req, res) => {
  try {
    const { loanType, principalAmount, interestRate, dueDate } = req.body;
    const userId = req.user.id;
    
    // Validate inputs
    if (!loanType || !principalAmount || !interestRate || !dueDate) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Additional validations
    const numPrincipal = parseFloat(principalAmount);
    const numInterest = parseFloat(interestRate);
    
    if (isNaN(numPrincipal) || numPrincipal <= 0) {
      return res.status(400).json({ error: "Invalid principal amount" });
    }
    
    if (isNaN(numInterest) || numInterest <= 0 || numInterest > 100) {
      return res.status(400).json({ error: "Invalid interest rate" });
    }
    
    const connection = await pool.getConnection();
    
    // Insert loan application
    await connection.query(
      'INSERT INTO loans (user_id, loan_type, principal_amount, interest_rate, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, loanType, numPrincipal, numInterest, dueDate, 'pending']
    );
    
    // Get updated loans
    const [loans] = await connection.query(
      'SELECT l.*, s.name as approved_by_name FROM loans l LEFT JOIN staff s ON l.approved_by = s.id WHERE l.user_id = ? ORDER BY l.created_at DESC',
      [userId]
    );
    
    connection.release();
    
    res.status(201).json({
      message: "Loan application submitted successfully",
      loans: loans.map(loan => ({
        id: loan.id,
        loanType: loan.loan_type,
        principalAmount: parseFloat(loan.principal_amount),
        interestRate: parseFloat(loan.interest_rate),
        startDate: loan.start_date,
        dueDate: loan.due_date,
        status: loan.status,
        approvedBy: loan.approved_by_name,
        createdAt: loan.created_at
      }))
    });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: "Server error processing loan application" });
  }
});

// Staff: Get all pending loans
app.get('/api/staff/loans/pending', authenticateStaff, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [loans] = await connection.query(
      'SELECT l.*, u.name as user_name FROM loans l JOIN users u ON l.user_id = u.id WHERE l.status = "pending" ORDER BY l.created_at ASC'
    );
    
    connection.release();
    
    res.json({
      pendingLoans: loans.map(loan => ({
        id: loan.id,
        userName: loan.user_name,
        userId: loan.user_id,
        loanType: loan.loan_type,
        principalAmount: parseFloat(loan.principal_amount),
        interestRate: parseFloat(loan.interest_rate),
        dueDate: loan.due_date,
        createdAt: loan.created_at
      }))
    });
  } catch (error) {
    console.error('Pending loans fetch error:', error);
    res.status(500).json({ error: "Server error fetching pending loans" });
  }
});

// Staff: Approve or reject a loan
app.post('/api/staff/loans/:loanId/process', authenticateStaff, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { action } = req.body;
    const staffId = req.staff.id;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get the loan details
      const [loans] = await connection.query(
        'SELECT * FROM loans WHERE id = ?',
        [loanId]
      );
      
      if (loans.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "Loan not found" });
      }
      
      const loan = loans[0];
      
      if (loan.status !== 'pending') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: "This loan application has already been processed" });
      }
      
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const startDate = action === 'approve' ? new Date().toISOString().split('T')[0] : null;
      
      // Update loan status
      await connection.query(
        'UPDATE loans SET status = ?, approved_by = ?, start_date = ? WHERE id = ?',
        [newStatus, staffId, startDate, loanId]
      );
      
      // If approved, credit the loan amount to the user's account
      if (action === 'approve') {
        // Get user's account
        const [accounts] = await connection.query(
          'SELECT * FROM accounts WHERE user_id = ?',
          [loan.user_id]
        );
        
        if (accounts.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ error: "User account not found" });
        }
        
        const account = accounts[0];
        const newBalance = parseFloat(account.balance) + parseFloat(loan.principal_amount);
        
        // Update account balance
        await connection.query(
          'UPDATE accounts SET balance = ? WHERE id = ?',
          [newBalance, account.id]
        );
        
        // Record the transaction
        await connection.query(
          'INSERT INTO transactions (account_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
          [account.id, 'deposit', loan.principal_amount, newBalance]
        );
      }
      
      await connection.commit();
      
      // Get updated list of pending loans
      const [pendingLoans] = await connection.query(
        'SELECT l.*, u.name as user_name FROM loans l JOIN users u ON l.user_id = u.id WHERE l.status = "pending" ORDER BY l.created_at ASC'
      );
      
      connection.release();
      
      res.json({
        message: action === 'approve' ? "Loan approved successfully" : "Loan rejected",
        pendingLoans: pendingLoans.map(loan => ({
          id: loan.id,
          userName: loan.user_name,
          userId: loan.user_id,
          loanType: loan.loan_type,
          principalAmount: parseFloat(loan.principal_amount),
          interestRate: parseFloat(loan.interest_rate),
          dueDate: loan.due_date,
          createdAt: loan.created_at
        }))
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Loan processing error:', error);
    res.status(500).json({ error: "Server error processing loan" });
  }
});

// Transfer money between accounts
app.post('/api/transfer', authenticateToken, async (req, res) => {
  try {
    const { recipientAccountNumber, amount } = req.body;
    const userId = req.user.id;
    
    // Validate input
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    
    if (!recipientAccountNumber) {
      return res.status(400).json({ error: "Recipient account number is required" });
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get sender's account
      const [senderAccounts] = await connection.query(
        'SELECT * FROM accounts WHERE user_id = ?',
        [userId]
      );
      
      if (senderAccounts.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "Sender account not found" });
      }
      
      const senderAccount = senderAccounts[0];
      
      // Check if sender has enough balance
      if (parseFloat(senderAccount.balance) < numAmount) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: "Insufficient funds" });
      }
      
      // Get recipient's account
      const [recipientAccounts] = await connection.query(
        'SELECT * FROM accounts WHERE account_number = ?',
        [recipientAccountNumber]
      );
      
      if (recipientAccounts.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "Recipient account not found" });
      }
      
      const recipientAccount = recipientAccounts[0];
      
      // Check if sender is not transferring to the same account
      if (senderAccount.id === recipientAccount.id) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: "Cannot transfer to your own account" });
      }
      
      // Update sender's balance
      const newSenderBalance = parseFloat(senderAccount.balance) - numAmount;
      await connection.query(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [newSenderBalance, senderAccount.id]
      );
      
      // Record sender's transaction
      await connection.query(
        'INSERT INTO transactions (account_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
        [senderAccount.id, 'withdraw', numAmount, newSenderBalance]
      );
      
      // Update recipient's balance
      const newRecipientBalance = parseFloat(recipientAccount.balance) + numAmount;
      await connection.query(
        'UPDATE accounts SET balance = ? WHERE id = ?',
        [newRecipientBalance, recipientAccount.id]
      );
      
      // Record recipient's transaction
      await connection.query(
        'INSERT INTO transactions (account_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
        [recipientAccount.id, 'deposit', numAmount, newRecipientBalance]
      );
      
      await connection.commit();
      
      // Get updated transactions
      const [transactions] = await connection.query(
        'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT 10',
        [senderAccount.id]
      );
      
      connection.release();
      
      res.json({
        success: true,
        message: "Transfer successful",
        balance: newSenderBalance,
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
    console.error('Transfer error:', error);
    res.status(500).json({ error: "Server error processing transfer" });
  }
});

// server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
