import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalExpenses: number
  pendingExpenses: number
  approvedExpenses: number
  rejectedExpenses: number
  totalAmount: number
  averageAmount: number
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/summary', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setStats(data.summary)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsCards = [
    {
      name: 'Total Expenses',
      value: stats?.totalExpenses || 0,
      icon: CreditCardIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending',
      value: stats?.pendingExpenses || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Approved',
      value: stats?.approvedExpenses || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Rejected',
      value: stats?.rejectedExpenses || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}! Here's an overview of {user?.role === 'ADMIN' ? 'all expenses' : 'your expenses'}.
        </p>
        <div className="mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user?.role === 'ADMIN' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {item.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      {user?.role === 'ADMIN' && stats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Financial Summary
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="bg-gray-50 px-4 py-5 rounded-lg">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{stats.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-5 rounded-lg">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Average per Expense</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{stats.averageAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button 
              onClick={() => navigate('/expenses?new=true')}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                  <CreditCardIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Create New Expense
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add a new expense with receipt upload
                </p>
              </div>
            </button>

            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/expenses?status=PENDING')}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <CheckCircleIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Review Pending
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Review and approve pending expenses
                  </p>
                </div>
              </button>
            )}

            <button 
              onClick={() => navigate('/expenses')}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <UserGroupIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  View All Expenses
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Browse and filter all expenses
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 