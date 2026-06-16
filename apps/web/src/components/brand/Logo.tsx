import Link from 'next/link'
import LogoIcon from './LogoIcon'
import ColorfulBrandName from './ColorfulBrandName'
import { clsx } from 'clsx'

function isBrandSubtitle(text: string) {
  return text.trim().toLowerCase() === 'aprendamos juntos'
}

interface LogoProps {
  subtitle?: string
  href?: string | null
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  /** stacked: imagen arriba del texto; inline: imagen al lado */
  layout?: 'stacked' | 'inline'
  align?: 'start' | 'center'
  variant?: 'default' | 'light'
}

export default function Logo({
  subtitle,
  href = '/dashboard',
  iconSize = 'sm',
  className,
  showText = true,
  layout = 'stacked',
  align = 'center',
  variant = 'default',
}: LogoProps) {
  const content = (
    <>
      <LogoIcon size={iconSize} />
      {showText && (
        <div className={clsx('min-w-0 w-full', align === 'center' ? 'flex flex-col items-center' : 'items-start')}>
          <ColorfulBrandName size={iconSize} />
          {subtitle && !isBrandSubtitle(subtitle) && (
            <p
              className={clsx(
                'text-2xs mt-1.5 leading-none truncate max-w-full text-center px-1',
                variant === 'light' ? 'text-primary-100' : 'text-neutral-400'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </>
  )

  const wrapperClass = clsx(
    'group w-full',
    layout === 'stacked'
      ? clsx('flex flex-col gap-2', align === 'start' ? 'items-start' : 'items-center')
      : clsx('flex items-center gap-2.5', align === 'start' ? 'justify-start' : 'justify-center'),
    className
  )

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {content}
      </Link>
    )
  }

  return <div className={wrapperClass}>{content}</div>
}
