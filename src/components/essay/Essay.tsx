import type { ReactNode } from 'react'
import { SANS, ink } from './tokens'

/* Long-form typography, shared by the essay and the sandbox studies. */

export function P({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-4 text-[1.05rem] leading-[1.65] tracking-[-0.015em]"
      style={{ fontFamily: SANS, textWrap: 'pretty', color: ink(75) }}
    >
      {children}
    </p>
  )
}

export function SectionTitle({
  id,
  children,
  as: Tag = 'h2',
  first = false,
}: {
  /** Anchor for a table of contents. */
  id?: string
  children: ReactNode
  as?: 'h1' | 'h2'
  first?: boolean
}) {
  return (
    <Tag
      id={id}
      className={`mb-5 scroll-mt-24 text-[1.05rem] font-medium leading-snug tracking-[-0.02em] ${first ? '' : 'mt-12'}`}
      style={{ fontFamily: SANS, color: ink(85) }}
    >
      {children}
    </Tag>
  )
}

const RING_SIZE = 29
const RING_RADIUS = 8.5
const RING_PERIMETER = 4 * (RING_SIZE - 2 * RING_RADIUS) + 2 * Math.PI * RING_RADIUS
// ~4px between dots, stretched so a whole number of them fits the perimeter —
// otherwise the leftover gap bunches two dots together where the path closes.
const RING_DOT_GAP = RING_PERIMETER / Math.round(RING_PERIMETER / 4)

/** Back to the portfolio home — arrow chip on a near-page grey, ringed by a
 * sparse dotted border just outside it. */
export function BackLink() {
  return (
    <a
      href="/"
      aria-label="Back to juliuspeschard.com"
      className="group relative mb-10 flex size-6 items-center justify-center rounded-md transition-colors duration-150 ease-ui"
      style={{ background: ink(6), color: ink(60) }}
    >
      {/* SVG ring rather than a CSS dotted outline, so the dot spacing is ours.
          Chip is 24px; ring sits 3px outside it. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -left-[3px] -top-[3px]"
        width="30"
        height="30"
        viewBox="0 0 30 30"
      >
        <rect
          x="0.5"
          y="0.5"
          width={RING_SIZE}
          height={RING_SIZE}
          rx={RING_RADIUS}
          fill="none"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray={`0 ${RING_DOT_GAP}`}
          style={{ stroke: ink(28) }}
        />
      </svg>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-150 ease-ui group-hover:[color:var(--back-hover)]"
        style={{ ['--back-hover' as string]: ink(85) }}
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </a>
  )
}
