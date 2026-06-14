import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RUTAS_PUBLICAS = ['/auth/login', '/auth/nueva-contrasena', '/auth/registro', '/portal']

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Rutas de API y assets: dejar pasar siempre
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Rutas públicas: dejar pasar siempre
  const esPublica = RUTAS_PUBLICAS.some(r => pathname.startsWith(r))
  if (esPublica) return NextResponse.next()

  // Verificar si existe una cookie de sesión de Supabase (sin llamadas externas)
  const hasSbCookie = Array.from(req.cookies.getAll()).some(
    c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  if (!hasSbCookie) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}
