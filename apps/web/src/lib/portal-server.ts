import { redirect } from 'next/navigation'
import { getPortalSession } from '@/lib/portal-auth'

export async function requirePortalSession() {
  const ctx = await getPortalSession()
  if (!ctx) redirect('/auth/login')
  return ctx
}
