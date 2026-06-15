/**
 * Completa datos demo del portal: foto, reporte compartido y mensajes.
 * node --env-file=apps/web/.env.local apps/web/scripts/seed-portal-content.mjs
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const PACIENTE_NOMBRE = 'Santiago'
const PACIENTE_APELLIDOS = 'García López'
const FOTO_URL =
  'https://api.dicebear.com/7.x/big-ears/png?seed=SantiagoGarciaLopez&backgroundColor=b6e3f4&size=256'

const headers = {
  Authorization: `Bearer ${SERVICE_KEY}`,
  apikey: SERVICE_KEY,
  'Content-Type': 'application/json',
}

async function rest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      ...headers,
      Prefer: options.prefer || 'return=representation',
      ...options.headers,
    },
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) throw new Error(`REST ${path} → ${res.status}: ${text}`)
  return data
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Faltan variables Supabase')
    process.exit(1)
  }

  console.log('1. Buscando paciente demo...')
  const pacientes = await rest(
    `/pacientes?select=id,clinica_id,nombre,apellidos,foto_url&nombre=eq.${PACIENTE_NOMBRE}&apellidos=eq.${encodeURIComponent(PACIENTE_APELLIDOS)}&limit=1`
  )
  const paciente = pacientes[0]
  if (!paciente) throw new Error('No se encontró a Santiago García López')

  console.log('2. Actualizando foto del paciente...')
  await rest(`/pacientes?id=eq.${paciente.id}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify({ foto_url: FOTO_URL }),
  })

  console.log('3. Obteniendo terapeuta y padre...')
  const staff = await rest(
    `/usuarios?select=id,nombre,apellidos&clinica_id=eq.${paciente.clinica_id}&rol=neq.padre&limit=1`
  )
  const terapeutaId = staff[0]?.id
  if (!terapeutaId) throw new Error('No hay terapeuta staff')

  const familiares = await rest(
    `/familiares?select=id,auth_user_id&paciente_id=eq.${paciente.id}&limit=1`
  )
  const padreAuthId = familiares[0]?.auth_user_id
  if (!padreAuthId) throw new Error('No hay familiar con acceso al portal')

  console.log('4. Reporte compartido con padres...')
  const reportes = await rest(
    `/reportes_ia?select=id,enviado_a_padres&paciente_id=eq.${paciente.id}&limit=5`
  )

  const reporteContenido = `## Resumen del mes

Santiago ha mostrado avances importantes en motricidad fina y regulación sensorial.

### Avances
- Mejoró el agarre del lápiz
- Mayor tolerancia a texturas nuevas
- Participa con más entusiasmo en las actividades

### Recomendaciones para casa
- Practicar enhebrado 10 minutos al día
- Actividades con plastilina suave

_Este reporte fue compartido por el terapeuta._`

  if (reportes.length === 0) {
    await rest('/reportes_ia', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({
        paciente_id: paciente.id,
        clinica_id: paciente.clinica_id,
        generado_por: terapeutaId,
        tipo: 'mensual',
        titulo: 'Reporte de progreso - Santiago',
        contenido: reporteContenido,
        enviado_a_padres: true,
      }),
    })
    console.log('   Reporte creado')
  } else {
    for (const r of reportes) {
      await rest(`/reportes_ia?id=eq.${r.id}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({ enviado_a_padres: true }),
      })
    }
    console.log(`   ${reportes.length} reporte(s) marcados como compartidos`)
  }

  console.log('5. Mensajes demo terapeuta ↔ padres...')
  const mensajes = await rest(
    `/chat_mensajes?select=id&paciente_id=eq.${paciente.id}&limit=1`
  )

  if (mensajes.length === 0) {
    const hace3d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const hace2d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const hace1d = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const hace6h = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    const conversacion = [
      {
        clinica_id: paciente.clinica_id,
        paciente_id: paciente.id,
        remitente_id: terapeutaId,
        tipo_remitente: 'terapeuta',
        contenido: '¡Hola María! Les escribo para contarles que Santiago tuvo una excelente sesión hoy. Trabajamos pinza trípode y mostró mucha concentración.',
        leido: true,
        created_at: hace3d,
      },
      {
        clinica_id: paciente.clinica_id,
        paciente_id: paciente.id,
        remitente_id: padreAuthId,
        tipo_remitente: 'padre',
        contenido: '¡Qué buena noticia! En casa hemos notado que ya agarra mejor el crayón. ¿Hay algo que podamos practicar esta semana?',
        leido: true,
        created_at: hace2d,
      },
      {
        clinica_id: paciente.clinica_id,
        paciente_id: paciente.id,
        remitente_id: terapeutaId,
        tipo_remitente: 'terapeuta',
        contenido: 'Sí, les recomiendo enhebrar cuentas grandes 10 minutos al día y usar plastilina suave para fortalecer la pinza. Les compartí un reporte mensual con más detalle.',
        leido: true,
        created_at: hace1d,
      },
      {
        clinica_id: paciente.clinica_id,
        paciente_id: paciente.id,
        remitente_id: terapeutaId,
        tipo_remitente: 'terapeuta',
        contenido: 'Recuerden confirmar la cita del jueves desde el portal. ¡Nos vemos pronto!',
        leido: false,
        created_at: hace6h,
      },
    ]

    await rest('/chat_mensajes', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify(conversacion),
    })
    console.log(`   ${conversacion.length} mensajes creados`)
  } else {
    console.log('   Ya hay mensajes, omitido')
  }

  console.log('\n✅ Contenido del portal listo')
  console.log('   Foto, reporte compartido y mensajes demo disponibles')
}

main().catch(err => {
  console.error('\n❌', err.message)
  process.exit(1)
})
