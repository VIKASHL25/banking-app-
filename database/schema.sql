
-- Drop database if exists and create a new one
DROP DATABASE IF EXISTS banking_app;
CREATE DATABASE banking_app;
USE banking_app;

-- Create Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Accounts table
CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    type ENUM('deposit', 'withdraw') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Insert some sample data
INSERT INTO users (username, password, name) VALUES
('john_doe', '$2b$10$XurIAkDjoiFnL6iYXS1XOeT8UgZG9RxKZV6m7AJPk0A9Maol9B9va', 'John Doe');
-- Note: password is 'password123' hashed with bcrypt

-- Create an account for the sample user
INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES
(1, '1000000001', 'Savings', 1000.00);

-- Add some sample transactions
INSERT INTO transactions (account_id, type, amount, balance_after) VALUES
(1, 'deposit', 1000.00, 1000.00);
