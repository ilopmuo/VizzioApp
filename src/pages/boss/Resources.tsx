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

const RESOURCE_TYPES = ['Equipo de sonido', 'Iluminación', 'Cabina DJ', 'Sala VIP', 'Barra', 'Seguridad', 'Limpieza', 'Otro']

const STATUS_LABELS: Record<Resource['status'], { label: string; cls: string }> = {
  activo: { label: 'Activo', cls: 'text-green-700 bg-green-50 border-green-200' },
  inactivo: { label: 'Inactivo', cls: 'text-[#6e6e73] bg-[#f5f5f7] border-[#d2d2d7]' },
  mantenimiento: { label: 'Mantenimiento', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
}

export default function Resources() {
  const { profile } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'activo' },
  })

  async function fetchResources() {
    const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false })
    setResources(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchResources() }, [])

  function openNew() {
    setEditing(null)
    reset({ status: 'activo', name: '', type: '', description: '' })
    setShowForm(true)
  }

  function openEdit(r: Resource) {
    setEditing(r)
    reset({ name: r.name, type: r.type, description: r.description ?? '', status: r.status })
    setShowForm(true)
  }

  async function onSubmit(data: FormData) {
    if (!profile) return
    if (editing) {
      await supabase.from('resources').update({ name: data.name, type: data.type, description: data.description || null, status: data.status }).eq('id', editing.id)
    } else {
      await supabase.from('resources').insert({ name: data.name, type: data.type, description: data.description || null, status: data.status, created_by: profile.id })
    }
    setShowForm(false)
    setEditing(null)
    fetchResources()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('resources').delete().eq('id', id)
    setResources(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Recursos</h1>
            <p className="text-[#6e6e73] text-sm mt-1">{resources.length} recurso{resources.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0066cc] hover:bg-[#0077ed] text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={15} />
            Nuevo
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-[#1d1d1f]">{editing ? 'Editar recurso' : 'Nuevo recurso'}</h2>
                <button onClick={() => setShowForm(false)} className="text-[#6e6e73] hover:text-[#1d1d1f]"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Nombre</label>
                  <input
                    {...register('name')}
                    placeholder="Ej: Mesa DJ Principal"
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Tipo</label>
                  <select
                    {...register('type')}
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                  >
                    <option value="">Selecciona un tipo</option>
                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Estado</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['activo', 'inactivo', 'mantenimiento'] as const).map(s => (
                      <label key={s} className="cursor-pointer">
                        <input {...register('status')} type="radio" value={s} className="peer sr-only" />
                        <div className="text-center py-2 rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] text-xs font-medium text-[#6e6e73] capitalize transition-all peer-checked:border-[#0066cc] peer-checked:bg-[#0066cc]/5 peer-checked:text-[#0066cc]">
                          {STATUS_LABELS[s].label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Descripción <span className="text-[#6e6e73] font-normal">(opcional)</span></label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    placeholder="Descripción del recurso..."
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-[#d2d2d7] text-[#1d1d1f] text-sm font-medium hover:bg-[#f5f5f7] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0066cc] hover:bg-[#0077ed] disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                    <Check size={14} />
                    {editing ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)}</div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Package size={32} className="text-[#d2d2d7] mx-auto mb-3" />
            <p className="text-[#1d1d1f] font-medium">Sin recursos</p>
            <p className="text-[#6e6e73] text-sm mt-1">Crea el primero con el botón de arriba.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map((r) => {
              const s = STATUS_LABELS[r.status]
              return (
                <div key={r.id} className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center shrink-0">
                    <Package size={16} className="text-[#6e6e73]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1d1d1f]">{r.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-[#6e6e73] mt-0.5">{r.type}{r.description ? ` — ${r.description}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(r)} className="p-2 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="p-2 text-[#6e6e73] hover:text-[#ff3b30] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"><Trash2 size={14} /></button>
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
