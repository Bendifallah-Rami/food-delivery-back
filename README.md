# Food Delivery Backend

A REST API backend for a food delivery application built with Express.js and PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database named `food_delivery`
2. Update the `.env` file with your database credentials
3. Run the database schema:

```bash
psql -U your_username -d food_delivery -f database/schema.sql
```

4. (Optional) Insert sample data:

```bash
psql -U your_username -d food_delivery -f database/seed.sql
```

### 3. Environment Configuration

Update the `.env` file with your actual values:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=food_delivery
DB_USER=your_actual_username
DB_PASSWORD=your_actual_password
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

### 4. Start the Server

For development (with auto-restart):
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check

## Database Schema

The application includes the following tables:
- `users` - User accounts (customers, restaurant owners, admins)
- `restaurants` - Restaurant information
- `categories` - Food categories
- `menu_items` - Restaurant menu items
- `orders` - Customer orders
- `order_items` - Individual items in orders

## Next Steps

1. Set up authentication middleware
2. Create API routes for:
   - User registration/login
   - Restaurant management
   - Menu management
   - Order processing
3. Add input validation
4. Implement proper error handling
5. Add unit tests
