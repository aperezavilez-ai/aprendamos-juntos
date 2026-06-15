type PacienteLike = {
  nombre: string
  apellidos?: string
  foto_url?: string | null
}

const SIZES = {
  sm: { box: 'w-12 h-12 rounded-2xl', text: 'text-xl' },
  md: { box: 'w-16 h-16 rounded-2xl', text: 'text-2xl' },
  lg: { box: 'w-24 h-24 rounded-3xl', text: 'text-3xl' },
}

export default function PacienteAvatar({
  paciente,
  size = 'sm',
}: {
  paciente: PacienteLike
  size?: keyof typeof SIZES
}) {
  const { box, text } = SIZES[size]

  if (paciente.foto_url) {
    return (
      <img
        src={paciente.foto_url}
        alt={`${paciente.nombre} ${paciente.apellidos || ''}`.trim()}
        className={`${box} object-cover shrink-0 bg-primary-50`}
      />
    )
  }

  return (
    <div className={`${box} bg-primary-100 flex items-center justify-center font-bold text-primary-600 shrink-0 ${text}`}>
      {paciente.nombre[0]}
    </div>
  )
}
