import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface User {
  id: string
  email: string
  name: string
  role: 'EMPLOYEE' | 'ADMIN'
  createdAt: string
  updatedAt: string
  _count: {
    expenses: number
  }
}

interface CreateUserForm {
  email: string
  password: string
  name: string
  role: 'EMPLOYEE' | 'ADMIN'
}

interface UpdateUserForm {
  email: string
  name: string
  role: 'EMPLOYEE' | 'ADMIN'
  password?: string
}

const Users = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    name: '',
    role: 'EMPLOYEE'
  })

  const [editForm, setEditForm] = useState<UpdateUserForm>({
    email: '',
    name: '',
    role: 'EMPLOYEE'
  })

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return
    }
    fetchUsers()
  }, [user, searchTerm, pagination.page])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        setSuccessMessage('User created successfully!')
        setCreateForm({
          email: '',
          password: '',
          name: '',
          role: 'EMPLOYEE'
        })
        setShowCreateModal(false)
        fetchUsers()
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const errorData = await response.json()
        if (errorData.details) {
          const validationErrors: Record<string, string> = {}
          errorData.details.forEach((detail: any) => {
            validationErrors[detail.field] = detail.message
          })
          setErrors(validationErrors)
        } else {
          setErrors({ submit: errorData.message || 'Failed to create user' })
        }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setErrors({ submit: 'An error occurred while creating the user' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setSubmitting(true)
    setErrors({})

    try {
      const updateData: any = {
        email: editForm.email,
        name: editForm.name,
        role: editForm.role
      }

      if (editForm.password) {
        updateData.password = editForm.password
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setSuccessMessage('User updated successfully!')
        setShowEditModal(false)
        setSelectedUser(null)
        fetchUsers()
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const errorData = await response.json()
        if (errorData.details) {
          const validationErrors: Record<string, string> = {}
          errorData.details.forEach((detail: any) => {
            validationErrors[detail.field] = detail.message
          })
          setErrors(validationErrors)
        } else {
          setErrors({ submit: errorData.message || 'Failed to update user' })
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setErrors({ submit: 'An error occurred while updating the user' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccessMessage('User deleted successfully!')
        fetchUsers()
        setTimeout(() => setSuccessMessage(''), 5000)
      } else {
        const errorData = await response.json()
        alert(errorData.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('An error occurred while deleting the user')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      email: user.email,
      name: user.name,
      role: user.role
    })
    setShowEditModal(true)
  }

  const getRoleBadge = (role: string) => {
    const roleClasses = {
      ADMIN: 'bg-purple-100 text-purple-800',
      EMPLOYEE: 'bg-blue-100 text-blue-800',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleClasses[role as keyof typeof roleClasses]}`}>
        {role === 'ADMIN' ? (
          <>
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            Admin
          </>
        ) : (
          <>
            <UserIcon className="h-3 w-3 mr-1" />
            Employee
          </>
        )}
      </span>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access this page.
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employees and their access to the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-green-400">✓</div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((userItem) => (
            <li key={userItem.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {userItem.name}
                        </p>
                        <div className="ml-2">
                          {getRoleBadge(userItem.role)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {userItem.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        {userItem._count.expenses} expenses • Joined {format(new Date(userItem.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(userItem)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit User"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {userItem.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete User"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new employee.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Employee</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value as 'EMPLOYEE' | 'ADMIN' }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {errors.submit}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Employee</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  placeholder="Leave blank to keep current password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'EMPLOYEE' | 'ADMIN' }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {errors.submit}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users 