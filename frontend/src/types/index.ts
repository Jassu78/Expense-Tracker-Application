export interface User {
  id: string
  email: string
  name: string
  role: 'EMPLOYEE' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string
  status: ExpenseStatus
  receiptUrl?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export interface AuditLog {
  id: string
  action: string
  description: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
}

export type ExpenseCategory = 
  | 'TRAVEL'
  | 'FOOD'
  | 'EQUIPMENT'
  | 'OFFICE_SUPPLIES'
  | 'SOFTWARE'
  | 'TRAINING'
  | 'OTHER'

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
  pagination?: Pagination
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  message: string
}

export interface CreateExpenseRequest {
  amount: number
  category: ExpenseCategory
  date: string
  notes?: string
}

export interface UpdateExpenseStatusRequest {
  status: 'APPROVED' | 'REJECTED'
}

export interface ExpenseFilters {
  category?: ExpenseCategory
  status?: ExpenseStatus
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface AnalyticsData {
  data: Array<{
    category: string
    totalAmount: number
    count: number
  }>
  total: number
}

export interface TrendsData {
  data: Array<{
    month: string
    total: number
    count: number
    categories: Record<string, number>
  }>
  summary: {
    totalAmount: number
    totalCount: number
    averagePerMonth: number
  }
}

export interface SummaryData {
  summary: {
    totalExpenses: number
    pendingExpenses: number
    approvedExpenses: number
    rejectedExpenses: number
    totalAmount: number
    averageAmount: number
    approvalRate: number
  }
}

export interface TopSpender {
  user: {
    id: string
    name: string
    email: string
  }
  totalAmount: number
  expenseCount: number
} 