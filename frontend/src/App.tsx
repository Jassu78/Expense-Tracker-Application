import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Analytics from './pages/Analytics'
import Users from './pages/Users'
import AuditLogs from './pages/AuditLogs'
import TestUser from './pages/TestUser'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<Users />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="test-user" element={<TestUser />} />
      </Route>
    </Routes>
  )
}

export default App 