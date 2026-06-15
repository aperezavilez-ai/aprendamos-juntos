import { requirePortalSession } from '@/lib/portal-server'
import { fetchPortalCitas } from '@/lib/portal-data'
import CitasClient from './CitasClient'

export default async function PortalCitasPage() {
  const ctx = await requirePortalSession()
  const paciente = ctx.familiar.paciente

  if (!paciente) {
    return <CitasClient paciente={null} citas={[]} sinPerfil />
  }

  const citas = await fetchPortalCitas(ctx.familiar.paciente_id)
  return <CitasClient paciente={paciente} citas={citas} />
}
