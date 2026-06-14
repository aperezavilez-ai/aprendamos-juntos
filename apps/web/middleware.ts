import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RUTAS_PUBLICAS = ['/auth/login', '/auth/nueva-contrasena', '/auth/registro', '/portal']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Rutas de API: dejar pasar siempre
  if (pathname.startsWith('/api/')) return res

  // Rutas públicas: dejar pasar sin verificar sesión
  const esPublica = RUTAS_PUBLICAS.some(r => pathname.startsWith(r))
  if (esPublica) return res

  // Si Supabase no está configurado correctamente, redirigir al login
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Si tiene sesión y va a login, redirigir al dashboard
    if (session && pathname === '/auth/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}
