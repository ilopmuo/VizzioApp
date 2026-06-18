import { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'

type EmployeeSummary = {
  id: string
  full_name: string
  totalHours: number
  entries: { id: string; date: string; hours: number; notes: string | null; resource_name: string | null }[]
  expanded: boolean
}

export default function EmployeeHours() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetch() {
      const [profilesRes, hoursRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('role', 'empleado').order('full_name'),
        supabase.from('work_hours').select('id, employee_id, date, hours, notes, resources(name)').order('date', { ascending: false }),
      ])
      const hours: any[] = hoursRes.data ?? []
      setEmployees((profilesRes.data ?? []).map((p) => {
        const empHours = hours.filter(h => h.employee_id === p.id)
        return {
          id: p.id, full_name: p.full_name,
          totalHours: empHours.reduce((s, h) => s + h.hours, 0),
          entries: empHours.map(h => ({ id: h.id, date: h.date, hours: h.hours, notes: h.notes, resource_name: h.resources?.name ?? null })),
          expanded: false,
        }
      }))
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = employees.filter(e => e.full_name.toLowerCase().includes(search.toLowerCase()))
  const grandTotal = employees.reduce((s, e) => s + e.totalHours, 0)

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Horas del equipo</h1>
            <p className="text-[#6e6e73] text-sm mt-1">{employees.length} empleados</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-3 text-right">
            <p className="text-xl font-semibold text-[#0066cc] tracking-tight">{grandTotal}h</p>
            <p className="text-xs text-[#6e6e73]">Total equipo</p>
          </div>
        </div>

        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empleado..."
            className="w-full bg-white border border-[#d2d2d7] rounded-xl pl-10 pr-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Clock size={32} className="text-[#d2d2d7] mx-auto mb-3" />
            <p className="text-[#6e6e73]">No se encontraron empleados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((emp) => (
              <div key={emp.id} className="bg-white rounded-2xl overflow-hidden">
                <button
                  onClick={() => setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, expanded: !e.expanded } : e))}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#f5f5f7] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc] font-semibold text-sm shrink-0">
                    {emp.full_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-[#1d1d1f]">{emp.full_name}</p>
                    <p className="text-xs text-[#6e6e73]">{emp.entries.length} registro{emp.entries.length !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#0066cc] mr-2">{emp.totalHours}h</span>
                  {emp.expanded ? <ChevronUp size={15} className="text-[#6e6e73]" /> : <ChevronDown size={15} className="text-[#6e6e73]" />}
                </button>

                {emp.expanded && (
                  <div className="border-t border-[#f5f5f7]">
                    {emp.entries.length === 0 ? (
                      <p className="px-5 py-4 text-xs text-[#6e6e73]">Sin registros de horas</p>
                    ) : emp.entries.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#f5f5f7] last:border-0">
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-[#f5f5f7] flex flex-col items-center justify-center">
                          <span className="text-sm font-semibold text-[#1d1d1f] leading-none">{entry.hours}</span>
                          <span className="text-[9px] text-[#6e6e73] leading-none">h</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-[#1d1d1f]">
                              {new Date(entry.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {entry.resource_name && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[#6e6e73]">{entry.resource_name}</span>
                            )}
                          </div>
                          {entry.notes && <p className="text-xs text-[#6e6e73] mt-0.5 truncate">{entry.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
