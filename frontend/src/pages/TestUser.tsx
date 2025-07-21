import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const TestUser = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const testEmployeeLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'employee@example.com',
          password: 'password123'
        })
      })
      
      const data = await response.json()
      console.log('Employee login response:', data)
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        window.location.reload()
      }
    } catch (error) {
      console.error('Employee login error:', error)
    }
  }

  const testAdminLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'password123'
        })
      })
      
      const data = await response.json()
      console.log('Admin login response:', data)
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        window.location.reload()
      }
    } catch (error) {
      console.error('Admin login error:', error)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Current User Test</h1>
      
      {user ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">User Information</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Token Information</h3>
            <p><strong>Token exists:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
            <p><strong>Token length:</strong> {localStorage.getItem('token')?.length || 0}</p>
          </div>

          <div className="mt-4 space-x-2">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
            <button
              onClick={testEmployeeLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login as Employee
            </button>
            <button
              onClick={testAdminLogin}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Login as Admin
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p>No user logged in</p>
          <div className="mt-4 space-x-2">
            <button
              onClick={testEmployeeLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login as Employee
            </button>
            <button
              onClick={testAdminLogin}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Login as Admin
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestUser 