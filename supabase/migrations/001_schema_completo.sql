-- ============================================================
-- MIGRACIÓN COMPLETA - SaaS Terapia Ocupacional Infantil
-- Version: 1.0.0
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE rol_usuario AS ENUM (
  'admin_general',
  'director_clinico',
  'recepcion',
  'terapeuta',
  'padre'
);

CREATE TYPE estado_cita AS ENUM (
  'programada',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_asistio',
  'reagendada'
);

CREATE TYPE tipo_evaluacion AS ENUM (
  'motricidad_fina',
  'motricidad_gruesa',
  'integracion_sensorial',
  'atencion',
  'conducta',
  'cognitivo',
  'lenguaje',
  'socioafectivo'
);

CREATE TYPE estado_objetivo AS ENUM (
  'pendiente',
  'en_progreso',
  'logrado',
  'pausado',
  'abandonado'
);

CREATE TYPE estado_pago AS ENUM (
  'pendiente',
  'pagado',
  'parcial',
  'vencido',
  'cancelado'
);

CREATE TYPE tipo_reporte_ia AS ENUM (
  'semanal',
  'mensual',
  'trimestral',
  'expediente',
  'progreso'
);

CREATE TYPE estado_mensaje_wa AS ENUM (
  'enviado',
  'entregado',
  'leido',
  'fallido'
);

CREATE TYPE plan_saas AS ENUM (
  'basico',
  'profesional',
  'enterprise'
);

-- ============================================================
-- TABLA: CLINICAS (tenant raíz)
-- ============================================================
CREATE TABLE clinicas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            TEXT NOT NULL,
  rfc               TEXT,
  logo_url          TEXT,
  color_primario    TEXT DEFAULT '#6366F1',
  color_secundario  TEXT DEFAULT '#8B5CF6',
  plan              plan_saas DEFAULT 'profesional',
  activa            BOOLEAN DEFAULT TRUE,
  max_sucursales    INT DEFAULT 3,
  max_terapeutas    INT DEFAULT 10,
  max_pacientes     INT DEFAULT 500,
  telefono          TEXT,
  email             TEXT,
  sitio_web         TEXT,
  direccion         TEXT,
  ciudad            TEXT,
  estado            TEXT,
  pais              TEXT DEFAULT 'México',
  configuracion     JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: SUCURSALES
-- ============================================================
CREATE TABLE sucursales (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id  UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  direccion   TEXT,
  ciudad      TEXT,
  estado      TEXT,
  telefono    TEXT,
  email       TEXT,
  activa      BOOLEAN DEFAULT TRUE,
  horario     JSONB DEFAULT '{
    "lunes":    {"inicio": "08:00", "fin": "18:00", "activo": true},
    "martes":   {"inicio": "08:00", "fin": "18:00", "activo": true},
    "miercoles":{"inicio": "08:00", "fin": "18:00", "activo": true},
    "jueves":   {"inicio": "08:00", "fin": "18:00", "activo": true},
    "viernes":  {"inicio": "08:00", "fin": "18:00", "activo": true},
    "sabado":   {"inicio": "09:00", "fin": "13:00", "activo": false},
    "domingo":  {"inicio": "09:00", "fin": "13:00", "activo": false}
  }'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: USUARIOS
