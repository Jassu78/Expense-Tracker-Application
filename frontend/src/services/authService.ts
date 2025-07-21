import axios from 'axios'
import { LoginRequest, LoginResponse, User } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me')
    return response.data.user
  },
} 