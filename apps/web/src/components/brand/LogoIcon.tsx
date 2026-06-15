import { clsx } from 'clsx'

interface LogoIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 'w-7 h-7',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
}

export default function LogoIcon({ size = 'sm', className }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={clsx('shrink-0', sizeMap[size], className)}
    >
      <defs>
        <linearGradient id="aj-logo-bg" x1="64" y1="48" x2="448" y2="464" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#aj-logo-bg)" />
      <circle cx="188" cy="176" r="52" fill="#fff" fillOpacity="0.96" />
      <circle cx="324" cy="214" r="40" fill="#fff" fillOpacity="0.96" />
      <path
        d="M136 292C168 356 220 392 256 392C292 392 344 356 376 292"
        stroke="#fff"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M208 356L256 332L304 356V404C304 404 280 418 256 418C232 418 208 404 208 404V356Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      <path d="M256 332V418" stroke="#6366F1" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}
