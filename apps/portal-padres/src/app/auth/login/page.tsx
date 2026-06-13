'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState<'login' | 'reset'>('login')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { toast.error('Email o contraseña incorrectos'); return }

      // Verificar que el usuario tiene rol de padre
      const { data: { session } } = await supabase.auth.getSession()
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('rol, activo')
        .eq('id', session!.user.id)
        .single()

      if (!usuario) {
        // También puede ser un familiar sin cuenta de usuario — redirigir igual
        router.push('/citas')
        return
      }

      if (!usuario.activo) {
        await supabase.auth.signOut()
        toast.error('Tu cuenta no está activa. Contacta a la clínica.')
        return
      }

      router.push('/citas')
    } catch { toast.error('Error al iniciar sesión') } finally { setLoading(false) }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/nueva-contrasena`,
      })
      toast.success('Revisa tu correo para restablecer tu contraseña')
      setModo('login')
    } catch { toast.error('Error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">👨‍👩‍👧</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Portal Familias</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {modo === 'login' ? 'Sigue el progreso de tu hijo/a' : 'Restablece tu contraseña'}
          </p>
        </div>

        <div className="card p-6 shadow-lg">
          {modo === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Correo electrónico</label>
                <input
                  type="email"
                  className="input"
                  placeholder="mama@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Contraseña</label>
                  <button type="button" onClick={() => setModo('reset')} className="text-xs text-violet-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
                {loading ? 'Ingresando...' : 'Ingresar al portal'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label">Tu correo electrónico</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <button type="button" onClick={() => setModo('login')} className="btn-secondary w-full justify-center">
                Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Tu información está protegida y es confidencial
        </p>
      </div>
    </div>
  )
}
