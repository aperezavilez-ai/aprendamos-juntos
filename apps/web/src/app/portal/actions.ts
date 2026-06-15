'use server'

import { revalidatePath } from 'next/cache'
import { getPortalSession } from '@/lib/portal-auth'
import { confirmarPortalCita, enviarPortalMensaje } from '@/lib/portal-data'

export async function confirmarCitaAction(citaId: string) {
  const ctx = await getPortalSession()
  if (!ctx) return { error: 'No autorizado' }

  try {
    await confirmarPortalCita(citaId, ctx.familiar.paciente_id)
    revalidatePath('/portal/citas')
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al confirmar' }
  }
}

export async function enviarMensajeAction(contenido: string) {
  const ctx = await getPortalSession()
  if (!ctx) return { error: 'No autorizado' }

  const paciente = ctx.familiar.paciente as { clinica_id?: string } | null
  if (!paciente?.clinica_id) return { error: 'Paciente sin clínica' }
  if (!contenido?.trim()) return { error: 'Mensaje vacío' }

  try {
    const mensaje = await enviarPortalMensaje(
      ctx.familiar.paciente_id,
      paciente.clinica_id,
      ctx.user.id,
      contenido
    )
    revalidatePath('/portal/mensajes')
    return { mensaje }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al enviar' }
  }
}
