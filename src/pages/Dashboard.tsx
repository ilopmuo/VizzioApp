import { useEffect, useState } from 'react'
import { Clock, Package, TrendingUp, Calendar } from 'lucide-react'
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
  const [stats, setStats] = useState<Stats>({
    totalHours: 0,
    hoursThisMonth: 0,
    totalResources: 0,
    activeResources: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      if (profile?.role === 'empleado') {
        const [allHours, monthHours] = await Promise.all([
          supabase
            .from('work_hours')
            .select('hours')
            .eq('employee_id', profile.id),
          supabase
            .from('work_hours')
            .select('hours')
            .eq('employee_id', profile.id)
            .gte('date', firstDay),
        ])

        const total = ((allHours.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        const month = ((monthHours.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        setStats((p) => ({ ...p, totalHours: total, hoursThisMonth: month }))
      } else {
        const [allHours, monthHours, resources, activeRes] = await Promise.all([
          supabase.from('work_hours').select('hours'),
          supabase.from('work_hours').select('hours').gte('date', firstDay),
          supabase.from('resources').select('id', { count: 'exact', head: true }),
          supabase
            .from('resources')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'activo'),
        ])

        const total = ((allHours.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        const month = ((monthHours.data ?? []) as { hours: number }[]).reduce((s, r) => s + r.hours, 0)
        setStats({
          totalHours: total,
          hoursThisMonth: month,
          totalResources: resources.count ?? 0,
          activeResources: activeRes.count ?? 0,
        })
      }
      setLoading(false)
    }

    if (profile) fetchStats()
  }, [profile])

  const isJefe = profile?.role === 'jefe'

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Hola, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-violet-400 text-sm mt-1">
            {isJefe ? 'Panel de gestión — Vizzio' : 'Tu panel de trabajo — Vizzio'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: isJefe ? 4 : 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0f0c1e] rounded-2xl border border-violet-900/30 p-5 h-28 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 ${isJefe ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
            <StatCard
              icon={<Clock size={20} />}
              label="Horas totales"
              value={`${stats.totalHours}h`}
              color="violet"
            />
            <StatCard
              icon={<Calendar size={20} />}
              label="Horas este mes"
              value={`${stats.hoursThisMonth}h`}
              color="purple"
            />
            {isJefe && (
              <>
                <StatCard
                  icon={<Package size={20} />}
                  label="Recursos totales"
                  value={stats.totalResources}
                  color="indigo"
                />
                <StatCard
                  icon={<TrendingUp size={20} />}
                  label="Recursos activos"
                  value={stats.activeResources}
                  color="fuchsia"
                />
              </>
            )}
          </div>
        )}

        <div className="mt-8 bg-[#0f0c1e] rounded-2xl border border-violet-900/30 p-6">
          <h2 className="text-base font-semibold text-white mb-1">
            {isJefe ? '¿Qué quieres hacer hoy?' : 'Acciones rápidas'}
          </h2>
          <p className="text-violet-400 text-sm mb-4">
            {isJefe
              ? 'Gestiona recursos y revisa el trabajo de tu equipo.'
              : 'Registra tus horas o revisa tu historial.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {isJefe ? (
              <>
                <QuickLink href="/recursos" label="Gestionar recursos" />
                <QuickLink href="/horas-empleados" label="Ver horas del equipo" />
              </>
            ) : (
              <>
                <QuickLink href="/imputar-horas" label="Imputar horas" />
                <QuickLink href="/mis-horas" label="Ver mi historial" />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'violet' | 'purple' | 'indigo' | 'fuchsia'
}) {
  const colors = {
    violet: 'text-violet-400 bg-violet-600/10',
    purple: 'text-purple-400 bg-purple-600/10',
    indigo: 'text-indigo-400 bg-indigo-600/10',
    fuchsia: 'text-fuchsia-400 bg-fuchsia-600/10',
  }

  return (
    <div className="bg-[#0f0c1e] rounded-2xl border border-violet-900/30 p-5">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-violet-400 mt-0.5">{label}</p>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="px-4 py-2 rounded-lg bg-violet-600/20 border border-violet-600/30 text-violet-300 text-sm font-medium hover:bg-violet-600/30 transition-colors"
    >
      {label}
    </a>
  )
}