-- ============================================================
CREATE TABLE usuarios (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id         UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  sucursal_id        UUID REFERENCES sucursales(id),
  nombre             TEXT NOT NULL,
  apellidos          TEXT,
  email              TEXT NOT NULL UNIQUE,
  telefono           TEXT,
  foto_url           TEXT,
  rol                rol_usuario NOT NULL DEFAULT 'terapeuta',
  cedula_profesional TEXT,
  especialidades     TEXT[] DEFAULT '{}',
  activo             BOOLEAN DEFAULT TRUE,
  ultimo_acceso      TIMESTAMPTZ,
  configuracion      JSONB DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: PACIENTES
-- ============================================================
CREATE TABLE pacientes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id            UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  sucursal_id           UUID NOT NULL REFERENCES sucursales(id),
  terapeuta_asignado_id UUID REFERENCES usuarios(id),
  nombre                TEXT NOT NULL,
  apellidos             TEXT NOT NULL,
  fecha_nacimiento      DATE NOT NULL,
  curp                  TEXT,
  genero                TEXT,
  foto_url              TEXT,
  escuela               TEXT,
  grado_escolar         TEXT,
  turno_escolar         TEXT,
  activo                BOOLEAN DEFAULT TRUE,
  fecha_inicio          DATE DEFAULT CURRENT_DATE,
  fecha_alta            DATE,
  motivo_consulta       TEXT,
  diagnosticos          JSONB DEFAULT '[]'::jsonb,
  medicamentos          JSONB DEFAULT '[]'::jsonb,
  alergias              TEXT[] DEFAULT '{}',
  antecedentes          TEXT,
  historial_medico      TEXT,
  notas_internas        TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: FAMILIARES / CONTACTOS
-- ============================================================
CREATE TABLE familiares (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id       UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo_relacion     TEXT NOT NULL, -- 'padre', 'madre', 'tutor', 'emergencia'
  nombre            TEXT NOT NULL,
  apellidos         TEXT,
  telefono          TEXT,
  telefono_alt      TEXT,
  email             TEXT,
  ocupacion         TEXT,
  curp              TEXT,
  tiene_acceso_portal BOOLEAN DEFAULT FALSE,
  auth_user_id      UUID REFERENCES auth.users(id),
  es_contacto_principal BOOLEAN DEFAULT FALSE,
  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: ARCHIVOS DEL PACIENTE
-- ============================================================
CREATE TABLE archivos_paciente (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id   UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  subido_por    UUID REFERENCES usuarios(id),
  nombre        TEXT NOT NULL,
  tipo          TEXT, -- 'estudio', 'receta', 'consentimiento', 'foto', 'video', 'otro'
  url           TEXT NOT NULL,
  tamanio_bytes BIGINT,
  mime_type     TEXT,
  descripcion   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: CITAS
-- ============================================================
CREATE TABLE citas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id          UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  sucursal_id         UUID NOT NULL REFERENCES sucursales(id),
  paciente_id         UUID NOT NULL REFERENCES pacientes(id),
  terapeuta_id        UUID NOT NULL REFERENCES usuarios(id),
  fecha_inicio        TIMESTAMPTZ NOT NULL,
  fecha_fin           TIMESTAMPTZ NOT NULL,
  duracion_minutos    INT DEFAULT 60,
  estado              estado_cita DEFAULT 'programada',
  tipo                TEXT DEFAULT 'terapia', -- 'terapia', 'evaluacion', 'seguimiento', 'valoracion'
  sala                TEXT,
  notas_cita          TEXT,
  motivo_cancelacion  TEXT,
  recordatorio_24h    BOOLEAN DEFAULT FALSE,
  recordatorio_1h     BOOLEAN DEFAULT FALSE,
  confirmada_por_padre BOOLEAN DEFAULT FALSE,
  cita_original_id    UUID REFERENCES citas(id), -- para reagendaciones
  costo               DECIMAL(10,2),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: EVALUACIONES
-- ============================================================
CREATE TABLE evaluaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id     UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  terapeuta_id    UUID NOT NULL REFERENCES usuarios(id),
  clinica_id      UUID NOT NULL REFERENCES clinicas(id),
  tipo            tipo_evaluacion NOT NULL,
  nombre          TEXT,
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  puntuacion_total DECIMAL(5,2),
  puntuacion_max   DECIMAL(5,2),
  porcentaje       DECIMAL(5,2),
  nivel            TEXT, -- 'bajo', 'medio', 'alto', 'muy_alto'
  items            JSONB NOT NULL DEFAULT '[]'::jsonb,
  observaciones    TEXT,
  recomendaciones  TEXT,
  comparativa_anterior UUID REFERENCES evaluaciones(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: ITEMS DE EVALUACIÓN (catálogo)
-- ============================================================
CREATE TABLE catalogo_items_evaluacion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID REFERENCES clinicas(id), -- NULL = global
  tipo_evaluacion tipo_evaluacion NOT NULL,
  area            TEXT NOT NULL,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  puntaje_max     INT DEFAULT 4,
  orden           INT DEFAULT 0,
  activo          BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- TABLA: PLANES TERAPÉUTICOS
-- ============================================================
CREATE TABLE planes_terapeuticos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id         UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  terapeuta_id        UUID NOT NULL REFERENCES usuarios(id),
  clinica_id          UUID NOT NULL REFERENCES clinicas(id),
  titulo              TEXT NOT NULL,
  objetivo_general    TEXT NOT NULL,
  justificacion       TEXT,
  fecha_inicio        DATE DEFAULT CURRENT_DATE,
  fecha_revision      DATE,
  fecha_fin_estimada  DATE,
  estado              TEXT DEFAULT 'activo',
  porcentaje_avance   DECIMAL(5,2) DEFAULT 0,
  nivel_funcionamiento TEXT,
  areas_intervencion   TEXT[] DEFAULT '{}',
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: OBJETIVOS DEL PLAN
-- ============================================================
CREATE TABLE objetivos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id         UUID NOT NULL REFERENCES planes_terapeuticos(id) ON DELETE CASCADE,
  tipo            TEXT DEFAULT 'especifico', -- 'general', 'especifico'
  area            TEXT,
  descripcion     TEXT NOT NULL,
  criterio_logro  TEXT,
  fecha_inicio    DATE,
  fecha_meta      DATE,
  estado          estado_objetivo DEFAULT 'pendiente',
  porcentaje      DECIMAL(5,2) DEFAULT 0,
  responsable_id  UUID REFERENCES usuarios(id),
  orden           INT DEFAULT 0,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: INDICADORES DE OBJETIVOS
-- ============================================================
CREATE TABLE indicadores (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objetivo_id   UUID NOT NULL REFERENCES objetivos(id) ON DELETE CASCADE,
  descripcion   TEXT NOT NULL,
  meta_valor    DECIMAL(10,2),
  unidad        TEXT,
  valor_actual  DECIMAL(10,2) DEFAULT 0,
  logrado       BOOLEAN DEFAULT FALSE,
  fecha_logro   DATE,
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: SESIONES
-- ============================================================
CREATE TABLE sesiones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id           UUID REFERENCES citas(id),
  paciente_id       UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  terapeuta_id      UUID NOT NULL REFERENCES usuarios(id),
  plan_id           UUID REFERENCES planes_terapeuticos(id),
  clinica_id        UUID NOT NULL REFERENCES clinicas(id),
  fecha             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duracion_minutos  INT,
  actividades       TEXT,
  actividades_json  JSONB DEFAULT '[]'::jsonb,
  observaciones     TEXT,
  avances           TEXT,
  dificultades      TEXT,
  estado_animo      TEXT,
  nivel_cooperacion INT CHECK (nivel_cooperacion BETWEEN 1 AND 5),
  tareas_casa       TEXT,
  proxima_sesion    TEXT,
  evidencias        JSONB DEFAULT '[]'::jsonb,
  resumen_ia        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: AVANCES DE OBJETIVOS (historial)
-- ============================================================
CREATE TABLE avances_objetivo (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objetivo_id   UUID NOT NULL REFERENCES objetivos(id) ON DELETE CASCADE,
  sesion_id     UUID REFERENCES sesiones(id),
  fecha         TIMESTAMPTZ DEFAULT NOW(),
  porcentaje    DECIMAL(5,2),
  notas         TEXT,
  registrado_por UUID REFERENCES usuarios(id)
);

-- ============================================================
-- TABLA: REPORTES IA
-- ============================================================
CREATE TABLE reportes_ia (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id     UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  clinica_id      UUID NOT NULL REFERENCES clinicas(id),
  generado_por    UUID REFERENCES usuarios(id),
  tipo            tipo_reporte_ia NOT NULL,
  periodo_inicio  DATE,
  periodo_fin     DATE,
  titulo          TEXT,
  contenido       TEXT NOT NULL,
  resumen         TEXT,
  recomendaciones JSONB DEFAULT '[]'::jsonb,
  tareas_casa     JSONB DEFAULT '[]'::jsonb,
  patrones        JSONB DEFAULT '[]'::jsonb,
  pdf_url         TEXT,
  tokens_usados   INT,
  modelo_ia       TEXT DEFAULT 'gpt-4o',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: FACTURACIÓN
-- ============================================================
CREATE TABLE facturacion (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  sucursal_id     UUID REFERENCES sucursales(id),
  paciente_id     UUID REFERENCES pacientes(id),
  familiar_id     UUID REFERENCES familiares(id),
  cita_id         UUID REFERENCES citas(id),
  folio           TEXT,
  concepto        TEXT NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  descuento       DECIMAL(10,2) DEFAULT 0,
  iva             DECIMAL(10,2) DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL,
  estado          estado_pago DEFAULT 'pendiente',
  metodo_pago     TEXT, -- 'efectivo', 'transferencia', 'tarjeta', 'cheque'
  fecha_pago      TIMESTAMPTZ,
  fecha_vencimiento DATE,
  cfdi_uuid       TEXT,
  cfdi_url        TEXT,
  pdf_url         TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: MENSAJES WHATSAPP
-- ============================================================
CREATE TABLE mensajes_whatsapp (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id     UUID REFERENCES pacientes(id),
  familiar_id     UUID REFERENCES familiares(id),
  enviado_por     UUID REFERENCES usuarios(id),
  telefono_destino TEXT NOT NULL,
  tipo_mensaje    TEXT, -- 'cita', 'recordatorio', 'reporte', 'tarea', 'encuesta', 'libre'
  plantilla       TEXT,
  contenido       TEXT NOT NULL,
  wa_message_id   TEXT,
  estado          estado_mensaje_wa DEFAULT 'enviado',
  adjunto_url     TEXT,
  adjunto_tipo    TEXT,
  respuesta       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  leido_at        TIMESTAMPTZ
);

-- ============================================================
-- TABLA: MENSAJES CHAT (portal padres)
-- ============================================================
CREATE TABLE chat_mensajes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id     UUID NOT NULL REFERENCES pacientes(id),
  remitente_id    UUID NOT NULL REFERENCES auth.users(id),
  tipo_remitente  TEXT NOT NULL, -- 'terapeuta', 'padre'
  contenido       TEXT NOT NULL,
  adjunto_url     TEXT,
  adjunto_tipo    TEXT,
  leido           BOOLEAN DEFAULT FALSE,
  leido_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: NOTIFICACIONES
-- ============================================================
CREATE TABLE notificaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id      UUID REFERENCES clinicas(id),
  tipo            TEXT, -- 'cita', 'pago', 'reporte', 'alerta', 'sistema'
  titulo          TEXT NOT NULL,
  mensaje         TEXT NOT NULL,
  url_accion      TEXT,
  leida           BOOLEAN DEFAULT FALSE,
  leida_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: AUDITORÍA / BITÁCORA
-- ============================================================
CREATE TABLE auditoria (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id    UUID REFERENCES clinicas(id),
  usuario_id    UUID REFERENCES auth.users(id),
  tabla         TEXT NOT NULL,
  registro_id   UUID,
  accion        TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'SELECT'
  datos_antes   JSONB,
  datos_despues JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: CONFIGURACIÓN WHATSAPP
-- ============================================================
CREATE TABLE config_whatsapp (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE UNIQUE,
  phone_number_id TEXT,
  access_token    TEXT,
  webhook_secret  TEXT,
  activo          BOOLEAN DEFAULT FALSE,
  plantillas      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: ENCUESTAS DE SATISFACCIÓN
-- ============================================================
CREATE TABLE encuestas_satisfaccion (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id    UUID NOT NULL REFERENCES clinicas(id),
  paciente_id   UUID REFERENCES pacientes(id),
  familiar_id   UUID REFERENCES familiares(id),
  periodo       TEXT,
  puntuacion    INT CHECK (puntuacion BETWEEN 1 AND 10),
  comentarios   TEXT,
  respondida    BOOLEAN DEFAULT FALSE,
  respondida_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX idx_pacientes_sucursal ON pacientes(sucursal_id);
CREATE INDEX idx_pacientes_terapeuta ON pacientes(terapeuta_asignado_id);
CREATE INDEX idx_pacientes_activo ON pacientes(activo);
CREATE INDEX idx_citas_fecha ON citas(fecha_inicio);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_terapeuta ON citas(terapeuta_id);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_sesiones_paciente ON sesiones(paciente_id);
CREATE INDEX idx_sesiones_terapeuta ON sesiones(terapeuta_id);
CREATE INDEX idx_sesiones_fecha ON sesiones(fecha);
CREATE INDEX idx_evaluaciones_paciente ON evaluaciones(paciente_id);
CREATE INDEX idx_objetivos_plan ON objetivos(plan_id);
CREATE INDEX idx_facturacion_paciente ON facturacion(paciente_id);
CREATE INDEX idx_facturacion_estado ON facturacion(estado);
CREATE INDEX idx_mensajes_wa_clinica ON mensajes_whatsapp(clinica_id);
CREATE INDEX idx_auditoria_clinica ON auditoria(clinica_id);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);

-- Búsqueda de texto completo
CREATE INDEX idx_pacientes_nombre_trgm ON pacientes USING gin((nombre || ' ' || apellidos) gin_trgm_ops);

-- ============================================================
-- FUNCIÓN: UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
DO $$
DECLARE
  tabla TEXT;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'clinicas','sucursales','usuarios','pacientes','familiares',
    'citas','evaluaciones','planes_terapeuticos','objetivos',
    'indicadores','sesiones','facturacion','config_whatsapp'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_updated_at_%s BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at()',
      tabla, tabla
    );
  END LOOP;
END $$;

-- ============================================================
-- FUNCIÓN: CALCULAR EDAD
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_edad(fecha_nac DATE)
RETURNS INT AS $$
BEGIN
  RETURN DATE_PART('year', AGE(fecha_nac));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- FUNCIÓN: CALCULAR PORCENTAJE PLAN
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_avance_plan(plan_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total INT;
  logrados INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE estado = 'logrado')
  INTO total, logrados
  FROM objetivos WHERE plan_id = plan_uuid;
  
  IF total = 0 THEN RETURN 0; END IF;
  RETURN ROUND((logrados::DECIMAL / total) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE familiares ENABLE ROW LEVEL SECURITY;
ALTER TABLE archivos_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes_terapeuticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE objetivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE avances_objetivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuestas_satisfaccion ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener clinica_id del usuario actual
CREATE OR REPLACE FUNCTION get_clinica_id()
RETURNS UUID AS $$
  SELECT clinica_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función auxiliar para obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS rol_usuario AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- POLÍTICAS: CLÍNICAS
CREATE POLICY "Usuarios ven su clínica"
  ON clinicas FOR SELECT
  USING (id = get_clinica_id());

CREATE POLICY "Solo admin puede modificar clínica"
  ON clinicas FOR UPDATE
  USING (id = get_clinica_id() AND get_user_rol() = 'admin_general');

-- POLÍTICAS: SUCURSALES
CREATE POLICY "Usuarios ven sucursales de su clínica"
  ON sucursales FOR SELECT
  USING (clinica_id = get_clinica_id());

CREATE POLICY "Admin gestiona sucursales"
  ON sucursales FOR ALL
  USING (clinica_id = get_clinica_id() AND get_user_rol() IN ('admin_general', 'director_clinico'));

-- POLÍTICAS: USUARIOS
CREATE POLICY "Usuarios ven usuarios de su clínica"
  ON usuarios FOR SELECT
  USING (clinica_id = get_clinica_id());

CREATE POLICY "Admin gestiona usuarios"
  ON usuarios FOR ALL
  USING (clinica_id = get_clinica_id() AND get_user_rol() IN ('admin_general', 'director_clinico'));

CREATE POLICY "Usuario ve su propio perfil"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

-- POLÍTICAS: PACIENTES
CREATE POLICY "Staff ve pacientes de su clínica"
  ON pacientes FOR SELECT
  USING (clinica_id = get_clinica_id());

CREATE POLICY "Padre ve solo su hijo"
  ON pacientes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM familiares f
      WHERE f.paciente_id = pacientes.id
      AND f.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff gestiona pacientes"
  ON pacientes FOR ALL
  USING (clinica_id = get_clinica_id() AND get_user_rol() != 'padre');

-- POLÍTICAS: CITAS
CREATE POLICY "Staff ve citas de su clínica"
  ON citas FOR SELECT
  USING (clinica_id = get_clinica_id());

CREATE POLICY "Padre ve citas de su hijo"
  ON citas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM familiares f
      WHERE f.paciente_id = citas.paciente_id
      AND f.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff gestiona citas"
  ON citas FOR ALL
  USING (clinica_id = get_clinica_id() AND get_user_rol() != 'padre');

-- POLÍTICAS: SESIONES
CREATE POLICY "Staff ve sesiones de su clínica"
  ON sesiones FOR SELECT
  USING (clinica_id = get_clinica_id());

CREATE POLICY "Padre ve sesiones de su hijo"
  ON sesiones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM familiares f
      WHERE f.paciente_id = sesiones.paciente_id
      AND f.auth_user_id = auth.uid()
    )
  );

-- POLÍTICAS: NOTIFICACIONES
CREATE POLICY "Usuario ve sus notificaciones"
  ON notificaciones FOR ALL
  USING (usuario_id = auth.uid());

-- POLÍTICAS: CHAT
CREATE POLICY "Participantes ven el chat"
  ON chat_mensajes FOR SELECT
  USING (
    clinica_id = get_clinica_id()
    OR EXISTS (
      SELECT 1 FROM familiares f
      WHERE f.paciente_id = chat_mensajes.paciente_id
      AND f.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- DATOS INICIALES: CATÁLOGO DE EVALUACIONES
-- ============================================================
INSERT INTO catalogo_items_evaluacion (tipo_evaluacion, area, nombre, puntaje_max, orden) VALUES
-- Motricidad Fina
('motricidad_fina', 'Pinza', 'Pinza inferior (pulgar-índice)', 4, 1),
('motricidad_fina', 'Pinza', 'Pinza lateral', 4, 2),
('motricidad_fina', 'Pinza', 'Pinza trípode', 4, 3),
('motricidad_fina', 'Precisión', 'Enhebrado de cuentas', 4, 4),
('motricidad_fina', 'Precisión', 'Recorte con tijeras en línea recta', 4, 5),
('motricidad_fina', 'Precisión', 'Recorte con tijeras en curva', 4, 6),
('motricidad_fina', 'Escritura', 'Agarre del lápiz', 4, 7),
('motricidad_fina', 'Escritura', 'Presión sobre el papel', 4, 8),
('motricidad_fina', 'Escritura', 'Trazado de líneas', 4, 9),
('motricidad_fina', 'Escritura', 'Copia de figuras geométricas', 4, 10),
-- Motricidad Gruesa
('motricidad_gruesa', 'Equilibrio', 'Equilibrio estático en un pie', 4, 1),
('motricidad_gruesa', 'Equilibrio', 'Equilibrio dinámico en línea recta', 4, 2),
('motricidad_gruesa', 'Marcha', 'Patrón de marcha', 4, 3),
('motricidad_gruesa', 'Marcha', 'Subir y bajar escaleras alternando pies', 4, 4),
('motricidad_gruesa', 'Coordinación', 'Lanzamiento y recepción de pelota', 4, 5),
('motricidad_gruesa', 'Coordinación', 'Salto con dos pies', 4, 6),
('motricidad_gruesa', 'Coordinación', 'Coordinación ojo-mano', 4, 7),
-- Integración Sensorial
('integracion_sensorial', 'Auditiva', 'Localización de sonidos', 4, 1),
('integracion_sensorial', 'Auditiva', 'Discriminación auditiva', 4, 2),
('integracion_sensorial', 'Visual', 'Seguimiento visual suave', 4, 3),
('integracion_sensorial', 'Visual', 'Convergencia visual', 4, 4),
('integracion_sensorial', 'Vestibular', 'Tolerancia al movimiento', 4, 5),
('integracion_sensorial', 'Vestibular', 'Búsqueda de movimiento', 4, 6),
('integracion_sensorial', 'Propioceptiva', 'Conciencia corporal', 4, 7),
('integracion_sensorial', 'Propioceptiva', 'Gradación de fuerza', 4, 8),
-- Atención
('atencion', 'Sostenida', 'Mantiene atención en tarea (5 min)', 4, 1),
('atencion', 'Sostenida', 'Completa tareas sin abandono', 4, 2),
('atencion', 'Selectiva', 'Filtra distractores visuales', 4, 3),
('atencion', 'Selectiva', 'Filtra distractores auditivos', 4, 4),
-- Conducta
('conducta', 'Autorregulación', 'Regula emociones ante frustración', 4, 1),
('conducta', 'Autorregulación', 'Acepta cambios de rutina', 4, 2),
('conducta', 'Impulsividad', 'Espera su turno', 4, 3),
('conducta', 'Impulsividad', 'Piensa antes de actuar', 4, 4);

-- ============================================================
-- VISTA: DASHBOARD RESUMEN
-- ============================================================
CREATE OR REPLACE VIEW vista_dashboard AS
SELECT
  c.id as clinica_id,
  c.nombre as clinica_nombre,
  COUNT(DISTINCT p.id) FILTER (WHERE p.activo = TRUE) as pacientes_activos,
  COUNT(DISTINCT p.id) FILTER (WHERE p.activo = TRUE AND p.fecha_inicio >= DATE_TRUNC('month', NOW())) as pacientes_nuevos_mes,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.fecha_inicio::date = CURRENT_DATE) as citas_hoy,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.fecha_inicio::date = CURRENT_DATE AND ci.estado = 'completada') as citas_completadas_hoy,
  COUNT(DISTINCT f.id) FILTER (WHERE f.estado = 'pendiente') as pagos_pendientes,
  SUM(f.total) FILTER (WHERE f.estado = 'pagado' AND f.fecha_pago >= DATE_TRUNC('month', NOW())) as ingresos_mes
FROM clinicas c
LEFT JOIN pacientes p ON p.clinica_id = c.id
LEFT JOIN citas ci ON ci.clinica_id = c.id
LEFT JOIN facturacion f ON f.clinica_id = c.id
GROUP BY c.id, c.nombre;
