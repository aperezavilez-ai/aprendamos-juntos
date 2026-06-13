// Supabase Edge Function: send-notifications
// Deploy: supabase functions deploy send-notifications
// Trigger: Via Supabase Database Webhooks or cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

interface NotificacionPayload {
  tipo: 'cita' | 'mensaje' | 'pago' | 'sistema'
  usuario_ids?: string[]
  clinica_id?: string
  titulo: string
  mensaje: string
  url_accion?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload: NotificacionPayload = await req.json()

    let usuarioIds = payload.usuario_ids || []

    // Si no se especifican usuarios pero sí clínica, notificar a todos los de la clínica
    if (!usuarioIds.length && payload.clinica_id) {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id')
        .eq('clinica_id', payload.clinica_id)
        .eq('activo', true)
      usuarioIds = (usuarios || []).map((u: any) => u.id)
    }

    if (!usuarioIds.length) {
      return new Response(JSON.stringify({ error: 'No hay usuarios para notificar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Crear notificaciones en BD
    const notificaciones = usuarioIds.map((uid: string) => ({
      usuario_id: uid,
      clinica_id: payload.clinica_id,
      tipo: payload.tipo,
      titulo: payload.titulo,
      mensaje: payload.mensaje,
      url_accion: payload.url_accion || null,
      leida: false,
    }))

    const { data, error } = await supabase
      .from('notificaciones')
      .insert(notificaciones)
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        notificaciones_creadas: data?.length || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err: any) {
    console.error('Error en send-notifications:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
