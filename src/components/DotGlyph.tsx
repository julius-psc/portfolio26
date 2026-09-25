// Same ink as the section title's dotted rule.
const SUBTLE = 'color-mix(in oklch, var(--color-primary) 28%, transparent)'

/** The mark beside each home-page list entry: a 3×3 dot grid where bit i of
 * `dots` makes dot i large. Bit 0 is the top-left dot and bit 8 the
 * bottom-right, so a binary literal reads the grid backwards. Small dots keep
 * every glyph the same footprint. */
export default function DotGlyph({ dots }: { dots: number }) {
  return (
    <svg aria-hidden width="11" height="11" viewBox="0 0 11 11" className="shrink-0">
      {Array.from({ length: 9 }, (_, i) => (
        <circle
          key={i}
          cx={1.5 + (i % 3) * 4}
          cy={1.5 + Math.floor(i / 3) * 4}
          r={dots & (1 << i) ? 1.25 : 0.55}
          style={{ fill: SUBTLE }}
        />
      ))}
    </svg>
  )
}
