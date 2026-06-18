import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

const schema = z.object({
  full_name: z.string().min(2, 'Nombre demasiado corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['jefe', 'empleado']),
})

type FormData = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'empleado' } })

  async function onSubmit(data: FormData) {
    setServerError('')
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) { setServerError(error.message); return }

    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: data.full_name,
        role: data.role,
      })
      if (profileError) { setServerError('Error al crear perfil.'); return }
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex w-1/2 bg-black flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0066cc] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-semibold text-white text-xl tracking-tight">Vizzio</span>
        </div>
        <div>
          <p className="text-4xl font-semibold text-white leading-snug tracking-tight">
            Empieza hoy.<br />Sin complicaciones.
          </p>
          <p className="text-[#86868b] mt-4 text-base">
            Crea tu cuenta y gestiona tu equipo en minutos.
          </p>
        </div>
        <p className="text-[#48484a] text-sm">© 2025 Vizzio</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 bg-[#f5f5f7] py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-7 h-7 rounded-lg bg-[#0066cc] flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-semibold text-[#1d1d1f] text-lg tracking-tight">Vizzio</span>
          </div>

          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight mb-1">Crear cuenta</h1>
          <p className="text-[#6e6e73] text-sm mb-8">Solo tardas un minuto</p>

          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Nombre completo</label>
              <input
                {...register('full_name')}
                placeholder="Juan García"
                className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="nombre@ejemplo.com"
                className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-2.5 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#d2d2d7] rounded-xl px-4 py-2.5 pr-11 text-[#1d1d1f] placeholder-[#6e6e73] text-sm focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e6e73] hover:text-[#1d1d1f]">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d1d1f] mb-1.5">Rol</label>
              <div className="grid grid-cols-2 gap-2">
                {(['empleado', 'jefe'] as const).map((role) => (
                  <label key={role} className="cursor-pointer">
                    <input {...register('role')} type="radio" value={role} className="peer sr-only" />
                    <div className="text-center py-2.5 rounded-xl border border-[#d2d2d7] bg-white text-sm font-medium text-[#6e6e73] transition-all peer-checked:border-[#0066cc] peer-checked:bg-[#0066cc]/5 peer-checked:text-[#0066cc]">
                      {role === 'jefe' ? 'Jefe' : 'Empleado'}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0066cc] hover:bg-[#0077ed] disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors mt-2"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6e6e73]">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#0066cc] hover:text-[#0077ed] font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
