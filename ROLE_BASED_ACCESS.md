# Role-Based Access Control (RBAC)

This document explains the role-based access control implemented in the Remote Expense Tracker application.

## User Roles

### 1. ADMIN Role
**Full system access and control**

**Capabilities:**
- ✅ View all expenses from all users
- ✅ Approve/reject any expense with optional reason
- ✅ Edit any expense (resets to pending for re-approval)
- ✅ Access Analytics dashboard
- ✅ View Audit Logs
- ✅ Export expenses and audit logs to CSV
- ✅ View financial summaries and trends
- ✅ See top spenders and category breakdowns

**UI Elements:**
- Purple role badge displayed in header
- "Manage and review all expense submissions" description
- Analytics and Audit Logs navigation items
- Export CSV buttons
- Approve/Reject buttons on all pending expenses
- Edit buttons on all expenses

### 2. EMPLOYEE Role
**Limited to own expenses only**

**Capabilities:**
- ✅ View only their own expenses
- ✅ Create new expenses
- ✅ Edit their own expenses (resets to pending)
- ✅ View receipt images
- ✅ Filter and search their expenses
- ❌ Cannot approve/reject expenses
- ❌ Cannot access Analytics
- ❌ Cannot view Audit Logs
- ❌ Cannot export data

**UI Elements:**
- Blue role badge displayed in header
- "Manage and track your expense submissions" description
- No Analytics or Audit Logs navigation
- No Export CSV buttons
- Edit buttons only on own expenses
- No approve/reject buttons

## Backend Security

### Database Level
- **GET /api/expenses**: Automatically filters by `userId` for employees
- **PUT /api/expenses/:id**: Checks ownership before allowing edits
- **PUT /api/expenses/:id/status**: Admin-only endpoint
- **GET /api/analytics/summary**: Admin-only endpoint
- **GET /api/audit/logs**: Admin-only endpoint
- **GET /api/expenses/export**: Admin-only endpoint

### Permission Checks
```javascript
// Employee can only see their own expenses
if (req.user.role === 'EMPLOYEE') {
  where.userId = req.user.id;
}

// Employee can only edit their own expenses
if (req.user.role === 'EMPLOYEE' && existingExpense.userId !== req.user.id) {
  return res.status(403).json({
    error: 'Access denied',
    message: 'You can only edit your own expenses',
  });
}
```

## Frontend Security

### Route Protection
- Analytics page: Shows "Access Denied" for non-admin users
- Audit Logs page: Shows "Access Denied" for non-admin users
- Navigation: Admin-only items hidden for employees

### UI Adaptations
- Role badges displayed in header and sidebar
- Role-specific descriptions and messaging
- Conditional rendering of admin features
- Role-based navigation items

## Test Users

### Admin User
- **Email**: admin@example.com
- **Password**: password123
- **Role**: ADMIN
- **Access**: Full system access

### Employee User
- **Email**: employee@example.com
- **Password**: password123
- **Role**: EMPLOYEE
- **Access**: Own expenses only

## Security Features

1. **JWT Token Authentication**: All requests require valid JWT token
2. **Role Validation**: Backend validates user role on protected endpoints
3. **Ownership Checks**: Employees can only access their own data
4. **Audit Logging**: All actions are logged with user information
5. **Frontend Protection**: UI elements hidden based on role
6. **API Protection**: Backend enforces access control regardless of frontend

## Testing Scenarios

### Admin Testing
1. Login as admin@example.com
2. Verify can see all expenses from all users
3. Verify can approve/reject any expense
4. Verify can access Analytics and Audit Logs
5. Verify can export data

### Employee Testing
1. Login as employee@example.com
2. Verify can only see own expenses
3. Verify cannot see Analytics or Audit Logs
4. Verify can edit own expenses
5. Verify cannot approve/reject expenses

## Implementation Notes

- Role information is stored in JWT token
- Backend validates role on every protected request
- Frontend adapts UI based on user role
- All role checks happen on both frontend and backend
- Audit logs track all user actions with role information 