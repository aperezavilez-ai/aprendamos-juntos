'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { enviarMensajeAction } from '../actions'

type Props = {
  initialMensajes: any[]
}

export default function MensajesClient({ initialMensajes }: Props) {
  const [mensajes, setMensajes] = useState(initialMensajes)
  const [mensaje, setMensaje] = useState('')
  const [pending, startTransition] = useTransition()
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  const enviarMensaje = () => {
    if (!mensaje.trim() || pending) return
    const texto = mensaje
    setMensaje('')

    startTransition(async () => {
      const result = await enviarMensajeAction(texto)
      if (result.error || !result.mensaje) {
        toast.error(result.error || 'Error al enviar')
        setMensaje(texto)
        return
      }
      setMensajes(prev => [...prev, result.mensaje])
    })
  }

  return (
    <>
      <div className="space-y-3 min-h-[50vh] pb-4">
        {mensajes.length === 0 ? (
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
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 mr-2 shrink-0 mt-auto mb-1">
                    T
                  </div>
                )}
                <div className={`max-w-[85%] flex flex-col ${esPadre ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    esPadre
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white text-neutral-800 rounded-bl-sm shadow-sm border border-neutral-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                  </div>
                  <p className="text-2xs text-neutral-400 mt-1 px-1">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div
        className="fixed left-0 right-0 z-[90] px-4 pb-2 bg-neutral-50/95 backdrop-blur-sm"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-lg mx-auto flex gap-2 bg-white rounded-2xl border border-neutral-200 shadow-sm p-2">
          <textarea
            className="flex-1 resize-none text-sm bg-transparent px-2 py-1.5 focus:outline-none"
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
            type="button"
            onClick={enviarMensaje}
            disabled={!mensaje.trim() || pending}
            className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0 self-end"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
