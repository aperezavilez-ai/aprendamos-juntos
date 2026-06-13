'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDaysIcon, ChatBubbleLeftRightIcon, DocumentTextIcon,
  UserCircleIcon, SparklesIcon, ArrowRightStartOnRectangleIcon,
  ChevronDownIcon, ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const NAV = [
  { href: '/citas', label: 'Citas', icon: CalendarDaysIcon },
  { href: '/reportes', label: 'Reportes', icon: DocumentTextIcon },
  { href: '/chat', label: 'Mensajes', icon: ChatBubbleLeftRightIcon },
  { href: '/perfil', label: 'Perfil', icon: UserCircleIcon },
]

const TIPO_LABEL: Record<string, string> = {
  reporte: 'Reporte de progreso',
  resumen: 'Resumen clínico',
  tareas: 'Plan de actividades',
  analisis: 'Análisis clínico',
  patrones: 'Patrones detectados',
}

export default function ReportesPortalPage() {
  const [reportes, setReportes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    try {
      const { data: familiar } = await supabase
        .from('familiares')
        .select('paciente_id')
        .eq('email', session.user.email)
        .single()

      if (!familiar) return

      const { data } = await supabase
        .from('reportes_ia')
        .select('*')
        .eq('paciente_id', familiar.paciente_id)
        .eq('enviado_a_padres', true)
        .order('created_at', { ascending: false })

      setReportes(data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-xs font-medium">Portal Familias</p>
            <h1 className="text-lg font-bold mt-0.5">Reportes de progreso</h1>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl bg-white/10">
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 -mt-4 space-y-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-neutral-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-neutral-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : reportes.length === 0 ? (
          <div className="card p-8 text-center mt-8">
            <SparklesIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-600">Sin reportes disponibles</p>
            <p className="text-xs text-neutral-400 mt-1">El terapeuta te enviará reportes de progreso aquí</p>
          </div>
        ) : (
          reportes.map(rep => (
            <div key={rep.id} className="card overflow-hidden">
              <button
                onClick={() => setAbierto(abierto === rep.id ? null : rep.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {TIPO_LABEL[rep.tipo] || rep.tipo}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {format(new Date(rep.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                {abierto === rep.id ? (
                  <ChevronUpIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
              </button>

              {abierto === rep.id && (
                <div className="px-4 pb-4 border-t border-neutral-100">
                  <div className="prose prose-sm max-w-none pt-4 text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {rep.contenido}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 flex">
        {NAV.map(item => (
          <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium ${'/reportes' === item.href ? 'text-violet-600' : 'text-neutral-400'}`}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
