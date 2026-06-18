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

  useEffect(() => {
    if (!profile) return
    supabase
      .from('work_hours')
      .select('id, date, hours, notes, resources(name)')
      .eq('employee_id', profile.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setEntries((data ?? []).map((r: any) => ({
          id: r.id, date: r.date, hours: r.hours, notes: r.notes,
          resource_name: r.resources?.name ?? null,
        })))
        setLoading(false)
      })
  }, [profile])

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('work_hours').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Mis horas</h1>
            <p className="text-[#6e6e73] text-sm mt-1">Historial de horas registradas</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-3 text-right">
            <p className="text-xl font-semibold text-[#0066cc] tracking-tight">{totalHours}h</p>
            <p className="text-xs text-[#6e6e73]">Total acumulado</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Clock size={32} className="text-[#d2d2d7] mx-auto mb-3" />
            <p className="text-[#1d1d1f] font-medium">Sin registros</p>
            <p className="text-[#6e6e73] text-sm mt-1">Ve a "Imputar horas" para añadir tu primer registro.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-[#0066cc]/8 flex flex-col items-center justify-center">
                  <span className="text-base font-semibold text-[#0066cc] leading-none">{entry.hours}</span>
                  <span className="text-[9px] text-[#0066cc]/60 leading-none mt-0.5">h</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#1d1d1f]">
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                    {entry.resource_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[#6e6e73]">
                        {entry.resource_name}
                      </span>
                    )}
                  </div>
                  {entry.notes && <p className="text-xs text-[#6e6e73] mt-0.5 truncate">{entry.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="shrink-0 p-2 text-[#d2d2d7] hover:text-[#ff3b30] rounded-lg transition-colors disabled:opacity-40"
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
