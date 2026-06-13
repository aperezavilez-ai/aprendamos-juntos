// ============================================================
// TIPOS TYPESCRIPT - SaaS Terapia Ocupacional Infantil
// Generado desde el schema de PostgreSQL
// ============================================================

export type RolUsuario =
  | 'admin_general'
  | 'director_clinico'
  | 'recepcion'
  | 'terapeuta'
  | 'padre'

export type EstadoCita =
  | 'programada'
  | 'confirmada'
  | 'en_curso'
  | 'completada'
  | 'cancelada'
  | 'no_asistio'
  | 'reagendada'

export type TipoEvaluacion =
  | 'motricidad_fina'
  | 'motricidad_gruesa'
  | 'integracion_sensorial'
  | 'atencion'
  | 'conducta'
  | 'cognitivo'
  | 'lenguaje'
  | 'socioafectivo'

export type EstadoObjetivo =
  | 'pendiente'
  | 'en_progreso'
  | 'logrado'
  | 'pausado'
  | 'abandonado'

export type EstadoPago =
  | 'pendiente'
  | 'pagado'
  | 'parcial'
  | 'vencido'
  | 'cancelado'

export type TipoReporteIA =
  | 'semanal'
  | 'mensual'
  | 'trimestral'
  | 'expediente'
  | 'progreso'

export type PlanSaaS = 'basico' | 'profesional' | 'enterprise'

// ============================================================
// ENTIDADES PRINCIPALES
// ============================================================

