import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RUTAS_PUBLICAS = ['/auth/login', '/auth/nueva-contrasena', '/auth/registro', '/portal']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Rutas de API: dejar pasar siempre
  if (pathname.startsWith('/api/')) return res

  // Rutas públicas: dejar pasar
  const esPublica = RUTAS_PUBLICAS.some(r => pathname.startsWith(r))
  if (esPublica) {
    // Si ya tiene sesión y va a login, redirigir al dashboard
    if (session && pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // Rutas protegidas: verificar sesión
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}
