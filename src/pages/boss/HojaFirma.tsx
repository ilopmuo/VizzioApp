import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'

type EmployeeRow = {
  id: string
  full_name: string
  hourly_rate: number
  hours: Record<number, number>
}

export default function HojaFirma() {
  const { profile } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [rateVal, setRateVal] = useState('')

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

  const monthLabel = new Date(year, month, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => { loadData() }, [year, month])

  async function loadData() {
    setLoading(true)
    const [profilesRes, hoursRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, hourly_rate').eq('role', 'empleado').order('full_name'),
      supabase.from('firma_horas').select('employee_id, date, hours')
        .gte('date', dateStr(1))
        .lte('date', dateStr(daysInMonth)),
    ])

    const hoursMap: Record<string, Record<number, number>> = {}
    for (const h of (hoursRes.data ?? []) as any[]) {
      const day = parseInt(h.date.split('-')[2])
      if (!hoursMap[h.employee_id]) hoursMap[h.employee_id] = {}
      hoursMap[h.employee_id][day] = h.hours
    }

    setRows((profilesRes.data ?? []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      hourly_rate: p.hourly_rate ?? 0,
      hours: hoursMap[p.id] ?? {},
    })))
    setLoading(false)
  }

  function updateLocalHours(employeeId: string, day: number, val: string) {
    setRows(prev => prev.map(r => r.id === employeeId
      ? { ...r, hours: { ...r.hours, [day]: parseFloat(val) || 0 } }
      : r
    ))
  }

  async function saveHours(employeeId: string, day: number, val: string) {
    const hours = parseFloat(val)
    const date = dateStr(day)
    if (!val || isNaN(hours) || hours === 0) {
      await supabase.from('firma_horas').delete().eq('employee_id', employeeId).eq('date', date)
      setRows(prev => prev.map(r => {
        if (r.id !== employeeId) return r
        const next = { ...r.hours }
        delete next[day]
        return { ...r, hours: next }
      }))
    } else {
      await supabase.from('firma_horas').upsert(
        { employee_id: employeeId, date, hours, created_by: profile!.id },
        { onConflict: 'employee_id,date' }
      )
    }
  }

  async function saveRate(employeeId: string) {
    const rate = parseFloat(rateVal) || 0
    await supabase.from('profiles').update({ hourly_rate: rate }).eq('id', employeeId)
    setRows(prev => prev.map(r => r.id === employeeId ? { ...r, hourly_rate: rate } : r))
    setEditingRate(null)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const totalHoursAll = rows.reduce((s, r) => s + Object.values(r.hours).reduce((a, b) => a + b, 0), 0)
  const totalPayAll = rows.reduce((s, r) => {
    const h = Object.values(r.hours).reduce((a, b) => a + b, 0)
    return s + h * r.hourly_rate
  }, 0)

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Hoja de firma</h1>
            <p className="text-[#6e6e73] text-sm mt-1">Horas y pagos mensuales del equipo</p>
          </div>
          <div className="flex items-center gap-1 bg-white rounded-xl border border-[#d2d2d7] p-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#1d1d1f] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-sm font-medium text-[#1d1d1f] capitalize min-w-[148px] text-center">
              {monthLabel}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[#f5f5f7] text-[#1d1d1f] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-5">
            <p className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">{totalHoursAll}h</p>
            <p className="text-xs text-[#6e6e73] mt-0.5">Total horas mes</p>
          </div>
          <div className="bg-white rounded-2xl p-5">
            <p className="text-2xl font-semibold text-[#0066cc] tracking-tight">
              {totalPayAll.toFixed(2)}€
            </p>
            <p className="text-xs text-[#6e6e73] mt-0.5">Total a pagar</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-[#6e6e73] text-sm">
              No hay empleados. Créalos desde la pestaña{' '}
              <a href="/empleados" className="text-[#0066cc]">Empleados</a>.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#f5f5f7]">
                    {/* Sticky employee col */}
                    <th
                      className="sticky left-0 z-20 bg-white text-left px-4 py-3 text-xs font-semibold text-[#6e6e73] whitespace-nowrap"
                      style={{ minWidth: 180 }}
                    >
                      Empleado
                    </th>
                    {/* Day columns */}
                    {days.map(d => (
                      <th
                        key={d}
                        className="text-center py-3 text-xs font-semibold text-[#6e6e73]"
                        style={{ width: 36, minWidth: 36 }}
                      >
                        {d}
                      </th>
                    ))}
                    {/* Totals */}
                    <th className="text-right px-3 py-3 text-xs font-semibold text-[#6e6e73] whitespace-nowrap" style={{ minWidth: 64 }}>
                      Total h
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#6e6e73] whitespace-nowrap" style={{ minWidth: 88 }}>
                      Total €
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map(row => {
                    const totalH = Object.values(row.hours).reduce((a, b) => a + b, 0)
                    const totalPay = totalH * row.hourly_rate
                    return (
                      <tr key={row.id} className="border-b border-[#f5f5f7] last:border-0">
                        {/* Employee name + rate (sticky) */}
                        <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-r border-[#f5f5f7]">
                          <p className="text-sm font-medium text-[#1d1d1f] whitespace-nowrap leading-tight">
                            {row.full_name}
                          </p>
                          {editingRate === row.id ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                autoFocus
                                type="number"
                                value={rateVal}
                                onChange={e => setRateVal(e.target.value)}
                                onBlur={() => saveRate(row.id)}
                                onKeyDown={e => e.key === 'Enter' && saveRate(row.id)}
                                className="w-16 text-xs border border-[#0066cc] rounded-lg px-1.5 py-0.5 text-[#1d1d1f] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-xs text-[#6e6e73]">€/h</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingRate(row.id); setRateVal(String(row.hourly_rate)) }}
                              className="flex items-center gap-1 mt-1 group"
                            >
                              <span className="text-xs text-[#6e6e73] group-hover:text-[#0066cc] transition-colors">
                                {row.hourly_rate}€/h
                              </span>
                              <Pencil size={9} className="text-[#d2d2d7] group-hover:text-[#0066cc] transition-colors" />
                            </button>
                          )}
                        </td>

                        {/* Day cells */}
                        {days.map(d => (
                          <td key={d} className="text-center px-0.5 py-2.5">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={row.hours[d] > 0 ? row.hours[d] : ''}
                              placeholder="·"
                              onChange={e => updateLocalHours(row.id, d, e.target.value)}
                              onBlur={e => saveHours(row.id, d, e.target.value)}
                              className="w-8 h-7 text-center text-xs text-[#1d1d1f] bg-transparent rounded-lg focus:outline-none focus:bg-[#0066cc]/8 focus:text-[#0066cc] placeholder-[#d2d2d7] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        ))}

                        {/* Row totals */}
                        <td className="px-3 py-2.5 text-right">
                          <span className={`text-sm font-semibold ${totalH > 0 ? 'text-[#0066cc]' : 'text-[#d2d2d7]'}`}>
                            {totalH > 0 ? `${totalH}h` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`text-sm font-semibold ${totalPay > 0 ? 'text-[#1d1d1f]' : 'text-[#d2d2d7]'}`}>
                            {totalPay > 0 ? `${totalPay.toFixed(2)}€` : '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}

                  {/* Grand total footer row */}
                  <tr className="bg-[#f5f5f7] border-t-2 border-[#d2d2d7]">
                    <td className="sticky left-0 z-10 bg-[#f5f5f7] px-4 py-3 border-r border-[#d2d2d7]">
                      <p className="text-xs font-semibold text-[#1d1d1f]">Total mes</p>
                    </td>
                    {days.map(d => {
                      const dayTotal = rows.reduce((s, r) => s + (r.hours[d] || 0), 0)
                      return (
                        <td key={d} className="text-center px-0.5 py-3">
                          {dayTotal > 0 && (
                            <span className="text-[10px] font-semibold text-[#6e6e73]">{dayTotal}</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-bold text-[#0066cc]">{totalHoursAll}h</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-[#1d1d1f]">{totalPayAll.toFixed(2)}€</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-[#6e6e73] mt-3 text-center">
          Haz clic en el precio por hora de cada empleado para editarlo · Los cambios se guardan automáticamente
        </p>
      </div>
    </Layout>
  )
}
