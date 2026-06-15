import { requirePortalSession } from '@/lib/portal-server'
import { fetchPortalMensajes } from '@/lib/portal-data'
import MensajesClient from './MensajesClient'

export default async function PortalMensajesPage() {
  const ctx = await requirePortalSession()
  const mensajes = await fetchPortalMensajes(ctx.familiar.paciente_id)
  return <MensajesClient initialMensajes={mensajes} />
}
