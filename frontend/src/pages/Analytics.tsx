import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

interface AnalyticsData {
  summary: {
    totalExpenses: number
    pendingExpenses: number
    approvedExpenses: number
    rejectedExpenses: number
    totalAmount: number
    averageAmount: number
    approvalRate: number
  }
  categoryBreakdown: Array<{
    category: string
    totalAmount: number
    count: number
  }>
  monthlyTrends: Array<{
    month: string
    total: number
    count: number
    categories: Record<string, number>
  }>
  topSpenders: Array<{
    user: {
      id: string
      name: string
      email: string
    }
    totalAmount: number
    expenseCount: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658']

const Analytics = () => {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('1000') // days - longer range to include sample data
  const [selectedChart, setSelectedChart] = useState('category')

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return
    }
    fetchAnalytics()
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    try {
      console.log('Fetching analytics data...')
      const response = await fetch(`/api/analytics/summary?days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Analytics data received:', data)
        setAnalyticsData(data)
      } else {
        console.error('Analytics API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need admin privileges to view analytics.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available.</p>
        <p className="text-sm text-gray-400">Debug: analyticsData is null</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights into expense patterns and trends
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(analyticsData.summary.totalAmount)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Expenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analyticsData.summary.totalExpenses}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(analyticsData.summary.averageAmount)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approval Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatPercentage(analyticsData.summary.approvalRate)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Expense Analytics
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedChart('category')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  selectedChart === 'category'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Category Breakdown
              </button>
              <button
                onClick={() => setSelectedChart('trends')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  selectedChart === 'trends'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly Trends
              </button>
            </div>
          </div>

          {/* Category Breakdown Chart */}
          {selectedChart === 'category' && (
            <div className="space-y-6">
              <div className="h-80">
                {analyticsData.categoryBreakdown && analyticsData.categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        tickFormatter={(value) => value.replace('_', ' ')}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                      />
                      <Bar dataKey="totalAmount" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No category data available</p>
                  </div>
                )}
              </div>

              {/* Category Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {analyticsData.categoryBreakdown.map((category, index) => (
                  <div key={category.category} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {category.category.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {category.count} expenses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(category.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {((category.totalAmount / analyticsData.summary.totalAmount) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Trends Chart */}
          {selectedChart === 'trends' && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Spenders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Spenders
          </h3>
          <div className="space-y-4">
            {analyticsData.topSpenders.map((spender, index) => (
              <div key={spender.user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {spender.user.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {spender.user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {spender.expenseCount} expenses
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(spender.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((spender.totalAmount / analyticsData.summary.totalAmount) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Expense Status Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Approved', value: analyticsData.summary.approvedExpenses, color: '#10B981' },
                      { name: 'Pending', value: analyticsData.summary.pendingExpenses, color: '#F59E0B' },
                      { name: 'Rejected', value: analyticsData.summary.rejectedExpenses, color: '#EF4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Approved', value: analyticsData.summary.approvedExpenses, color: '#10B981' },
                      { name: 'Pending', value: analyticsData.summary.pendingExpenses, color: '#F59E0B' },
                      { name: 'Rejected', value: analyticsData.summary.rejectedExpenses, color: '#EF4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Key Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Expenses</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analyticsData.summary.totalExpenses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Approved</span>
                <span className="text-sm font-semibold text-green-600">
                  {analyticsData.summary.approvedExpenses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Pending</span>
                <span className="text-sm font-semibold text-yellow-600">
                  {analyticsData.summary.pendingExpenses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Rejected</span>
                <span className="text-sm font-semibold text-red-600">
                  {analyticsData.summary.rejectedExpenses}
                </span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Average per Expense</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(analyticsData.summary.averageAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Approval Rate</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatPercentage(analyticsData.summary.approvalRate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics 