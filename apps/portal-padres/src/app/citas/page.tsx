'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDaysIcon, ChatBubbleLeftRightIcon, DocumentTextIcon,
  UserCircleIcon, ArrowRightStartOnRectangleIcon, BellIcon,
  ClockIcon, MapPinIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { format, isAfter, isBefore, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/citas', label: 'Citas', icon: CalendarDaysIcon },
  { href: '/reportes', label: 'Reportes', icon: DocumentTextIcon },
  { href: '/chat', label: 'Mensajes', icon: ChatBubbleLeftRightIcon },
  { href: '/perfil', label: 'Perfil', icon: UserCircleIcon },
]

function PortalLayout({ children, active }: { children: React.ReactNode; active: string }) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-xs font-medium">Portal Familias</p>
            <h1 className="text-lg font-bold mt-0.5">TerapiaOS</h1>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 -mt-4">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 flex">
        {NAV.map(item => {
          const isActive = active === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-violet-600' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function CitasPortalPage() {
  const [citas, setCitas] = useState<any[]>([])
  const [paciente, setPaciente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    try {
      // Buscar familiar por email
      const { data: familiar } = await supabase
        .from('familiares')
        .select(`*, paciente:pacientes(id, nombre, apellidos, diagnostico_principal, foto_url)`)
        .eq('email', session.user.email)
        .single()

      if (!familiar) {
        toast.error('No se encontró tu perfil de familiar. Contacta a la clínica.')
        return
      }

      setPaciente(familiar.paciente)

      // Citas del paciente (próximas y recientes)
      const { data: citasData } = await supabase
        .from('citas')
        .select(`*, terapeuta:usuarios(nombre, apellidos)`)
        .eq('paciente_id', familiar.paciente.id)
        .order('fecha_inicio', { ascending: false })
        .limit(20)

      setCitas(citasData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const confirmarCita = async (citaId: string) => {
    try {
      await supabase.from('citas').update({ confirmada_por_padre: true, estado: 'confirmada' }).eq('id', citaId)
      toast.success('¡Cita confirmada!')
      fetchData()
    } catch { toast.error('Error al confirmar') }
  }

  const ahora = new Date()
  const citasProximas = citas.filter(c => isAfter(new Date(c.fecha_inicio), ahora) && c.estado !== 'cancelada')
  const citasPasadas = citas.filter(c => isBefore(new Date(c.fecha_inicio), ahora) || c.estado === 'cancelada').slice(0, 5)

  const estadoColor: Record<string, string> = {
    programada: 'badge-warning',
    confirmada: 'badge-success',
    completada: 'badge-primary',
    cancelada: 'badge-neutral',
  }
  const estadoLabel: Record<string, string> = {
    programada: 'Pendiente confirmar',
    confirmada: 'Confirmada ✓',
    completada: 'Completada',
    cancelada: 'Cancelada',
  }

  return (
    <PortalLayout active="/citas">
      {loading ? (
        <div className="space-y-3 pt-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-neutral-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5 pt-4">
          {/* Tarjeta del paciente */}
          {paciente && (
            <div className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl font-bold text-violet-600 shrink-0">
                {paciente.nombre[0]}
              </div>
              <div>
                <p className="font-bold text-neutral-900">{paciente.nombre} {paciente.apellidos}</p>
                {paciente.diagnostico_principal && (
                  <p className="text-xs text-neutral-500 mt-0.5">{paciente.diagnostico_principal}</p>
                )}
              </div>
            </div>
          )}

          {/* Próximas citas */}
          <div>
            <h2 className="text-sm font-bold text-neutral-800 mb-3">Próximas citas</h2>
            {citasProximas.length === 0 ? (
              <div className="card p-6 text-center">
                <CalendarDaysIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Sin citas próximas programadas</p>
                <p className="text-xs text-neutral-400 mt-1">La clínica te avisará cuando se agende una nueva cita</p>
              </div>
            ) : (
              <div className="space-y-3">
                {citasProximas.map(cita => {
                  const esMañana = isBefore(new Date(cita.fecha_inicio), addHours(ahora, 48))
                  const necesitaConfirmar = cita.estado === 'programada' && !cita.confirmada_por_padre

                  return (
                    <div key={cita.id} className={`card p-4 ${esMañana ? 'border-violet-200 bg-violet-50/30' : ''}`}>
                      {esMañana && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <BellIcon className="w-3.5 h-3.5 text-violet-500" />
                          <p className="text-xs font-semibold text-violet-600">Próximamente</p>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900 text-sm">
                            {format(new Date(cita.fecha_inicio), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {format(new Date(cita.fecha_inicio), 'HH:mm')}
                              {cita.duracion_minutos && ` · ${cita.duracion_minutos} min`}
                            </span>
                            {cita.sala && (
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="w-3.5 h-3.5" />
                                {cita.sala}
                              </span>
                            )}
                          </div>
                          {cita.terapeuta && (
                            <p className="text-xs text-neutral-500 mt-1">
                              👩‍⚕️ {cita.terapeuta.nombre} {cita.terapeuta.apellidos}
                            </p>
                          )}
                        </div>
                        <span className={`badge shrink-0 ${estadoColor[cita.estado] || 'badge-neutral'}`}>
                          {estadoLabel[cita.estado] || cita.estado}
                        </span>
                      </div>

                      {/* Botón confirmar */}
                      {necesitaConfirmar && (
                        <button
                          onClick={() => confirmarCita(cita.id)}
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          Confirmar asistencia
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Historial */}
          {citasPasadas.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-neutral-800 mb-3">Historial reciente</h2>
              <div className="card overflow-hidden">
                <div className="divide-y divide-neutral-100">
                  {citasPasadas.map(cita => (
                    <div key={cita.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <p className="text-xs font-bold text-neutral-700">{format(new Date(cita.fecha_inicio), 'd')}</p>
                        <p className="text-2xs text-neutral-400 uppercase">{format(new Date(cita.fecha_inicio), 'MMM', { locale: es })}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-800 font-medium truncate">
                          {format(new Date(cita.fecha_inicio), 'HH:mm')}
                          {cita.terapeuta && ` · ${cita.terapeuta.nombre}`}
                        </p>
                        <p className="text-xs text-neutral-400 capitalize truncate">
                          {cita.tipo?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <span className={`badge text-2xs shrink-0 ${estadoColor[cita.estado] || 'badge-neutral'}`}>
                        {cita.estado === 'completada' ? '✓' : cita.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  )
}
