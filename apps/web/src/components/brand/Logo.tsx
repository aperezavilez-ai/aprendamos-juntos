import Link from 'next/link'
import LogoIcon from './LogoIcon'
import { clsx } from 'clsx'

interface LogoProps {
  subtitle?: string
  href?: string | null
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

export default function Logo({
  subtitle,
  href = '/dashboard',
  iconSize = 'sm',
  className,
  showText = true,
}: LogoProps) {
  const content = (
    <>
      <LogoIcon size={iconSize} className="shadow-sm" />
      {showText && (
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 text-sm leading-none">Aprendamos Juntos</p>
          {subtitle && (
            <p className="text-2xs text-neutral-400 mt-0.5 leading-none truncate max-w-[130px]">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </>
  )

  const wrapperClass = clsx('flex items-center gap-2.5 group', className)

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {content}
      </Link>
    )
  }

  return <div className={wrapperClass}>{content}</div>
}
