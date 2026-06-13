import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificación del webhook (GET - Meta lo llama al configurar)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WhatsApp webhook verificado')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verificación fallida' }, { status: 403 })
}

// Recepción de mensajes entrantes y actualizaciones de estado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' })
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value

        // Mensajes entrantes (respuestas de padres)
        if (value.messages) {
          for (const message of value.messages) {
            const from = message.from
            const text = message.text?.body || ''
            const waId = message.id

            // Buscar el familiar por teléfono
            const { data: familiar } = await supabase
              .from('familiares')
              .select('id, paciente_id, pacientes(clinica_id)')
              .eq('telefono', from)
              .maybeSingle()

            if (familiar) {
              // Actualizar mensaje existente con la respuesta (si fue recordatorio)
              await supabase
                .from('mensajes_whatsapp')
                .update({ respuesta: text, leido_at: new Date().toISOString() })
                .eq('telefono_destino', from)
                .is('leido_at', null)
                .order('created_at', { ascending: false })
                .limit(1)

              // Si responde SÍ/SI a un recordatorio, confirmar cita
              if (/^(si|sí|yes|s|1)$/i.test(text.trim())) {
                await supabase
                  .from('citas')
                  .update({ confirmada_por_padre: true, estado: 'confirmada' })
                  .eq('paciente_id', familiar.paciente_id)
                  .eq('confirmada_por_padre', false)
                  .gte('fecha_inicio', new Date().toISOString())
                  .order('fecha_inicio')
                  .limit(1)
              }

              // Crear notificación para el terapeuta
              const clinicaId = (familiar as any).pacientes?.clinica_id
              if (clinicaId) {
                const { data: terapeutas } = await supabase
                  .from('usuarios')
                  .select('id')
                  .eq('clinica_id', clinicaId)
                  .in('rol', ['terapeuta', 'recepcion'])

                for (const t of terapeutas || []) {
                  await supabase.from('notificaciones').insert({
                    usuario_id: t.id,
                    clinica_id: clinicaId,
                    tipo: 'mensaje',
                    titulo: 'Respuesta de WhatsApp',
                    mensaje: `Respuesta recibida: "${text.substring(0, 100)}"`,
                    url_accion: '/mensajes',
                  })
                }
              }
            }
          }
        }

        // Actualizaciones de estado de mensajes enviados
        if (value.statuses) {
          for (const status of value.statuses) {
            const { id: waId, status: nuevoEstado } = status
            const estadoMap: Record<string, string> = {
              sent: 'enviado',
              delivered: 'entregado',
              read: 'leido',
              failed: 'fallido',
            }

            await supabase
              .from('mensajes_whatsapp')
              .update({ estado: estadoMap[nuevoEstado] || nuevoEstado })
              .eq('wa_message_id', waId)
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('Error en webhook WhatsApp:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
