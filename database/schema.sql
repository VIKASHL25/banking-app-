
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, -- Store as plain text as requested
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(12, 2) DEFAULT 1000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, -- Store as plain text as requested
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan types table
CREATE TABLE loan_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    max_amount DECIMAL(12, 2) NOT NULL,
    min_duration INT NOT NULL, -- in months
    max_duration INT NOT NULL, -- in months
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    loan_type_id INT REFERENCES loan_types(id),
    principal_amount DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    duration_months INT NOT NULL,
    monthly_payment DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
    approved_by INT REFERENCES staff(id),
    approved_at TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- deposit, withdrawal, transfer, loan_disbursement, loan_payment
    description TEXT,
    reference_id INT, -- could be loan_id or other transaction id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default loan types
INSERT INTO loan_types (name, interest_rate, max_amount, min_duration, max_duration)
VALUES 
    ('Personal', 12.5, 500000, 6, 60),
    ('Home', 8.75, 10000000, 60, 360),
    ('Education', 7.25, 2000000, 12, 120),
    ('Vehicle', 9.5, 1500000, 12, 84),
    ('Business', 14.0, 5000000, 12, 60);

-- Insert default staff
INSERT INTO staff (email, password, name, role)
VALUES 
    ('admin@svbank.com', 'admin123', 'Admin User', 'Administrator'),
    ('manager@svbank.com', 'manager123', 'Manager User', 'Branch Manager'),
    ('loan@svbank.com', 'loan123', 'Loan Officer', 'Loan Officer');

-- Insert demo users
INSERT INTO users (username, password, name, balance)
VALUES 
    ('johndoe', 'pass123', 'John Doe', 25000.50),
    ('janedoe', 'pass123', 'Jane Doe', 15750.75),
    ('samsmith', 'pass123', 'Sam Smith', 8500.25);
