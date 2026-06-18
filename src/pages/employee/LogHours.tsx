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
    supabase
      .from('resources')
      .select('*')
      .eq('status', 'activo')
      .order('name')
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
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Imputar horas</h1>
          <p className="text-violet-400 text-sm mt-1">Registra las horas trabajadas hoy</p>
        </div>

        {success && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-sm">
            <CheckCircle size={17} />
            Horas registradas correctamente
          </div>
        )}

        <div className="bg-[#0f0c1e] rounded-2xl border border-violet-900/30 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-violet-300 mb-1.5">
                  Fecha
                </label>
                <input
                  {...register('date')}
                  type="date"
                  className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-colors"
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-red-400">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-violet-300 mb-1.5">
                  Horas trabajadas
                </label>
                <input
                  {...register('hours', { valueAsNumber: true })}
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  placeholder="8"
                  className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white placeholder-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-colors"
                />
                {errors.hours && (
                  <p className="mt-1 text-xs text-red-400">{errors.hours.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-violet-300 mb-1.5">
                Recurso asociado{' '}
                <span className="text-violet-600 font-normal">(opcional)</span>
              </label>
              <select
                {...register('resource_id')}
                className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-colors"
              >
                <option value="">Sin recurso específico</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-violet-300 mb-1.5">
                Notas <span className="text-violet-600 font-normal">(opcional)</span>
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Describe brevemente el trabajo realizado..."
                className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white placeholder-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm shadow-lg shadow-violet-600/20"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar horas'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
