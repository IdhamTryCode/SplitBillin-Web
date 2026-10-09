import Image from 'next/image'
import markDark from '@/assets/brand/mark-dark.png'
import markLight from '@/assets/brand/mark-light.png'
import wordmarkDark from '@/assets/brand/wordmark-dark.png'
import wordmarkLight from '@/assets/brand/wordmark-light.png'
import { cn } from '@/lib/utils'

interface LogoProps {
  /** `full` = mark + wordmark, `mark` = the icon alone, `wordmark` = the text alone. */
  variant?: 'full' | 'mark' | 'wordmark'
  /** Height of the mark in pixels; the wordmark scales with it. */
  size?: number
  className?: string
}

/**
 * Brand logo. Each piece ships in two transparent versions and the theme class
 * picks one, so it reads on both the light and the dark canvas.
 */
export function Logo({ variant = 'full', size = 28, className }: LogoProps) {
  const wordHeight = Math.round(size * 0.74)
  const wordWidth = Math.round((wordHeight * wordmarkLight.width) / wordmarkLight.height)

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {variant !== 'wordmark' && (
        <>
          <Image src={markLight} alt="" width={size} height={size} className="dark:hidden" priority />
          <Image src={markDark} alt="" width={size} height={size} className="hidden dark:block" priority />
        </>
      )}
      {variant !== 'mark' && (
        <>
          <Image
            src={wordmarkLight}
            alt=""
            width={wordWidth}
            height={wordHeight}
            className="dark:hidden"
            priority
          />
          <Image
            src={wordmarkDark}
            alt=""
            width={wordWidth}
            height={wordHeight}
            className="hidden dark:block"
            priority
          />
        </>
      )}
      <span className="sr-only">SplitBillin</span>
    </span>
  )
}
