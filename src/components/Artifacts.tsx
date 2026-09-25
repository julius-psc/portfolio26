import { EncryptedText } from '@/components/ui/encrypted-text'
import DotGlyph from '@/components/DotGlyph'
import SectionTitle from '@/components/SectionTitle'

type Artifact = {
  title: string
  href: string
  /** Pins the glyph instead of deriving it from the title (see DotGlyph). */
  dots?: number
}

const artifacts: Artifact[] = [
  {
    title: 'Chrome is a room',
    href: '/artifacts/chrome-is-a-room',
    dots: 0b011101010,
  },
]

const LARGE_DOTS = 5

/** Picks LARGE_DOTS of the nine dots from a hash of the title, so every
 * generated glyph is equally full but each article gets its own pattern. */
function dotsFromTitle(title: string) {
  let hash = 0
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) >>> 0

  // Seeded Fisher–Yates over the nine positions, keeping the first few.
  const order = Array.from({ length: 9 }, (_, i) => i)
  for (let i = 8; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0
    const j = hash % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order.slice(0, LARGE_DOTS).reduce((mask, i) => mask | (1 << i), 0)
}

export default function Artifacts() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-4 w-full max-w-[520px]">

        <SectionTitle>Artifacts</SectionTitle>

        <div className="flex flex-col gap-3">
          {artifacts.map((artifact) => (
            <a
              key={artifact.href}
              href={artifact.href}
              onClick={(e) => {
                e.preventDefault()
                history.pushState(null, '', artifact.href)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="w-fit flex items-center gap-2.5"
            >
              <DotGlyph dots={artifact.dots ?? dotsFromTitle(artifact.title)} />
              <EncryptedText
                text={artifact.title}
                className="text-sm font-medium tracking-[-0.01em]"
                encryptedClassName="text-primary"
                revealedClassName="text-primary"
                revealDelayMs={40}
                flipDelayMs={40}
              />
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
