import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { 
  PlusIcon, 
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { getImageUrl } from '../utils/api'

interface Expense {
  id: string
  amount: number
  category: string
  date: string
  notes?: string
  status: string
  receiptUrl?: string
  rejectionReason?: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface CreateExpenseForm {
  amount: string
  category: string
  date: string
  notes: string
  receipt: File | null
}

const Expenses = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('new') === 'true')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    status: searchParams.get('status') || '',
    startDate: '',
    endDate: '',
  })

  const [formData, setFormData] = useState<CreateExpenseForm>({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
    receipt: null
  })

  useEffect(() => {
    fetchExpenses()
  }, [filters])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.category) params.set('category', filters.category)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    setSearchParams(params)
  }, [filters, setSearchParams])

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      console.log('Current user:', user)
      console.log('User role:', user?.role)
      console.log('User ID:', user?.id)

      const response = await fetch(`/api/expenses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched expenses:', data.expenses.length)
        console.log('First expense user:', data.expenses[0]?.user?.name)
        setExpenses(data.expenses)
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (expenseId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, ...(reason && { reason }) })
      })

      if (response.ok) {
        fetchExpenses() // Refresh the list
        if (status === 'REJECTED') {
          setShowRejectModal(false)
          setRejectionReason('')
          setRejectingExpenseId(null)
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleExportExpenses = async () => {
    try {
      console.log('Starting expense export...')
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      console.log('Export URL:', `/api/expenses/export?${params}`)
      const token = localStorage.getItem('token')
      console.log('Token available:', !!token)
      console.log('Token length:', token ? token.length : 0)
      const response = await fetch(`/api/expenses/export?${params}`, {
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
        a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('Export completed successfully')
      } else {
        const errorText = await response.text()
        console.error('Export failed:', errorText)
        alert(`Failed to export expenses: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error exporting expenses:', error)
      alert('An error occurred while exporting expenses')
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0'
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date'
    }

    if (formData.receipt && formData.receipt.size > 5 * 1024 * 1024) {
      newErrors.receipt = 'File size must be less than 5MB'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('amount', formData.amount)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('date', new Date(formData.date).toISOString())
      formDataToSend.append('notes', formData.notes)
      
      // Debug: Log what we're sending
      console.log('Sending expense data:', {
        amount: formData.amount,
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes
      })
      
      if (formData.receipt) {
        formDataToSend.append('receipt', formData.receipt)
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Expense created successfully:', result)
        
        // Reset form and close modal
        setFormData({
          amount: '',
          category: '',
          date: '',
          notes: '',
          receipt: null
        })
        setErrors({})
        setShowCreateModal(false)
        
        // Show success message
        setSuccessMessage('Expense created successfully!')
        setTimeout(() => setSuccessMessage(''), 5000)
        
        // Refresh expenses list
        fetchExpenses()
      } else {
        const errorData = await response.json()
        console.error('Failed to create expense:', errorData)
        
        // Handle validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors: Record<string, string> = {}
          errorData.details.forEach((detail: any) => {
            validationErrors[detail.field] = detail.message
          })
          setErrors(validationErrors)
        } else {
          setErrors({ submit: errorData.message || 'Failed to create expense' })
        }
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      setErrors({ submit: 'An error occurred while creating the expense' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !editingExpense) {
      return
    }

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('amount', formData.amount)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('date', new Date(formData.date).toISOString())
      formDataToSend.append('notes', formData.notes)
      
      if (formData.receipt) {
        formDataToSend.append('receipt', formData.receipt)
      }

      console.log('Sending edit request for expense:', editingExpense.id)
      console.log('Form data:', {
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
        notes: formData.notes,
        hasReceipt: !!formData.receipt
      })
      
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Expense updated successfully:', result)
        
        // Reset form and close modal
        setFormData({
          amount: '',
          category: '',
          date: '',
          notes: '',
          receipt: null
        })
        setErrors({})
        setShowEditModal(false)
        setEditingExpense(null)
        
        // Show success message
        setSuccessMessage('Expense updated successfully! Status reset to pending for re-approval.')
        setTimeout(() => setSuccessMessage(''), 5000)
        
        // Refresh expenses list
        fetchExpenses()
      } else {
        const errorData = await response.json()
        console.error('Failed to update expense:', errorData)
        console.error('Response status:', response.status)
        
        // Handle validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors: Record<string, string> = {}
          errorData.details.forEach((detail: any) => {
            validationErrors[detail.field] = detail.message
          })
          setErrors(validationErrors)
        } else {
          setErrors({ submit: errorData.message || `Failed to update expense (${response.status})` })
        }
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      setErrors({ submit: 'An error occurred while updating the expense' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof CreateExpenseForm, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleInputChange('receipt', file)
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      notes: '',
      receipt: null
    })
    setErrors({})
    setSuccessMessage('')
  }

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
      receipt: null
    })
    setErrors({})
    setShowEditModal(true)
  }

  const openRejectModal = (expenseId: string) => {
    setRejectingExpenseId(expenseId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectWithReason = () => {
    if (rejectingExpenseId) {
      handleStatusUpdate(rejectingExpenseId, 'REJECTED', rejectionReason)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status}
      </span>
    )
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      TRAVEL: '✈️',
      FOOD: '🍽️',
      EQUIPMENT: '💻',
      OFFICE_SUPPLIES: '📎',
      SOFTWARE: '🔧',
      TRAINING: '📚',
      OTHER: '📄',
    }
    return icons[category] || '📄'
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
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'ADMIN' 
              ? 'Manage and review all expense submissions' 
              : 'Manage and track your expense submissions'
            }
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
        <div className="flex space-x-3">
          {user?.role === 'ADMIN' && (
            <button
              onClick={handleExportExpenses}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Expense
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">All Categories</option>
              <option value="TRAVEL">Travel</option>
              <option value="FOOD">Food</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="OFFICE_SUPPLIES">Office Supplies</option>
              <option value="SOFTWARE">Software</option>
              <option value="TRAINING">Training</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
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
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {expense.category.replace('_', ' ')}
                        </p>
                        <div className="ml-2">
                          {getStatusBadge(expense.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {expense.notes || 'No description'}
                      </p>
                      {expense.rejectionReason && (
                        <p className="text-sm text-red-600 mt-1">
                          <span className="font-medium">Rejection Reason:</span> {expense.rejectionReason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.user.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{expense.amount.toFixed(2)}
                      </p>
                    </div>
                    {user?.role === 'ADMIN' && expense.status === 'PENDING' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleStatusUpdate(expense.id, 'APPROVED')}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Approve"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openRejectModal(expense.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Reject"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                    {/* Edit button - only for own expenses or admin */}
                    {(user?.role === 'ADMIN' || expense.user.id === user?.id) && (
                      <button
                        onClick={() => openEditModal(expense)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Edit Expense"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    {expense.receiptUrl && (
                      <button
                        onClick={() => {
                          const imageUrl = getImageUrl(expense.receiptUrl!)
                          console.log('Opening image:', expense.receiptUrl, '->', imageUrl)
                          setSelectedImage(imageUrl)
                          setShowImageModal(true)
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Receipt"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {expenses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No expenses found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Expense</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${
                    errors.category ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select a category</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="FOOD">Food</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="TRAINING">Training</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.date ? 'border-red-500' : ''
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Describe the expense..."
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Receipt (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                  </div>
                </div>
                {formData.receipt && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{formData.receipt.name}</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('receipt', null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {errors.receipt && (
                  <p className="mt-1 text-sm text-red-600">{errors.receipt}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Expense</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingExpense(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditExpense} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.amount ? 'border-red-500' : ''
                  }`}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${
                    errors.category ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select a category</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="FOOD">Food</option>
                  <option value="EQUIPMENT">Equipment</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="TRAINING">Training</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.date ? 'border-red-500' : ''
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.notes ? 'border-red-500' : ''
                  }`}
                  placeholder="Optional notes about this expense"
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                )}
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Receipt (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt-upload-edit"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload-edit"
                          name="receipt-upload-edit"
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                  </div>
                </div>
                {formData.receipt && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{formData.receipt.name}</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange('receipt', null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {errors.receipt && (
                  <p className="mt-1 text-sm text-red-600">{errors.receipt}</p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingExpense(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Updating...' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Receipt Image</h3>
              <button
                onClick={() => {
                  setShowImageModal(false)
                  setSelectedImage('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Receipt"
                className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                onLoad={() => console.log('Image loaded successfully:', selectedImage)}
                onError={(e) => {
                  console.error('Failed to load image:', selectedImage)
                  console.error('Error details:', e)
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCAxMDBIMTUwVjEyMEg1MFYxMDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik02MCA5MEgxNDBWMTEwSDYwVjkweiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K'
                }}
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Expense Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reject Expense</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setRejectingExpenseId(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                    setRejectingExpenseId(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectWithReason}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reject Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses 