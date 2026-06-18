import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle, Trash2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'

const schema = z.object({
  full_name: z.string().min(2, 'Nombre demasiado corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

type Employee = { id: string; full_name: string; created_at: string }

export default function CreateEmployee() {
  const [showPass, setShowPass] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function fetchEmployees() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('role', 'empleado')
      .order('created_at', { ascending: false })
    setEmployees(data ?? [])
    setLoadingList(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  async function onSubmit(data: FormData) {
    setServerError('')
    const res = await fetch('/api/create-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setServerError(json.error ?? 'Error al crear empleado'); return }
    setSuccess(true)
    reset()
    setTimeout(() => setSuccess(false), 3000)
    fetchEmployees()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    // Elimina el perfil (cascade elimina el usuario de auth)
    await supabase.from('profiles').delete().eq('id', id)
    setEmployees(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Empleados</h1>
          <p className="text-[#6e6e73] text-sm mt-1">Crea y gestiona los empleados de tu equipo</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 mb-5">
          <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">Nuevo empleado</h2>

          {success && (
            <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle size={15} />
              Empleado creado correctamente
            </div>
          )}

          {serverError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Nombre completo</label>
                <input
                  {...register('full_name')}
                  placeholder="Juan García"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                />
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="juan@ejemplo.com"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Contraseña temporal</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-4 py-2.5 pr-11 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e6e73] hover:text-[#1d1d1f]">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0066cc] hover:bg-[#0077ed] disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              {isSubmitting ? 'Creando...' : 'Crear empleado'}
            </button>
          </form>
        </div>

        {/* Employee list */}
        <div>
          <h2 className="text-sm font-semibold text-[#1d1d1f] mb-3">Empleados registrados</h2>
          {loadingList ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-14 animate-pulse" />)}
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              <Users size={28} className="text-[#d2d2d7] mx-auto mb-2" />
              <p className="text-[#6e6e73] text-sm">Sin empleados aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map(emp => (
                <div key={emp.id} className="bg-white rounded-2xl px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center text-[#0066cc] font-semibold text-sm shrink-0">
                    {emp.full_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1d1d1f]">{emp.full_name}</p>
                    <p className="text-xs text-[#6e6e73]">
                      Alta el {new Date(emp.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    disabled={deleting === emp.id}
                    className="p-2 text-[#6e6e73] hover:text-[#ff3b30] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
