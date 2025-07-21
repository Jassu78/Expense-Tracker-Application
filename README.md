# Remote Expense Tracker

A comprehensive full-stack web application designed for remote teams to efficiently log, manage, and review expenses with advanced role-based access control and powerful visual analytics for data-driven decision-making.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Remote Expense Tracker is a modern, scalable expense management system built with cutting-edge technologies. It provides a seamless experience for both employees submitting expenses and administrators managing the approval process. The application features real-time analytics, comprehensive audit trails, and a responsive design that works across all devices.

### Why Choose This Application?

- **🔐 Secure**: JWT-based authentication with role-based access control
- **📊 Insightful**: Advanced analytics and reporting capabilities
- **🚀 Fast**: Built with React 18 and optimized for performance
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile
- **🔧 Scalable**: Microservices architecture ready for enterprise use
- **🛡️ Reliable**: Comprehensive error handling and validation

## ✨ Key Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication system
- **Role-Based Access Control (RBAC)**: 
  - **Employee Role**: Can create, view, and track their own expenses
  - **Admin Role**: Full access to all expenses, approval/rejection capabilities
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Management**: Automatic token refresh and expiration handling

### 💰 Expense Management
- **Multi-Category Support**: Travel, Food, Equipment, Office Supplies, Software, Training, Other
- **Status Tracking**: Pending → Approved/Rejected workflow
- **File Upload**: Receipt upload with support for PNG, JPG, PDF (up to 5MB)
- **Advanced Filtering**: Filter by category, status, date range, and amount
- **Real-time Updates**: Instant status updates and notifications
- **Bulk Operations**: Admin can approve/reject multiple expenses

### 📊 Analytics Dashboard
- **Interactive Charts**: Powered by Recharts library
- **Category Breakdown**: Visual representation of expenses by category
- **Monthly Trends**: Time-series analysis of expense patterns
- **Top Spenders**: Identify highest expense contributors
- **Approval Rate**: Track approval efficiency metrics
- **Financial Summary**: Total amounts, averages, and projections

### 📋 Audit Logs
- **Complete Audit Trail**: Every action is logged with timestamp and user
- **Action Tracking**: Create, update, approve, reject, and delete operations
- **User Activity**: Monitor user behavior and system usage
- **Export Capabilities**: CSV export for compliance and reporting
- **Advanced Filtering**: Filter logs by date, user, action type

### 🎨 User Interface
- **Modern Design**: Clean, professional interface using Tailwind CSS
- **Responsive Layout**: Optimized for all screen sizes
- **Dark/Light Mode**: Theme support (coming soon)
- **Accessibility**: WCAG 2.1 compliant design
- **Keyboard Navigation**: Full keyboard accessibility

### 🔧 Developer Experience
- **TypeScript**: Full type safety across the stack
- **Hot Reload**: Instant development feedback
- **ESLint & Prettier**: Consistent code formatting
- **Comprehensive Testing**: Unit and integration tests
- **Docker Support**: Containerized development and deployment

## 🛠️ Technology Stack

### Backend Architecture
```
Node.js 18+ | Express.js | PostgreSQL | Prisma ORM
├── Authentication: JWT + bcrypt
├── Validation: Zod schema validation
├── File Upload: Multer with size/type validation
├── Security: Helmet, CORS, Rate limiting
├── Testing: Jest + Supertest
└── Documentation: JSDoc + OpenAPI
```

### Frontend Architecture
```
React 18 | TypeScript | Vite | Tailwind CSS
├── State Management: React Context API
├── Routing: React Router v6
├── Forms: React Hook Form + Zod
├── Charts: Recharts (D3-based)
├── Icons: Heroicons
└── Testing: Vitest + React Testing Library
```

### DevOps & Deployment
```
Docker | Docker Compose | Environment Management
├── Database: PostgreSQL 15
├── Reverse Proxy: Nginx (production)
├── Monitoring: Health checks + logging
├── CI/CD: GitHub Actions ready
└── Deployment: Render, Railway, Vercel compatible
```

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **PostgreSQL**: Version 14.0 or higher
- **Git**: Version 2.0.0 or higher

### Optional Requirements
- **Docker**: Version 20.10 or higher (for containerized setup)
- **Docker Compose**: Version 2.0 or higher

### Development Tools
- **VS Code**: Recommended IDE with extensions
- **Postman**: API testing tool
- **pgAdmin**: Database management (optional)

## 🚀 Installation & Setup

### Option 1: Docker Setup (Recommended for Production)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/remote-expense-tracker.git
cd remote-expense-tracker

# 2. Create environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Start all services
docker-compose up -d

# 4. Initialize database (first time only)
docker-compose exec backend npm run db:setup

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5001
# Database: localhost:5432
```

### Option 2: Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/remote-expense-tracker.git
cd remote-expense-tracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Configure environment files
# Backend (.env):
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=5001
NODE_ENV=development

# Frontend (.env):
VITE_API_URL="http://localhost:5001/api"

# 5. Set up PostgreSQL database
# Create database: expense_tracker
# Create user with appropriate permissions

# 6. Initialize database
cd backend
npm run db:setup
npm run db:seed

# 7. Start development servers
cd ..
npm run dev

# 8. Access the application
# Frontend: http://localhost:3000 (or next available port)
# Backend: http://localhost:5001
```

