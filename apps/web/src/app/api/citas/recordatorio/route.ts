import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'

// Llamar con: POST /api/citas/recordatorio
// Configurar cron en Vercel, Railway, o Supabase Edge Functions
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Verificar token de autorización para el cron
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const resultados = {
    procesados: 0,
    enviados: 0,
    errores: 0,
    clinicas: [] as string[],
  }

  try {
    // Obtener todas las clínicas activas con WhatsApp configurado
    const { data: configs } = await supabase
      .from('config_whatsapp')
      .select('*, clinica:clinicas(id, nombre)')
      .eq('activo', true)

    for (const config of configs || []) {
      const clinicaId = config.clinica_id

      // Calcular rangos de tiempo
      const ahora = new Date()
      const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
      const en25h = new Date(ahora.getTime() + 25 * 60 * 60 * 1000)
      const en1h = new Date(ahora.getTime() + 60 * 60 * 1000)
      const en65m = new Date(ahora.getTime() + 65 * 60 * 1000)

      // Citas para recordatorio de 24h
      const { data: citas24h } = await supabase
        .from('citas')
        .select(`
          id, fecha_inicio, duracion_minutos, tipo,
          paciente:pacientes(nombre, apellidos, familiares(nombre, telefono, tiene_acceso_portal)),
          terapeuta:usuarios(nombre)
        `)
        .eq('clinica_id', clinicaId)
        .in('estado', ['programada', 'confirmada'])
        .eq('recordatorio_24h', false)
        .gte('fecha_inicio', en24h.toISOString())
        .lte('fecha_inicio', en25h.toISOString())

      for (const cita of citas24h || []) {
        const paciente = (cita as any).paciente
        const familiar = paciente?.familiares?.find((f: any) => f.telefono)

        if (!familiar?.telefono) continue

        const fechaHora = new Date(cita.fecha_inicio).toLocaleString('es-MX', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })

        const mensaje = `👋 Hola ${familiar.nombre}! Les recordamos la cita de *${paciente.nombre}* mañana ${fechaHora} con ${(cita as any).terapeuta?.nombre}. ¿Confirman asistencia? Responde *SÍ* o *NO*.`

        try {
          const waResp = await fetch(`${WHATSAPP_API_URL}/${config.phone_number_id}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.access_token}`,
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: familiar.telefono.replace(/\D/g, ''),
              type: 'text',
              text: { body: mensaje },
            }),
          })

          if (waResp.ok) {
            const waData = await waResp.json()
            await supabase
              .from('citas')
              .update({ recordatorio_24h: true })
              .eq('id', cita.id)

            await supabase.from('mensajes_whatsapp').insert({
              clinica_id: clinicaId,
              paciente_id: paciente.id,
              telefono_destino: familiar.telefono,
              tipo_mensaje: 'recordatorio',
              contenido: mensaje,
              wa_message_id: waData.messages?.[0]?.id,
              estado: 'enviado',
            })

            resultados.enviados++
          }
        } catch (err) {
          console.error(`Error enviando recordatorio para cita ${cita.id}:`, err)
          resultados.errores++
        }

        resultados.procesados++
      }

      resultados.clinicas.push((config as any).clinica?.nombre || clinicaId)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...resultados,
    })

  } catch (error: any) {
    console.error('Error en cron de recordatorios:', error)
    return NextResponse.json(
      { error: 'Error procesando recordatorios', details: error?.message },
      { status: 500 }
    )
  }
}
