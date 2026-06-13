'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDaysIcon, ChatBubbleLeftRightIcon, DocumentTextIcon,
  UserCircleIcon, PaperAirplaneIcon, ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/citas', label: 'Citas', icon: CalendarDaysIcon },
  { href: '/reportes', label: 'Reportes', icon: DocumentTextIcon },
  { href: '/chat', label: 'Mensajes', icon: ChatBubbleLeftRightIcon },
  { href: '/perfil', label: 'Perfil', icon: UserCircleIcon },
]

export default function ChatPortalPage() {
  const [mensajes, setMensajes] = useState<any[]>([])
  const [mensaje, setMensaje] = useState('')
  const [pacienteId, setPacienteId] = useState('')
  const [familiarId, setFamiliarId] = useState('')
  const [clinicaId, setClinicaId] = useState('')
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => { fetchData() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    try {
      const { data: familiar } = await supabase
        .from('familiares')
        .select(`id, paciente_id, pacientes(clinica_id)`)
        .eq('email', session.user.email)
        .single()

      if (!familiar) return

      setPacienteId(familiar.paciente_id)
      setFamiliarId(familiar.id)
      setClinicaId((familiar as any).pacientes?.clinica_id)

      // Fetch mensajes
      const { data } = await supabase
        .from('chat_mensajes')
        .select('*')
        .eq('paciente_id', familiar.paciente_id)
        .order('created_at')
        .limit(100)

      setMensajes(data || [])

      // Marcar mensajes del terapeuta como leídos
      await supabase
        .from('chat_mensajes')
        .update({ leido: true, leido_at: new Date().toISOString() })
        .eq('paciente_id', familiar.paciente_id)
        .eq('tipo_remitente', 'terapeuta')
        .eq('leido', false)

    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const enviarMensaje = async () => {
    if (!mensaje.trim() || !pacienteId || !familiarId) return
    const texto = mensaje
    setMensaje('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase.from('chat_mensajes').insert({
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        remitente_id: familiarId,
        tipo_remitente: 'padre',
        contenido: texto,
        leido: false,
      }).select().single()

      if (error) throw error
      setMensajes(prev => [...prev, data])
    } catch { toast.error('Error al enviar'); setMensaje(texto) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col pb-16">
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 pt-10 pb-5 shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-xs font-medium">Portal Familias</p>
            <h1 className="text-lg font-bold mt-0.5">Mensajes</h1>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl bg-white/10">
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto max-w-lg w-full mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="text-center py-16">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500 font-medium">Sin mensajes aún</p>
            <p className="text-xs text-neutral-400 mt-1">Escribe un mensaje a tu terapeuta</p>
          </div>
        ) : (
          mensajes.map(msg => {
            const esPadre = msg.tipo_remitente === 'padre'
            return (
              <div key={msg.id} className={`flex ${esPadre ? 'justify-end' : 'justify-start'}`}>
                {!esPadre && (
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 mr-2 shrink-0 mt-auto mb-1">T</div>
                )}
                <div className={`max-w-xs ${esPadre ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-2.5 ${esPadre ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-white text-neutral-800 rounded-bl-sm shadow-sm border border-neutral-100'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                  </div>
                  <p className="text-2xs text-neutral-400 mt-1 px-1">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                    {esPadre && msg.leido && ' · Leído'}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="max-w-lg w-full mx-auto px-4 pb-20 shrink-0">
        <div className="flex gap-2 bg-white rounded-2xl border border-neutral-200 shadow-sm p-2">
          <textarea
            className="flex-1 resize-none text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent px-2 py-1.5 focus:outline-none"
            rows={1}
            placeholder="Escribe un mensaje..."
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviarMensaje()
              }
            }}
          />
          <button
            onClick={enviarMensaje}
            disabled={!mensaje.trim()}
            className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0 self-end"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 flex">
        {NAV.map(item => {
          const isActive = '/chat' === item.href
          return (
            <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium ${isActive ? 'text-violet-600' : 'text-neutral-400'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
