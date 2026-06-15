import { requirePortalSession } from '@/lib/portal-server'
import PerfilClient from './PerfilClient'

export default async function PortalPerfilPage() {
  const ctx = await requirePortalSession()
  return (
    <PerfilClient
      data={{
        usuario: ctx.usuario,
        familiar: ctx.familiar,
      }}
    />
  )
}
