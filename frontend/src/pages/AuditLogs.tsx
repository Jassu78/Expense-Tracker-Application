import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface AuditLog {
  id: string
  action: string
  description: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
  metadata?: Record<string, any>
}

interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const AuditLogs = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return
    }
    fetchAuditLogs()
  }, [user, filters, pagination.page])

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      })

      const response = await fetch(`/api/audit/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data: AuditLogsResponse = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'LOGIN': '🔐',
      'LOGOUT': '🚪',
      'CREATE_EXPENSE': '➕',
      'UPDATE_EXPENSE': '✏️',
      'DELETE_EXPENSE': '🗑️',
      'APPROVE_EXPENSE': '✅',
      'REJECT_EXPENSE': '❌',
      'EXPORT_DATA': '📊',
      'VIEW_ANALYTICS': '📈',
      'USER_CREATED': '👤',
      'USER_UPDATED': '👤',
      'USER_DELETED': '👤',
    }
    return icons[action] || '📝'
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'LOGIN': 'text-green-600',
      'LOGOUT': 'text-gray-600',
      'CREATE_EXPENSE': 'text-blue-600',
      'UPDATE_EXPENSE': 'text-yellow-600',
      'DELETE_EXPENSE': 'text-red-600',
      'APPROVE_EXPENSE': 'text-green-600',
      'REJECT_EXPENSE': 'text-red-600',
      'EXPORT_DATA': 'text-purple-600',
      'VIEW_ANALYTICS': 'text-indigo-600',
      'USER_CREATED': 'text-green-600',
      'USER_UPDATED': 'text-yellow-600',
      'USER_DELETED': 'text-red-600',
    }
    return colors[action] || 'text-gray-600'
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleExportLogs = async () => {
    try {
      console.log('Starting audit logs export...')
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      console.log('Export URL:', `/api/logs/export?${params}`)
      const token = localStorage.getItem('token')
      console.log('Token available:', !!token)
      console.log('Token length:', token ? token.length : 0)
      const response = await fetch(`/api/logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Export response status:', response.status)
      console.log('Export response headers:', response.headers)

      if (response.ok) {
        const blob = await response.blob()
        console.log('Blob size:', blob.size)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('Export completed successfully')
      } else {
        const errorText = await response.text()
        console.error('Export failed:', errorText)
        alert(`Failed to export audit logs: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      alert('An error occurred while exporting audit logs')
    }
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need admin privileges to view audit logs.
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportLogs}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE_EXPENSE">Create Expense</option>
              <option value="UPDATE_EXPENSE">Update Expense</option>
              <option value="DELETE_EXPENSE">Delete Expense</option>
              <option value="APPROVE_EXPENSE">Approve Expense</option>
              <option value="REJECT_EXPENSE">Reject Expense</option>
              <option value="EXPORT_DATA">Export Data</option>
              <option value="VIEW_ANALYTICS">View Analytics</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              placeholder="Search by user"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search logs..."
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Activity Log ({pagination.total} entries)
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {logs.map((log) => (
            <li key={log.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getActionIcon(log.action)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </p>
                        <div className="ml-2 flex items-center text-xs text-gray-500">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {log.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {log.user.name} ({log.user.email})
                      </div>
                    </div>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="text-right">
                      <button
                        className="text-xs text-primary-600 hover:text-primary-800"
                        onClick={() => console.log('Metadata:', log.metadata)}
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {logs.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogs 