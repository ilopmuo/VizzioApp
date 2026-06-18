import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import type { Resource } from '../../types/database'

const schema = z.object({
  date: z.string().min(1, 'Selecciona una fecha'),
  hours: z.number().min(0.5, 'Mínimo 0.5 horas').max(24, 'Máximo 24 horas'),
  resource_id: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function LogHours() {
  const { profile } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  })

  useEffect(() => {
    supabase.from('resources').select('*').eq('status', 'activo').order('name')
      .then(({ data }) => setResources(data ?? []))
  }, [])

  async function onSubmit(data: FormData) {
    if (!profile) return
    const { error } = await supabase.from('work_hours').insert({
      employee_id: profile.id,
      date: data.date,
      hours: data.hours,
      resource_id: data.resource_id || null,
      notes: data.notes || null,
    })
    if (!error) {
      setSuccess(true)
      reset({ date: new Date().toISOString().split('T')[0] })
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Imputar horas</h1>
          <p className="text-[#6e6e73] text-sm mt-1">Registra las horas trabajadas</p>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            <CheckCircle size={16} />
            Horas registradas correctamente
          </div>
        )}

        <div className="bg-white rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Fecha</label>
                <input
                  {...register('date')}
                  type="date"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                />
                {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Horas</label>
                <input
                  {...register('hours', { valueAsNumber: true })}
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  placeholder="8"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                />
                {errors.hours && <p className="mt-1 text-xs text-red-500">{errors.hours.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                Recurso <span className="text-[#6e6e73] font-normal">(opcional)</span>
              </label>
              <select
                {...register('resource_id')}
                className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
              >
                <option value="">Sin recurso específico</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} — {r.type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
                Notas <span className="text-[#6e6e73] font-normal">(opcional)</span>
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Describe el trabajo realizado..."
                className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0066cc] hover:bg-[#0077ed] disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar horas'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
