import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError('Credenciales incorrectas. Verifica tu email y contraseña.')
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08060f] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-600/30">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">VIZZIO</h1>
          <p className="text-violet-400 text-sm mt-1">Gestión de Recursos</p>
        </div>

        <div className="bg-[#0f0c1e] rounded-2xl border border-violet-900/40 p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar sesión</h2>

          {serverError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-violet-300 mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="tu@email.com"
                className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 text-white placeholder-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-colors"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-violet-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-[#16122a] border border-violet-900/50 rounded-lg px-4 py-2.5 pr-11 text-white placeholder-violet-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 hover:text-violet-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm shadow-lg shadow-violet-600/20"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-violet-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