### Environment Variables Reference

#### Backend Environment Variables
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5001
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH="./uploads"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment Variables
```env
# API Configuration
VITE_API_URL="http://localhost:5001/api"

# Build Configuration
VITE_APP_TITLE="Remote Expense Tracker"
VITE_APP_VERSION="1.0.0"
```

## 📖 Usage Guide

### Getting Started

1. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - You'll see the login page

2. **Default User Accounts**
   ```
   Employee Account:
   - Email: employee@example.com
   - Password: password123
   
   Admin Account:
   - Email: admin@example.com
   - Password: password123
   ```

### Employee Workflow

1. **Login**: Use the employee credentials
2. **Dashboard**: View expense summary and quick actions
3. **Create Expense**:
   - Click "New Expense" button
   - Fill out the form with amount, category, date, notes
   - Upload receipt (optional)
   - Submit for approval
4. **Track Expenses**: Monitor status of submitted expenses
5. **View History**: Access all your expense records

### Admin Workflow

1. **Login**: Use the admin credentials
2. **Dashboard**: View comprehensive analytics and statistics
3. **Review Pending Expenses**:
   - Navigate to Expenses page
   - Filter by "Pending" status
   - Review expense details and receipts
   - Approve or reject with comments
4. **Analytics**: Explore expense trends and patterns
5. **Audit Logs**: Monitor system activity and user actions

### Key Features Usage

#### Expense Creation
```typescript
// Example expense submission
const expenseData = {
  amount: 150.50,
  category: "TRAVEL",
  date: "2024-01-15",
  notes: "Uber rides for client meetings",
  receipt: File // Optional receipt upload
}
```

#### Expense Filtering
```typescript
// Filter parameters
const filters = {
  category: "TRAVEL",
  status: "PENDING",
  startDate: "2024-01-01",
  endDate: "2024-01-31"
}
```

#### Analytics Queries
```typescript
// Analytics endpoint usage
GET /api/analytics/summary?days=30
Response: {
  summary: { totalExpenses, pendingExpenses, ... },
  categoryBreakdown: [...],
  monthlyTrends: [...],
  topSpenders: [...]
}
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "EMPLOYEE"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/logout
Logout current user (client-side token removal).

#### GET /api/auth/me
Get current user information.

### Expense Endpoints

#### GET /api/expenses
Get expenses with filtering and pagination.

**Query Parameters:**
- `category`: Filter by expense category
- `status`: Filter by expense status
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "expenses": [
    {
      "id": "expense_id",
      "amount": 150.50,
      "category": "TRAVEL",
      "date": "2024-01-15T00:00:00Z",
      "notes": "Uber rides",
      "status": "PENDING",
      "receiptUrl": "/uploads/receipt.jpg",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### POST /api/expenses
Create a new expense.

**Request (FormData):**
```
amount: 150.50
category: TRAVEL
date: 2024-01-15T00:00:00Z
notes: Uber rides for client meetings
receipt: [File] (optional)
```

**Response:**
```json
{
  "message": "Expense created successfully",
  "expense": {
    "id": "new_expense_id",
    "amount": 150.50,
    "category": "TRAVEL",
    "status": "PENDING",
    // ... other fields
  }
}
```

#### PUT /api/expenses/:id/status
Update expense status (Admin only).

**Request:**
```json
{
  "status": "APPROVED"
}
```

### Analytics Endpoints

#### GET /api/analytics/summary
Get comprehensive analytics data.

**Query Parameters:**
- `days`: Number of days to analyze (default: 30)

**Response:**
```json
{
  "summary": {
    "totalExpenses": 25,
    "pendingExpenses": 5,
    "approvedExpenses": 18,
    "rejectedExpenses": 2,
    "totalAmount": 3250.75,
    "averageAmount": 130.03,
    "approvalRate": 0.72
  },
  "categoryBreakdown": [
    {
      "category": "TRAVEL",
      "totalAmount": 1200.50,
      "count": 8
    }
  ],
  "monthlyTrends": [
    {
      "month": "January 2024",
      "total": 1500.25,
      "count": 12,
      "categories": {
        "TRAVEL": 800.50,
        "FOOD": 699.75
      }
    }
  ],
  "topSpenders": [
    {
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "totalAmount": 850.25,
      "expenseCount": 6
    }
  ]
}
```

### Audit Logs Endpoints

#### GET /api/logs
Get audit logs with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `action`: Filter by action type
- `userId`: Filter by user ID
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
{
  "logs": [
    {
      "id": "log_id",
      "action": "EXPENSE_CREATED",
      "description": "Expense created - $150.50 for TRAVEL",
      "timestamp": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## 📁 Project Structure

```
remote-expense-tracker/
├── 📁 backend/                          # Express.js API server
│   ├── 📁 src/
│   │   ├── 📁 controllers/              # Route handlers
│   │   ├── 📁 middleware/               # Auth, validation, error handling
│   │   │   ├── auth.js                  # JWT authentication
│   │   │   ├── validation.js            # Zod schema validation
│   │   │   └── errorHandler.js          # Global error handling
│   │   ├── 📁 routes/                   # API route definitions
│   │   │   ├── auth.js                  # Authentication routes
│   │   │   ├── expenses.js              # Expense management routes
│   │   │   ├── analytics.js             # Analytics and reporting routes
│   │   │   └── audit.js                 # Audit log routes
│   │   ├── 📁 services/                 # Business logic layer
│   │   ├── 📁 utils/                    # Helper functions
│   │   └── server.js                    # Express app entry point
│   ├── 📁 prisma/                       # Database schema and migrations
│   │   ├── schema.prisma                # Database schema definition
│   │   ├── 📁 migrations/               # Database migration files
│   │   └── seed.js                      # Database seeding script
│   ├── 📁 tests/                        # Backend test suite
│   ├── 📁 uploads/                      # File upload storage
│   ├── package.json                     # Backend dependencies
│   └── .env.example                     # Environment variables template
├── 📁 frontend/                         # React application
│   ├── 📁 src/
│   │   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 contexts/                 # React context providers
│   │   │   └── AuthContext.tsx          # Authentication context
│   │   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── 📁 pages/                    # Page components
│   │   │   ├── Dashboard.tsx            # Main dashboard
│   │   │   ├── Login.tsx                # Authentication page
│   │   │   ├── Expenses.tsx             # Expense management
│   │   │   ├── Analytics.tsx            # Analytics dashboard
│   │   │   └── AuditLogs.tsx            # Audit logs page
│   │   ├── 📁 services/                 # API service functions
│   │   ├── 📁 types/                    # TypeScript type definitions
│   │   ├── 📁 utils/                    # Frontend utility functions
│   │   ├── App.tsx                      # Main app component
│   │   ├── index.tsx                    # React entry point
│   │   └── index.css                    # Global styles
│   ├── 📁 public/                       # Static assets
│   ├── package.json                     # Frontend dependencies
│   ├── vite.config.ts                   # Vite configuration
│   └── .env.example                     # Frontend environment template
├── 📁 docs/                             # Documentation
├── docker-compose.yml                   # Docker orchestration
├── Dockerfile.backend                   # Backend Docker image
├── Dockerfile.frontend                  # Frontend Docker image
├── package.json                         # Root package.json
└── README.md                           # This file
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

