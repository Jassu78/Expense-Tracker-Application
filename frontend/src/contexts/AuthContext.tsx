import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../types'
import { authService } from '../services/authService'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const userData = await authService.getCurrentUser()
        console.log('User from checkAuth:', userData)
        setUser(userData)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      console.log('Login response:', response)
      console.log('User from login:', response.user)
      localStorage.setItem('token', response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 