export interface Clinica {
  id: string
  nombre: string
  rfc?: string
  logo_url?: string
  color_primario: string
  color_secundario: string
  plan: PlanSaaS
  activa: boolean
  max_sucursales: number
  max_terapeutas: number
  max_pacientes: number
  telefono?: string
  email?: string
  sitio_web?: string
  direccion?: string
  ciudad?: string
  estado?: string
  pais: string
  configuracion: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Sucursal {
  id: string
  clinica_id: string
  nombre: string
  direccion?: string
  ciudad?: string
  estado?: string
  telefono?: string
  email?: string
  activa: boolean
  horario: HorarioSucursal
  created_at: string
  updated_at: string
}

export interface HorarioSucursal {
  lunes: DiaSemana
  martes: DiaSemana
  miercoles: DiaSemana
  jueves: DiaSemana
  viernes: DiaSemana
  sabado: DiaSemana
  domingo: DiaSemana
}

export interface DiaSemana {
  inicio: string
  fin: string
  activo: boolean
}

export interface Usuario {
  id: string
  clinica_id: string
  sucursal_id?: string
  nombre: string
  apellidos?: string
  email: string
  telefono?: string
  foto_url?: string
  rol: RolUsuario
  cedula_profesional?: string
  especialidades: string[]
  activo: boolean
  ultimo_acceso?: string
  configuracion: Record<string, unknown>
  created_at: string
  updated_at: string
  // Relaciones
  sucursal?: Sucursal
  clinica?: Clinica
}

export interface Paciente {
  id: string
  clinica_id: string
  sucursal_id: string
  terapeuta_asignado_id?: string
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  curp?: string
  genero?: string
  foto_url?: string
  escuela?: string
  grado_escolar?: string
  turno_escolar?: string
  activo: boolean
  fecha_inicio: string
  fecha_alta?: string
  motivo_consulta?: string
  diagnosticos: Diagnostico[]
  medicamentos: Medicamento[]
  alergias: string[]
  antecedentes?: string
  historial_medico?: string
  notas_internas?: string
  created_at: string
  updated_at: string
  // Virtuales
  edad?: number
  nombre_completo?: string
  // Relaciones
  terapeuta_asignado?: Usuario
  familiares?: Familiar[]
  sucursal?: Sucursal
}

export interface Diagnostico {
  codigo?: string // CIE-10
  nombre: string
  fecha: string
  medico?: string
  notas?: string
}

export interface Medicamento {
  nombre: string
  dosis: string
  frecuencia: string
  prescriptor?: string
  inicio?: string
  fin?: string
}

export interface Familiar {
  id: string
  paciente_id: string
  tipo_relacion: 'padre' | 'madre' | 'tutor' | 'emergencia'
  nombre: string
  apellidos?: string
  telefono?: string
  telefono_alt?: string
  email?: string
  ocupacion?: string
  curp?: string
  tiene_acceso_portal: boolean
  auth_user_id?: string
  es_contacto_principal: boolean
  notas?: string
  created_at: string
  updated_at: string
}

export interface ArchivoPaciente {
  id: string
  paciente_id: string
  subido_por?: string
  nombre: string
  tipo?: string
  url: string
  tamanio_bytes?: number
  mime_type?: string
  descripcion?: string
  created_at: string
}

export interface Cita {
  id: string
  clinica_id: string
  sucursal_id: string
  paciente_id: string
  terapeuta_id: string
  fecha_inicio: string
  fecha_fin: string
  duracion_minutos: number
  estado: EstadoCita
  tipo: string
  sala?: string
  notas_cita?: string
  motivo_cancelacion?: string
  recordatorio_24h: boolean
  recordatorio_1h: boolean
  confirmada_por_padre: boolean
  cita_original_id?: string
  costo?: number
  created_at: string
  updated_at: string
  // Relaciones
  paciente?: Paciente
  terapeuta?: Usuario
  sucursal?: Sucursal
  sesion?: Sesion
}

export interface Evaluacion {
  id: string
  paciente_id: string
  terapeuta_id: string
  clinica_id: string
  tipo: TipoEvaluacion
  nombre?: string
  fecha: string
  puntuacion_total?: number
  puntuacion_max?: number
  porcentaje?: number
  nivel?: 'bajo' | 'medio' | 'alto' | 'muy_alto'
  items: ItemEvaluacion[]
  observaciones?: string
  recomendaciones?: string
  comparativa_anterior?: string
  created_at: string
  updated_at: string
  // Relaciones
  paciente?: Paciente
  terapeuta?: Usuario
}

export interface ItemEvaluacion {
  id?: string
  area: string
  nombre: string
  puntuacion: number
  puntuacion_max: number
  observacion?: string
}

export interface PlanTerapeutico {
  id: string
  paciente_id: string
  terapeuta_id: string
  clinica_id: string
  titulo: string
  objetivo_general: string
  justificacion?: string
  fecha_inicio: string
  fecha_revision?: string
  fecha_fin_estimada?: string
  estado: 'activo' | 'pausado' | 'finalizado' | 'cancelado'
  porcentaje_avance: number
  nivel_funcionamiento?: string
  areas_intervencion: string[]
  notas?: string
  created_at: string
  updated_at: string
  // Relaciones
  objetivos?: Objetivo[]
  paciente?: Paciente
  terapeuta?: Usuario
}

export interface Objetivo {
  id: string
  plan_id: string
  tipo: 'general' | 'especifico'
  area?: string
  descripcion: string
  criterio_logro?: string
  fecha_inicio?: string
  fecha_meta?: string
  estado: EstadoObjetivo
  porcentaje: number
  responsable_id?: string
  orden: number
  notas?: string
  created_at: string
  updated_at: string
  // Relaciones
  indicadores?: Indicador[]
  avances?: AvanceObjetivo[]
}

export interface Indicador {
  id: string
  objetivo_id: string
  descripcion: string
  meta_valor?: number
  unidad?: string
  valor_actual: number
  logrado: boolean
  fecha_logro?: string
  notas?: string
  created_at: string
  updated_at: string
}

export interface Sesion {
  id: string
  cita_id?: string
  paciente_id: string
  terapeuta_id: string
  plan_id?: string
  clinica_id: string
  fecha: string
  duracion_minutos?: number
  actividades?: string
  actividades_json: ActividadSesion[]
  observaciones?: string
  avances?: string
  dificultades?: string
  estado_animo?: string
  nivel_cooperacion?: 1 | 2 | 3 | 4 | 5
  tareas_casa?: string
  proxima_sesion?: string
  evidencias: EvidenciaSesion[]
  resumen_ia?: string
  created_at: string
  updated_at: string
  // Relaciones
  paciente?: Paciente
  terapeuta?: Usuario
  plan?: PlanTerapeutico
}

export interface ActividadSesion {
  nombre: string
  objetivo_id?: string
  duracion_min?: number
  materiales?: string[]
  resultado?: string
}

export interface EvidenciaSesion {
  url: string
  tipo: 'foto' | 'video' | 'audio' | 'documento'
  nombre?: string
  descripcion?: string
  created_at: string
}

export interface AvanceObjetivo {
  id: string
  objetivo_id: string
  sesion_id?: string
  fecha: string
  porcentaje: number
  notas?: string
  registrado_por?: string
}

export interface ReporteIA {
  id: string
  paciente_id: string
  clinica_id: string
  generado_por?: string
  tipo: TipoReporteIA
  periodo_inicio?: string
  periodo_fin?: string
  titulo?: string
  contenido: string
  resumen?: string
  recomendaciones: string[]
  tareas_casa: TareaCasa[]
  patrones: PatronDetectado[]
  pdf_url?: string
  tokens_usados?: number
  modelo_ia: string
  created_at: string
}

export interface TareaCasa {
  titulo: string
  descripcion: string
  frecuencia: string
  materiales?: string[]
  objetivo_id?: string
}

export interface PatronDetectado {
  tipo: string
  descripcion: string
  evidencia: string[]
  recomendacion?: string
}

export interface Facturacion {
  id: string
  clinica_id: string
  sucursal_id?: string
  paciente_id?: string
  familiar_id?: string
  cita_id?: string
  folio?: string
  concepto: string
  subtotal: number
  descuento: number
  iva: number
  total: number
  estado: EstadoPago
  metodo_pago?: string
  fecha_pago?: string
  fecha_vencimiento?: string
  cfdi_uuid?: string
  cfdi_url?: string
  pdf_url?: string
  notas?: string
  created_at: string
  updated_at: string
  // Relaciones
  paciente?: Paciente
}

export interface MensajeWhatsapp {
  id: string
  clinica_id: string
  paciente_id?: string
  familiar_id?: string
  enviado_por?: string
  telefono_destino: string
  tipo_mensaje?: string
  plantilla?: string
  contenido: string
  wa_message_id?: string
  estado: 'enviado' | 'entregado' | 'leido' | 'fallido'
  adjunto_url?: string
  adjunto_tipo?: string
  respuesta?: string
  created_at: string
  leido_at?: string
}

export interface ChatMensaje {
  id: string
  clinica_id: string
  paciente_id: string
  remitente_id: string
  tipo_remitente: 'terapeuta' | 'padre'
  contenido: string
  adjunto_url?: string
  adjunto_tipo?: string
  leido: boolean
  leido_at?: string
  created_at: string
}

export interface Notificacion {
  id: string
  usuario_id?: string
  clinica_id?: string
  tipo?: string
  titulo: string
  mensaje: string
  url_accion?: string
  leida: boolean
  leida_at?: string
  created_at: string
}

// ============================================================
// TIPOS PARA DASHBOARD
// ============================================================

export interface DashboardResumen {
  clinica_id: string
  clinica_nombre: string
  pacientes_activos: number
  pacientes_nuevos_mes: number
  citas_hoy: number
  citas_completadas_hoy: number
  pagos_pendientes: number
  ingresos_mes: number
}

export interface KPITerapeuta {
  usuario_id: string
  nombre: string
  citas_mes: number
  citas_completadas: number
  porcentaje_asistencia: number
  pacientes_activos: number
  sesiones_realizadas: number
}

// ============================================================
// TIPOS PARA API RESPONSES
// ============================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ============================================================
// TIPOS PARA FORMULARIOS
// ============================================================

export type CreatePacienteInput = Omit<
  Paciente,
  'id' | 'created_at' | 'updated_at' | 'edad' | 'nombre_completo' | 'terapeuta_asignado' | 'familiares' | 'sucursal'
>

export type UpdatePacienteInput = Partial<CreatePacienteInput>

export type CreateCitaInput = Omit<
  Cita,
  'id' | 'created_at' | 'updated_at' | 'paciente' | 'terapeuta' | 'sucursal' | 'sesion'
>

export type CreateSesionInput = Omit<
  Sesion,
  'id' | 'created_at' | 'updated_at' | 'paciente' | 'terapeuta' | 'plan'
>