```
📁 tests/
├── 📁 backend/
│   ├── 📁 unit/                         # Unit tests
│   ├── 📁 integration/                  # Integration tests
│   └── 📁 e2e/                         # End-to-end tests
└── 📁 frontend/
    ├── 📁 components/                   # Component tests
    ├── 📁 pages/                        # Page tests
    └── 📁 hooks/                        # Hook tests
```

### Test Coverage

- **Backend**: 85%+ coverage target
- **Frontend**: 80%+ coverage target
- **Critical Paths**: 100% coverage required

## 🚀 Deployment

### Production Deployment Options

#### Option 1: Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Option 2: Platform Deployment

**Render Deployment:**
1. Connect GitHub repository
2. Create new Web Service
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Add environment variables

**Railway Deployment:**
1. Connect GitHub repository
2. Add PostgreSQL service
3. Configure environment variables
4. Deploy automatically

**Vercel Deployment:**
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy frontend

### Environment Configuration

#### Production Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Security
JWT_SECRET="your-super-secret-production-jwt-key"
NODE_ENV="production"

# File Storage
UPLOAD_PATH="/app/uploads"
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN="https://your-domain.com"
```

#### SSL/HTTPS Configuration

```nginx
# Nginx configuration example
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring & Logging

#### Health Checks
```bash
# Backend health check
curl http://localhost:5001/health

# Expected response
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production"
}
```

#### Log Monitoring
```bash
# View application logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f frontend
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```
7. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request**

### Code Style Guidelines

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **Commit Messages**: Conventional commits format
- **Documentation**: JSDoc for functions and classes

### Testing Requirements

- **New Features**: Must include unit tests
- **Bug Fixes**: Must include regression tests
- **API Changes**: Must include integration tests
- **UI Changes**: Must include component tests

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console errors
- [ ] Accessibility requirements met
- [ ] Security considerations addressed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the maintainers for enterprise support

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection
psql -h localhost -U username -d expense_tracker
```

#### Port Conflicts
```bash
# Check what's using a port
lsof -i :3000
lsof -i :5001

# Kill process using port
kill -9 <PID>
```

#### Docker Issues
```bash
# Clean up Docker resources
docker system prune -a

# Rebuild containers
docker-compose down
docker-compose up --build
```

## 🙏 Acknowledgments

- **React Team**: For the amazing React framework
- **Vite Team**: For the fast build tool
- **Tailwind CSS**: For the utility-first CSS framework
- **Prisma Team**: For the excellent ORM
- **Recharts Team**: For the beautiful charting library

---

**For remote teams everywhere** 
