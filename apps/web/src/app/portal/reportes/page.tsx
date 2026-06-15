import { requirePortalSession } from '@/lib/portal-server'
import { fetchPortalReportes } from '@/lib/portal-data'
import ReportesClient from './ReportesClient'

export default async function PortalReportesPage() {
  const ctx = await requirePortalSession()
  const { reportes, archivos } = await fetchPortalReportes(ctx.familiar.paciente_id)
  return <ReportesClient reportes={reportes} archivos={archivos} />
}
