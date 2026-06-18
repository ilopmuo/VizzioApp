import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Package, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import type { Resource } from '../../types/database'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.string().min(1, 'Tipo requerido'),
  description: z.string().optional(),
  status: z.enum(['activo', 'inactivo', 'mantenimiento']),
})

type FormData = z.infer<typeof schema>

const RESOURCE_TYPES = [
  'Equipo de sonido',
  'Iluminación',
  'Cabina DJ',
  'Sala VIP',
  'Barra',
  'Seguridad',
  'Limpieza',
  'Otro',
]

const STATUS_LABELS: Record<Resource['status'], { label: string; color: string }> = {
  activo: { label: 'Activo', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-700/30' },
  inactivo: { label: 'Inactivo', color: 'text-zinc-400 bg-zinc-900/30 border-zinc-700/30' },
  mantenimiento: {
    label: 'Mantenimiento',
    color: 'text-amber-400 bg-amber-900/30 border-amber-700/30',
  },
}

export default function Resources() {
  const { profile } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'activo' },
  })

  async function fetchResources() {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    setResources(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
  }, [])

  function openNew() {
    setEditing(null)
    reset({ status: 'activo', name: '', type: '', description: '' })
    setShowForm(true)
  }

  function openEdit(resource: Resource) {
    setEditing(resource)
    reset({
      name: resource.name,
      type: resource.type,
      description: resource.description ?? '',
      status: resource.status,
    })
    setShowForm(true)
  }

  async function onSubmit(data: FormData) {
    if (!profile) return

    if (editing) {
      await supabase
        .from('resources')
        .update({
          name: data.name,
          type: data.type,
          description: data.description || null,
          status: data.status,
        })
        .eq('id', editing.id)
    } else {
      await supabase.from('resources').insert({
        name: data.name,
        type: data.type,
        description: data.description || null,
        status: data.status,
        created_by: profile.id,
      })
    }

    setShowForm(false)
    setEditing(null)
    fetchResources()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('resources').delete().eq('id', id)
    setResources((prev) => prev.filter((r) => r.id !== id))
    setDeleting(null)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Recursos</h1>
            <p className="text-violet-400 text-sm mt-1">
              {resources.length} recurso{resources.length !== 1 ? 's' : ''} registrados
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-violet-600/20"
          >
            <Plus size={16} />
            Nuevo recurso
          </button>
        </div>

        {/* Modal / Form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-md bg-[#0f0c1e] rounded-2xl border border-violet-900/40 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">
                  {editing ? 'Editar recurso' : 'Nuevo recurso'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-violet-600 hover:text-violet-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-violet-300 mb-1.5">
                    Nombre
                  </label>
                  <input
                    {...register('name')}
                    placeholder="Ej: Mesa DJ Principal"
                    className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white placeholder-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-300 mb-1.5">
                    Tipo
                  </label>
                  <select
                    {...register('type')}
                    className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  >
                    <option value="">Selecciona un tipo</option>
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-xs text-red-400">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-300 mb-1.5">
                    Estado
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['activo', 'inactivo', 'mantenimiento'] as const).map((s) => (
                      <label key={s} className="cursor-pointer">
                        <input
                          {...register('status')}
                          type="radio"
                          value={s}
                          className="peer sr-only"
                        />
                        <div className="text-center py-2 rounded-lg border border-violet-900/50 bg-[#16122a] text-xs font-medium text-violet-500 capitalize transition-all peer-checked:border-violet-500 peer-checked:bg-violet-600/20 peer-checked:text-violet-300">
                          {STATUS_LABELS[s].label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-300 mb-1.5">
                    Descripción <span className="text-violet-600 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    placeholder="Descripción del recurso..."
                    className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white placeholder-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-lg border border-violet-900/50 text-violet-400 hover:bg-violet-900/20 text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Check size={15} />
                    {editing ? 'Guardar cambios' : 'Crear recurso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0f0c1e] rounded-xl border border-violet-900/30 h-20 animate-pulse"
              />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-[#0f0c1e] rounded-2xl border border-violet-900/30 p-12 text-center">
            <Package size={40} className="text-violet-800 mx-auto mb-3" />
            <p className="text-violet-400 font-medium">Sin recursos</p>
            <p className="text-violet-600 text-sm mt-1">
              Crea el primer recurso con el botón de arriba.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => {
              const status = STATUS_LABELS[resource.status]
              return (
                <div
                  key={resource.id}
                  className="bg-[#0f0c1e] rounded-xl border border-violet-900/30 px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-600/10 border border-violet-800/30 flex items-center justify-center shrink-0">
                    <Package size={18} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{resource.name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-violet-500 mt-0.5">
                      {resource.type}
                      {resource.description ? ` — ${resource.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(resource)}
                      className="p-2 text-violet-600 hover:text-violet-400 hover:bg-violet-900/20 rounded-lg transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      disabled={deleting === resource.id}
                      className="p-2 text-violet-700 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
