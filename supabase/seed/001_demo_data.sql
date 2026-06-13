-- ============================================================
-- TerapiaOS — Seed de datos de demostración
-- Ejecuta DESPUÉS de la migración 001_schema_completo.sql
-- ============================================================

-- IMPORTANTE: Primero crea los usuarios en Supabase Auth manualmente
-- o usa la función de invitación desde la interfaz.
-- Este seed asume que ya existen las UUIDs correspondientes.

-- ── Crear clínica demo ──────────────────────────────────────
INSERT INTO clinicas (
  id, nombre, rfc, telefono, email, sitio_web,
  direccion, ciudad, estado, pais,
  color_primario, plan, activa
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Centro TerapiaOS Demo',
  'CTOD123456XXX',
  '+52 33 1234 5678',
  'contacto@terapiaos.demo',
  'https://terapiaos.com',
  'Av. Providencia 1234, Col. Providencia',
  'Guadalajara',
  'Jalisco',
  'México',
  '#6366F1',
  'profesional',
  true
) ON CONFLICT (id) DO NOTHING;

-- ── Sucursal principal ──────────────────────────────────────
INSERT INTO sucursales (id, clinica_id, nombre, direccion, ciudad, estado, telefono, activa)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Sede Principal',
  'Av. Providencia 1234, Col. Providencia',
  'Guadalajara',
  'Jalisco',
  '+52 33 1234 5678',
  true
) ON CONFLICT (id) DO NOTHING;

-- ── NOTA: Usuarios se crean desde Supabase Auth ─────────────
-- Después de crear usuarios en Auth, inserta con sus UUIDs reales:
-- INSERT INTO usuarios (id, clinica_id, sucursal_id, nombre, apellidos, email, rol) VALUES
-- ('UUID-REAL-DE-AUTH', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010',
--  'María', 'González', 'maria@demo.com', 'terapeuta');

-- ── Pacientes demo ──────────────────────────────────────────
INSERT INTO pacientes (
  clinica_id, nombre, apellidos, fecha_nacimiento, sexo,
  diagnostico_principal, motivo_consulta,
  antecedentes_medicos, medicamentos, alergias,
  activo
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Sebastián', 'Martínez López',
  '2018-03-15', 'masculino',
  'Trastorno del Espectro Autista (TEA)',
  'Dificultades en integración sensorial, hiperrespuesta táctil y problemas de atención en el aula.',
  'Diagnóstico TEA a los 3 años. Sin cirugías previas. Desarrollo motor tardío (caminó a los 18 meses).',
  'Risperidona 0.5mg por la noche',
  'Penicilina',
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Isabella', 'Rodríguez Vega',
  '2019-07-22', 'femenino',
  'Retraso en el Desarrollo Psicomotor',
  'Retraso en habilidades motoras finas. Dificultad para usar cubiertos, abotonarse y escribir.',
  'Hipotomía muscular diagnosticada a los 8 meses. Fisioterapia hasta los 2 años.',
  'Sin medicamentos',
  'Ninguna conocida',
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Mateo', 'García Hernández',
  '2016-11-08', 'masculino',
  'Trastorno por Déficit de Atención e Hiperactividad (TDAH)',
  'Dificultad para mantener atención en tareas escolares. Impulsividad. Problemas de organización.',
  'TDAH diagnosticado a los 5 años. Sin otras condiciones médicas relevantes.',
  'Metilfenidato 10mg mañana',
  'Ninguna',
  true
),
(
  '00000000-0000-0000-0000-000000000001',
  'Valentina', 'Torres Jiménez',
  '2020-05-30', 'femenino',
  'Trastorno de Procesamiento Sensorial',
  'Hipersensibilidad auditiva y táctil. Rechazo a texturas alimentarias. Dificultad en ambientes ruidosos.',
  'Sin diagnósticos previos. Desarrollo general dentro de parámetros normales.',
  'Sin medicamentos',
  'Sin alergias conocidas',
  true
)
ON CONFLICT DO NOTHING;

-- ── Actualizar con familiares (referenciando los pacientes) ─
-- Se ejecuta después para obtener los IDs generados
DO $$
DECLARE
  pac1_id uuid;
  pac2_id uuid;
  pac3_id uuid;
BEGIN
  SELECT id INTO pac1_id FROM pacientes WHERE nombre = 'Sebastián' AND clinica_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
  SELECT id INTO pac2_id FROM pacientes WHERE nombre = 'Isabella' AND clinica_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
  SELECT id INTO pac3_id FROM pacientes WHERE nombre = 'Mateo' AND clinica_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;

  IF pac1_id IS NOT NULL THEN
    INSERT INTO familiares (paciente_id, clinica_id, nombre, parentesco, telefono, email, tiene_acceso_portal, es_contacto_emergencia, tutor_legal)
    VALUES (pac1_id, '00000000-0000-0000-0000-000000000001', 'Laura López de Martínez', 'madre', '+52 33 9876 5432', 'laura.lopez@gmail.com', true, true, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF pac2_id IS NOT NULL THEN
    INSERT INTO familiares (paciente_id, clinica_id, nombre, parentesco, telefono, email, tiene_acceso_portal, es_contacto_emergencia, tutor_legal)
    VALUES (pac2_id, '00000000-0000-0000-0000-000000000001', 'Carmen Vega de Rodríguez', 'madre', '+52 33 5551 2345', 'carmen.vega@hotmail.com', true, true, true)
    ON CONFLICT DO NOTHING;
  END IF;

  IF pac3_id IS NOT NULL THEN
    INSERT INTO familiares (paciente_id, clinica_id, nombre, parentesco, telefono, email, tiene_acceso_portal, es_contacto_emergencia, tutor_legal)
    VALUES (pac3_id, '00000000-0000-0000-0000-000000000001', 'Jorge García Mendoza', 'padre', '+52 33 1122 3344', 'jorge.garcia@empresa.com', false, true, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
