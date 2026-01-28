import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, roles, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Check if user has the required role
  // requiredRole can be 'doctor', 'receptionist', or 'admin'
  // roles is an array like ['DOCTOR', 'ADMIN']
  if (requiredRole) {
    const normalizedRequiredRole = requiredRole.toUpperCase()
    const hasRole = roles && (roles.includes('SUPER_ADMIN') || roles.some(role => role === normalizedRequiredRole))

    console.log('ProtectedRoute Check:', {
      requiredRole,
      normalizedRequiredRole,
      userRoles: roles,
      hasRole,
      currentUser: currentUser?.email
    })

    if (!hasRole) {
      console.warn(`Access denied for ${requiredRole}. Redirecting...`)
      // Redirect to appropriate dashboard based on first role
      if (roles.includes('SUPER_ADMIN')) {
        return <Navigate to="/master" replace />
      } else if (roles.includes('DOCTOR')) {
        return <Navigate to="/doctor" replace />
      } else if (roles.includes('RECEPTIONIST')) {
        return <Navigate to="/receptionist" replace />
      } else if (roles.includes('ADMIN')) {
        return <Navigate to="/admin" replace />
      }
      return <Navigate to="/" replace />
    }
  }

  return children
}
