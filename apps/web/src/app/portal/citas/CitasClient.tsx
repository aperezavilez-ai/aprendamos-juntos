'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDaysIcon,
  BellIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { format, isAfter, isBefore, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { confirmarCitaAction } from '../actions'
import PacienteAvatar from '@/components/portal/PacienteAvatar'

type Props = {
  paciente: any
  citas: any[]
  sinPerfil?: boolean
}

export default function CitasClient({ paciente, citas: initialCitas, sinPerfil }: Props) {
  const [citas, setCitas] = useState(initialCitas)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (sinPerfil) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-neutral-600">
          No se encontró tu perfil de familiar. Contacta a la clínica.
        </p>
      </div>
    )
  }

  const confirmarCita = (citaId: string) => {
    startTransition(async () => {
      const result = await confirmarCitaAction(citaId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Cita confirmada')
      setCitas(prev =>
        prev.map(c =>
          c.id === citaId
            ? { ...c, estado: 'confirmada', confirmada_por_padre: true }
            : c
        )
      )
      router.refresh()
    })
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
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada',
  }

  return (
    <div className="space-y-5">
      {paciente && (
        <div className="card p-4 flex items-center gap-4">
          <PacienteAvatar paciente={paciente} size="sm" />
          <div>
            <p className="font-bold text-neutral-900">{paciente.nombre} {paciente.apellidos}</p>
            {(paciente.motivo_consulta || paciente.diagnosticos?.[0]) && (
              <p className="text-xs text-neutral-500 mt-0.5">
                {paciente.motivo_consulta || paciente.diagnosticos?.[0]}
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-neutral-800 mb-3">Próximas citas</h2>
        {citasProximas.length === 0 ? (
          <div className="card p-6 text-center">
            <CalendarDaysIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Sin citas próximas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {citasProximas.map(cita => {
              const esPronto = isBefore(new Date(cita.fecha_inicio), addHours(ahora, 48))
              const necesitaConfirmar = cita.estado === 'programada' && !cita.confirmada_por_padre

              return (
                <div key={cita.id} className={`card p-4 ${esPronto ? 'border-primary-200 bg-primary-50/30' : ''}`}>
                  {esPronto && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <BellIcon className="w-3.5 h-3.5 text-primary-500" />
                      <p className="text-xs font-semibold text-primary-600">Próximamente</p>
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
                          {cita.terapeuta.nombre} {cita.terapeuta.apellidos}
                        </p>
                      )}
                    </div>
                    <span className={`badge shrink-0 ${estadoColor[cita.estado] || 'badge-neutral'}`}>
                      {estadoLabel[cita.estado] || cita.estado}
                    </span>
                  </div>
                  {necesitaConfirmar && (
                    <button
                      onClick={() => confirmarCita(cita.id)}
                      disabled={pending}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
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

      {citasPasadas.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-neutral-800 mb-3">Historial reciente</h2>
          <div className="card overflow-hidden divide-y divide-neutral-100">
            {citasPasadas.map(cita => (
              <div key={cita.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                  <p className="text-xs font-bold text-neutral-700">{format(new Date(cita.fecha_inicio), 'd')}</p>
                  <p className="text-2xs text-neutral-400 uppercase">{format(new Date(cita.fecha_inicio), 'MMM', { locale: es })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-800 font-medium">
                    {format(new Date(cita.fecha_inicio), 'HH:mm')}
                    {cita.terapeuta && ` · ${cita.terapeuta.nombre}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
