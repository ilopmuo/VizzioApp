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
      <div className="min-h-screen flex items-center justify-center bg-[#08060f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-violet-400 text-sm">Cargando...</span>
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
