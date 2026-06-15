'use client'

const RELACION_LABEL: Record<string, string> = {
  padre: 'Padre',
  madre: 'Madre',
  tutor: 'Tutor legal',
  emergencia: 'Contacto de emergencia',
}

type Props = {
  data: {
    usuario: { nombre: string; apellidos: string; email: string }
    familiar?: { tipo_relacion: string; paciente?: { nombre: string; apellidos: string } }
  }
}

export default function PerfilClient({ data }: Props) {
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="text-sm font-bold text-neutral-800 mb-4">Tu cuenta</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-neutral-500">Nombre</dt>
            <dd className="font-medium text-neutral-900">
              {data.usuario.nombre} {data.usuario.apellidos}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Email</dt>
            <dd className="font-medium text-neutral-900">{data.usuario.email}</dd>
          </div>
          {data.familiar && (
            <div>
              <dt className="text-neutral-500">Relación</dt>
              <dd className="font-medium text-neutral-900">
                {RELACION_LABEL[data.familiar.tipo_relacion] || data.familiar.tipo_relacion}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {data.familiar?.paciente && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-neutral-800 mb-4">Paciente vinculado</h2>
          <p className="font-semibold text-neutral-900">
            {data.familiar.paciente.nombre} {data.familiar.paciente.apellidos}
          </p>
        </div>
      )}
    </div>
  )
}
