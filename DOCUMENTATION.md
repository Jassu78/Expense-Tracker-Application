# Remote Expense Tracker - Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [API Documentation](#api-documentation)
5. [Frontend Components](#frontend-components)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Security Features](#security-features)
10. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Remote Expense Tracker is a full-stack web application designed for remote teams to manage expenses with role-based access control. The application features:

- **Authentication & Authorization**: JWT-based auth with role-based access
- **Expense Management**: Create, view, and track expenses with status updates
- **Analytics Dashboard**: Visual insights with charts and statistics
- **Audit Logging**: Complete audit trail of all actions
- **File Upload**: Receipt upload functionality
- **CSV Export**: Data export capabilities

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js with Express
- PostgreSQL with Prisma ORM
- JWT authentication
- Zod validation
- Multer for file uploads

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- React Router for navigation
- React Hook Form for forms
- Recharts for data visualization
- Tailwind CSS for styling

**DevOps:**
- Docker with docker-compose
- Jest for testing
- ESLint for code quality

### Project Structure

```
remote-expense-tracker/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, validation middleware
│   │   ├── models/          # Prisma schema
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   ├── prisma/              # Database schema and migrations
│   └── tests/               # Backend tests
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
├── docker-compose.yml       # Docker orchestration
└── README.md               # Project overview
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker (optional, for containerized setup)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd remote-expense-tracker
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

3. **Start the application**
   ```bash
   # Option 1: Docker (recommended)
   docker-compose up -d
   
   # Option 2: Local development
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Default Users

- **Admin**: admin@example.com / password123
- **Employee**: employee@example.com / password123

## 📊 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.

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
  "token": "jwt_token"
}
```

#### POST /api/auth/logout
Logout the current user.

#### GET /api/auth/me
Get current user information.

### Expense Endpoints

#### GET /api/expenses
Get expenses with filtering and pagination.

**Query Parameters:**
- `category`: Filter by expense category
- `status`: Filter by expense status
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

#### POST /api/expenses
Create a new expense.

**Request:**
```json
{
  "amount": 150.50,
  "category": "TRAVEL",
  "date": "2024-01-15T00:00:00Z",
  "notes": "Uber rides for client meetings"
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

#### GET /api/analytics/categories
Get category-wise expense data for charts.

#### GET /api/analytics/trends
Get monthly expense trends.

#### GET /api/analytics/summary
Get expense summary statistics.

### Audit Logs

#### GET /api/logs
Get audit logs with pagination.

#### GET /api/logs/export
Export audit logs as CSV.

## 🎨 Frontend Components

### Core Components

- **Layout**: Main application layout with navigation
- **ProtectedRoute**: Route protection based on authentication
- **LoginForm**: User authentication form
- **ExpenseForm**: Create and edit expense form
- **ExpenseList**: Display expenses with filtering
- **AnalyticsCharts**: Charts and visualizations
- **AuditLogTable**: Display audit logs

### Pages

- **Dashboard**: Overview and summary
- **Expenses**: Expense management
- **Analytics**: Charts and insights
- **AuditLogs**: Audit trail

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  receipt_url TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
- Authentication flows
- Expense CRUD operations
- Role-based access control
- API validation
- Error handling

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Manual Deployment

1. **Backend Deployment**
   ```bash
   cd backend
   npm install --production
   npm run build
   npm start
   ```

2. **Frontend Deployment**
   ```bash
   cd frontend
   npm install
   npm run build
   # Serve dist/ directory with nginx or similar
   ```

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
NODE_ENV=production
```

**Frontend (.env):**
```env
VITE_API_URL="https://your-api-domain.com/api"
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token expiration handling

### API Security
- Input validation with Zod
- Rate limiting
- CORS configuration
- Helmet security headers
- SQL injection prevention (Prisma ORM)

### File Upload Security
- File type validation
- File size limits
- Secure file storage
- Malware scanning (can be added)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database credentials

2. **JWT Token Issues**
   - Check JWT_SECRET in .env
   - Ensure token is not expired
   - Verify token format

3. **File Upload Errors**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure valid file types

4. **CORS Errors**
   - Check CORS configuration in backend
   - Verify frontend URL in CORS settings

### Debug Mode

Enable debug logging:
```bash
# Backend
NODE_ENV=development npm run dev

# Frontend
npm run dev
```

### Logs

View application logs:
```bash
# Docker
docker-compose logs -f

# Backend
tail -f backend/logs/app.log

# Frontend
# Check browser console
```

## 📈 Performance Optimization

### Backend Optimizations
- Database indexing on frequently queried fields
- Query optimization with Prisma
- Caching for analytics data
- Pagination for large datasets

### Frontend Optimizations
- Code splitting with React.lazy()
- Image optimization
- Bundle size optimization
- Caching strategies

## 🔄 Updates and Maintenance

### Database Migrations
```bash
cd backend
npm run db:migrate
```

### Dependency Updates
```bash
# Backend
cd backend && npm update

# Frontend
cd frontend && npm update
```

### Security Updates
- Regularly update dependencies
- Monitor security advisories
- Update JWT secrets periodically
- Review and update CORS settings

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the test files for examples
4. Create an issue in the repository

---

**Last Updated**: December 2024
**Version**: 1.0.0 