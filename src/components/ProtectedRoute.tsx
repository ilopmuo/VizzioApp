import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types/database'

type Props = {
  children: React.ReactNode
  requiredRole?: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#6e6e73] text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
