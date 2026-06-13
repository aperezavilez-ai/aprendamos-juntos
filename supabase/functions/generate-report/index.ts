// Supabase Edge Function: generate-report
// Deploy: supabase functions deploy generate-report
// Trigger: Supabase Cron (1st of each month at 8am)
//   SELECT cron.schedule('monthly-reports', '0 8 1 * *', $$
//     SELECT net.http_post(
//       url := 'https://[project].supabase.co/functions/v1/generate-report',
//       headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
//     )
//   $$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

Deno.serve(async (req: Request) => {
  try {
    // Obtener todos los pacientes activos con sesiones en el último mes
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    inicioMes.setMonth(inicioMes.getMonth() - 1)

    const { data: sesionesRecientes } = await supabase
      .from('sesiones')
      .select('paciente_id, clinica_id')
      .gte('fecha', inicioMes.toISOString())
      .limit(500)

    // Pacientes únicos
    const pacientesUnicos = [...new Set((sesionesRecientes || []).map((s: any) => s.paciente_id))]

    let generados = 0
    let errores = 0

    for (const pacienteId of pacientesUnicos.slice(0, 20)) { // Límite por invocación
      try {
        const { data: paciente } = await supabase
          .from('pacientes')
          .select(`
            nombre, apellidos, diagnostico_principal,
            sesiones(fecha, actividades, avances, dificultades),
            planes_terapeuticos(titulo, objetivo_general, porcentaje_avance,
              objetivos(descripcion, estado, porcentaje))
          `)
          .eq('id', pacienteId)
          .single()

        if (!paciente) continue

        const sesiones = (paciente.sesiones || []).slice(-4)
        const plan = (paciente.planes_terapeuticos || [])[0]

        const contexto = `
PACIENTE: ${paciente.nombre} ${paciente.apellidos}
DIAGNÓSTICO: ${paciente.diagnostico_principal || 'No especificado'}
PLAN ACTIVO: ${plan?.titulo || 'Sin plan'}
AVANCE GENERAL: ${plan?.porcentaje_avance || 0}%
ÚLTIMAS SESIONES: ${sesiones.map((s: any) => `\n- ${s.fecha}: ${s.actividades?.slice(0, 100)} | Avances: ${s.avances?.slice(0, 100)}`).join('')}
`

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Genera un breve reporte mensual de progreso para los padres de este paciente de terapia ocupacional. 
Máximo 300 palabras. Tono cálido y motivador. Incluye: avances del mes, áreas de trabajo y 2-3 actividades para casa.

${contexto}`,
          }],
          system: 'Eres un terapeuta ocupacional experto. Genera reportes mensuales breves para padres.',
        })

        const contenido = response.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n')

        // Guardar reporte
        const clinicaId = (sesionesRecientes || []).find((s: any) => s.paciente_id === pacienteId)?.clinica_id

        await supabase.from('reportes_ia').insert({
          paciente_id: pacienteId,
          clinica_id: clinicaId,
          tipo: 'reporte',
          prompt: 'Reporte mensual automático',
          contenido,
          modelo: 'claude-haiku-4-5',
          tokens_usados: response.usage?.input_tokens + response.usage?.output_tokens,
          enviado_a_padres: false, // El terapeuta decide si enviarlo
        })

        generados++

        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err) {
        console.error(`Error generando reporte para paciente ${pacienteId}:`, err)
        errores++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        generados,
        errores,
        pacientes_procesados: pacientesUnicos.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('Error en generate-report:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
