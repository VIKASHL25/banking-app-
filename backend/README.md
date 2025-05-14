
# Banking App Backend

This is a Node.js/Express based RESTful API for the Banking Application.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Create a MySQL database:
   ```
   # Import the schema.sql file into your MySQL server
   mysql -u root -p < ../database/schema.sql
   ```

3. Configure environment variables:
   - Rename `.env.example` to `.env`
   - Update the values in `.env` with your database credentials

4. Start the server:
   ```
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login and get authentication token

### Banking Operations
- `GET /api/profile` - Get user profile and account details
- `POST /api/transaction` - Process a deposit or withdrawal
- `GET /api/transactions` - Get transaction history

## Database Schema

The application uses three main tables:
1. `users` - Stores user authentication and personal details
2. `accounts` - Stores bank account information
3. `transactions` - Stores all financial transactions

For more details, see the `schema.sql` file.
