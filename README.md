# CRM System v1.0

A comprehensive Node.js CRM application with MySQL database integration, built with Express.js and following a clean architecture pattern.

## 🚀 Features

- **User Management**: Role-based access control (Admin, Manager, Sales Rep, Support)
- **Customer Management**: Complete customer lifecycle tracking
- **Deal Management**: Sales pipeline with multiple stages
- **Task Management**: Assignable tasks with priorities and due dates
- **Activity Tracking**: Log of all customer interactions (calls, emails, meetings)
- **Product Management**: Product catalog with pricing
- **Reporting**: Built-in views and stored procedures for analytics
- **Security**: JWT authentication, password hashing, input validation

## 🏗️ Project Structure

```
crm-v1/
├── config/           # Database and configuration files
├── controllers/      # Business logic handlers
├── middlewares/      # Custom middleware functions
├── models/          # Database models and queries
├── routes/          # API route definitions
├── services/        # Business logic services
├── utils/           # Utility functions and helpers
├── validations/     # Input validation schemas (Zod)
├── server.js        # Main application entry point
├── database.sql     # Database setup script
├── env.example      # Environment variables template
└── package.json     # Project dependencies and scripts
```

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crm-v1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your database credentials
   nano .env
   ```

4. **Set up the database**
   ```bash
   # Connect to your MySQL server
   mysql -u root -p
   
   # Run the database setup script
   source database.sql
   ```

5. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_database
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Bcrypt Configuration
BCRYPT_ROUNDS=12
```

## 🗄️ Database Schema

The database includes the following main tables:

- **users**: User accounts and authentication
- **customers**: Customer information and management
- **deals**: Sales opportunities and pipeline
- **tasks**: Assignable tasks and to-dos
- **activities**: Customer interaction logs
- **products**: Product catalog
- **deal_products**: Many-to-many relationship between deals and products

### Key Features:
- Foreign key constraints for data integrity
- Proper indexing for performance
- Timestamp tracking for audit trails
- Enum fields for consistent data values
- Comprehensive sample data for testing

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Deals
- `GET /api/deals` - Get all deals
- `GET /api/deals/:id` - Get deal by ID
- `POST /api/deals` - Create new deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

## 🔧 Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests (to be implemented)

### Code Style

The project follows these architectural principles:
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Models**: Handle database operations
- **Routes**: Define API endpoints
- **Middlewares**: Handle cross-cutting concerns
- **Validations**: Input validation using Zod schemas

## 🚀 Deployment

1. **Set production environment variables**
2. **Build the application** (if using TypeScript)
3. **Start the production server**
   ```bash
   npm start
   ```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🤝 Support

For support and questions, please open an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with basic CRM functionality
  - User management
  - Customer management
  - Deal management
  - Task management
  - Activity tracking
  - Product management
