// Shared by the label and its rule, so they read as one grey line.
const SUBTLE = 'color-mix(in oklch, var(--color-primary) 28%, transparent)'

/** Home-page section heading: the label, then a dotted rule running to the
 * column's edge — the same dots as the ring around the profile picture. */
export default function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs font-medium tracking-[-0.01em]" style={{ color: SUBTLE }}>
        {children}
      </h2>
      <svg aria-hidden className="h-0.5 flex-1 overflow-visible">
        {/* Starts half a dot in, so the first round cap isn't clipped. */}
        <line
          x1="0.625"
          y1="1"
          x2="100%"
          y2="1"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="0 4"
          style={{ stroke: SUBTLE }}
        />
      </svg>
    </div>
  )
}
