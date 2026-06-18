import { useEffect, useState } from 'react'
import { Clock, Package, TrendingUp, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

type Stats = {
  totalHours: number
  hoursThisMonth: number
  totalResources: number
  activeResources: number
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalHours: 0, hoursThisMonth: 0, totalResources: 0, activeResources: 0 })
  const [loading, setLoading] = useState(true)

  const isJefe = profile?.role === 'jefe'

  useEffect(() => {
    async function fetchStats() {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      if (!isJefe) {
        const [all, month] = await Promise.all([
          supabase.from('work_hours').select('hours').eq('employee_id', profile!.id),
          supabase.from('work_hours').select('hours').eq('employee_id', profile!.id).gte('date', firstDay),
        ])
        const total = ((all.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        const m = ((month.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        setStats(p => ({ ...p, totalHours: total, hoursThisMonth: m }))
      } else {
        const [all, month, res, activeRes] = await Promise.all([
          supabase.from('work_hours').select('hours'),
          supabase.from('work_hours').select('hours').gte('date', firstDay),
          supabase.from('resources').select('id', { count: 'exact', head: true }),
          supabase.from('resources').select('id', { count: 'exact', head: true }).eq('status', 'activo'),
        ])
        const total = ((all.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        const m = ((month.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        setStats({ totalHours: total, hoursThisMonth: m, totalResources: res.count ?? 0, activeResources: activeRes.count ?? 0 })
      }
      setLoading(false)
    }
    if (profile) fetchStats()
  }, [profile])

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
            Hola, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-[#6e6e73] text-sm mt-1">
            {isJefe ? 'Panel de gestión' : 'Tu panel de trabajo'}
          </p>
        </div>

        {loading ? (
          <div className={`grid gap-3 ${isJefe ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
            {Array.from({ length: isJefe ? 4 : 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-3 ${isJefe ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
            <StatCard icon={<Clock size={18} />} label="Horas totales" value={`${stats.totalHours}h`} />
            <StatCard icon={<Calendar size={18} />} label="Este mes" value={`${stats.hoursThisMonth}h`} />
            {isJefe && (
              <>
                <StatCard icon={<Package size={18} />} label="Recursos" value={stats.totalResources} />
                <StatCard icon={<TrendingUp size={18} />} label="Activos" value={stats.activeResources} />
              </>
            )}
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl p-6">
          <h2 className="text-base font-semibold text-[#1d1d1f] mb-4">Acciones rápidas</h2>
          <div className="flex flex-wrap gap-2">
            {isJefe ? (
              <>
                <QuickLink to="/recursos" label="Gestionar recursos" />
                <QuickLink to="/horas-empleados" label="Ver horas del equipo" />
                <QuickLink to="/empleados" label="Crear empleado" />
              </>
            ) : (
              <>
                <QuickLink to="/imputar-horas" label="Imputar horas" />
                <QuickLink to="/mis-horas" label="Ver mi historial" />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="text-[#0066cc] mb-3">{icon}</div>
      <p className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{value}</p>
      <p className="text-xs text-[#6e6e73] mt-0.5">{label}</p>
    </div>
  )
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 rounded-lg bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] text-sm font-medium hover:bg-[#e8e8ed] transition-colors"
    >
      {label}
    </Link>
  )
}
