import { useEffect, useState } from 'react'
import { Trash2, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

type HourEntry = {
  id: string
  date: string
  hours: number
  notes: string | null
  resource_name: string | null
}

export default function MyHours() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<HourEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function fetchEntries() {
    if (!profile) return
    const { data } = await supabase
      .from('work_hours')
      .select('id, date, hours, notes, resources(name)')
      .eq('employee_id', profile.id)
      .order('date', { ascending: false })

    setEntries(
      (data ?? []).map((r: any) => ({
        id: r.id,
        date: r.date,
        hours: r.hours,
        notes: r.notes,
        resource_name: r.resources?.name ?? null,
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    fetchEntries()
  }, [profile])

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('work_hours').delete().eq('id', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDeleting(null)
  }

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis horas</h1>
            <p className="text-violet-400 text-sm mt-1">Historial completo de horas registradas</p>
          </div>
          <div className="bg-[#0f0c1e] rounded-xl border border-violet-900/30 px-4 py-2.5 text-right">
            <p className="text-xl font-bold text-violet-400">{totalHours}h</p>
            <p className="text-xs text-violet-600">Total acumulado</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0f0c1e] rounded-xl border border-violet-900/30 h-20 animate-pulse"
              />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-[#0f0c1e] rounded-2xl border border-violet-900/30 p-12 text-center">
            <Clock size={40} className="text-violet-800 mx-auto mb-3" />
            <p className="text-violet-400 font-medium">Sin registros aún</p>
            <p className="text-violet-600 text-sm mt-1">
              Ve a "Imputar horas" para añadir tu primer registro.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-[#0f0c1e] rounded-xl border border-violet-900/30 px-5 py-4 flex items-center gap-4"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-violet-600/15 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-violet-400 leading-none">{entry.hours}</span>
                  <span className="text-[10px] text-violet-600 leading-none">horas</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {entry.resource_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/40 border border-violet-700/30 text-violet-400">
                        {entry.resource_name}
                      </span>
                    )}
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-violet-500 mt-0.5 truncate">{entry.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="shrink-0 p-2 text-violet-700 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
