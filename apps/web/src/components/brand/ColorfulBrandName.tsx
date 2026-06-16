import { clsx } from 'clsx'

type BrandSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ColorfulBrandNameProps {
  size?: BrandSize
  className?: string
}

const WORDS = [
  {
    text: 'APRENDAMOS',
    colors: ['#E91E8C', '#8BC34A', '#2E7D32', '#2563EB', '#F472B6', '#A78BFA', '#7C3AED', '#84CC16', '#166534', '#9D174D'],
    rotations: [-4, 3, -2, 4, -3, 2, -4, 3, -2, 4],
  },
  {
    text: 'JUNTOS',
    colors: ['#F59E0B', '#EF4444', '#22C55E', '#EC4899', '#06B6D4', '#3B82F6'],
    rotations: [-3, 4, -2, 3, -4, 2],
  },
] as const

const sizeConfig: Record<BrandSize, { w: number; h: number; text: string; rowGap: string }> = {
  xs: { w: 10, h: 12, text: 'text-[7px]', rowGap: 'gap-y-0.5' },
  sm: { w: 11, h: 14, text: 'text-[8px]', rowGap: 'gap-y-0.5' },
  md: { w: 13, h: 16, text: 'text-[9px]', rowGap: 'gap-y-1' },
  lg: { w: 15, h: 18, text: 'text-[10px]', rowGap: 'gap-y-1' },
  xl: { w: 18, h: 22, text: 'text-xs', rowGap: 'gap-y-1.5' },
}

function LetterBlock({
  letter,
  color,
  rotation,
  w,
  h,
  textClass,
}: {
  letter: string
  color: string
  rotation: number
  w: number
  h: number
  textClass: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center font-extrabold leading-none text-white',
        textClass
      )}
      style={{
        width: w,
        height: h,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        marginLeft: -1,
        marginRight: -1,
        borderRadius: 2,
      }}
    >
      {letter}
    </span>
  )
}

export default function ColorfulBrandName({ size = 'sm', className }: ColorfulBrandNameProps) {
  const cfg = sizeConfig[size]

  return (
    <div className={clsx('flex flex-col items-center', cfg.rowGap, className)} aria-label="Aprendamos Juntos">
      {WORDS.map((word) => (
        <div key={word.text} className="flex items-center justify-center">
          {word.text.split('').map((letter, i) => (
            <LetterBlock
              key={`${word.text}-${i}`}
              letter={letter}
              color={word.colors[i % word.colors.length]}
              rotation={word.rotations[i % word.rotations.length]}
              w={cfg.w}
              h={cfg.h}
              textClass={cfg.text}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
