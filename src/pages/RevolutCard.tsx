import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { CardArtifact } from '../components/revolut-card/CardArtifact'
import type { Dock } from '../components/artifact-panel/useArtifactPanel'
import {
  ParallaxDiagram,
  RoughnessDiagram,
  ThinFilmDiagram,
} from '../components/revolut-card/Diagrams'
import { PANEL_SPRING_CSS } from '../revolut-card/motionTokens'
import { BackLink, P, SectionTitle } from '../components/essay/Essay'
import { SANS, ink } from '../components/essay/tokens'

const SECTIONS = [
  { id: 'chrome', label: 'Introduction —' },
  { id: 'sample', label: 'Sample the room' },
  { id: 'parallax', label: 'The parallax tell' },
  { id: 'studio', label: 'The studio comes first' },
  { id: 'roughness', label: 'Roughness is blur' },
  { id: 'thin-film', label: 'Thin film' },
  { id: 'take', label: '— Conclusion' },
] as const

const DASH_RULE = {
  backgroundImage: `repeating-linear-gradient(to right, ${ink(28)} 0 4px, transparent 4px 9px)`,
} as const

/** Superscript link to footnote `n`. */
function Ref({ n }: { n: number }) {
  return (
    <sup>
      <a href={`#fn${n}`} className="text-text-muted no-underline hover:text-text-secondary">
        {n}
      </a>
    </sup>
  )
}

function TableOfContents() {
  const [activeId, setActiveId] = useState<string | null>(SECTIONS[0].id)
  const lockedToRef = useRef<string | null>(null)
  const unlockTimerRef = useRef(0)
  const unlockHandlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const elements = SECTIONS.map((s) => ({
      id: s.id,
      el: document.getElementById(s.id),
    })).filter(
      (s): s is { id: (typeof SECTIONS)[number]['id']; el: HTMLElement } =>
        s.el != null,
    )
    if (elements.length === 0) return

    let frame = 0

    const update = () => {
      frame = 0
      if (lockedToRef.current) return

      // Reading line near the top — once a heading crosses it, it stays active
      // until the next one does (so mid-section reading never clears the highlight).
      const probe = Math.min(120, window.innerHeight * 0.18)
      // Until a heading crosses the line (e.g. on load, above the title), the
      // reader is in the introduction.
      let next: string = elements[0].id
      for (const section of elements) {
        if (section.el.getBoundingClientRect().top <= probe) {
          next = section.id
        }
      }
      // The last heading sits too close to the page end to ever reach the probe.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) next = elements[elements.length - 1].id
      setActiveId(next)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (unlockHandlerRef.current) {
        window.removeEventListener('scrollend', unlockHandlerRef.current)
      }
      window.clearTimeout(unlockTimerRef.current)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const goToSection = (id: string) => {
    if (unlockHandlerRef.current) {
      window.removeEventListener('scrollend', unlockHandlerRef.current)
      unlockHandlerRef.current = null
    }
    window.clearTimeout(unlockTimerRef.current)

    lockedToRef.current = id
    setActiveId(id)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })

    const unlock = () => {
      lockedToRef.current = null
      unlockHandlerRef.current = null
      window.clearTimeout(unlockTimerRef.current)
    }
    unlockHandlerRef.current = unlock
    window.addEventListener('scrollend', unlock, { once: true })
    unlockTimerRef.current = window.setTimeout(unlock, 900)
  }

  return (
    <nav aria-label="On this page" className="sticky top-16 pt-0.5 sm:top-20">
      <ul className="space-y-1.5">
        {SECTIONS.map((section) => {
          const active = section.id === activeId
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  goToSection(section.id)
                }}
                className="block text-[13px] leading-snug tracking-[-0.01em] no-underline transition-[color,opacity] duration-150 ease-ui"
                style={{
                  fontFamily: SANS,
                  color: active ? ink(78) : ink(38),
                  opacity: active ? 1 : 0.92,
                }}
              >
                {section.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** `?leak` (or `?leak=N`) — screenshot mode: the first N lines of prose stay
 * sharp, everything below melts into a progressive blur. */
const LEAK_LINES = (() => {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('leak')
  if (v === null) return null
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : 3
})()

/** Layers stack cumulatively, each starting one line lower, so every line past
 * the cut is a touch softer than the one above (~0.5px → ~7px effective over
 * ten lines). */
const LEAK_BLURS = [0.5, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4]

/** Rendered inside the article, so only the essay column blurs. */
function LeakBlur({ lines }: { lines: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cut, setCut] = useState<{ top: number; line: number } | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const article = ref.current?.parentElement
      if (!article) return
      // Bottom of each rendered line of body prose (the title doesn't count).
      const bottoms: number[] = []
      const range = document.createRange()
      const paragraphs = article.querySelectorAll('p')
      for (const p of paragraphs) {
        range.selectNodeContents(p)
        for (const r of range.getClientRects()) {
          const last = bottoms[bottoms.length - 1]
          if (last === undefined || r.top >= last - 2) bottoms.push(r.bottom)
          else bottoms[bottoms.length - 1] = Math.max(last, r.bottom)
        }
        if (bottoms.length >= lines) break
      }
      const bottom = bottoms[Math.min(lines, bottoms.length) - 1]
      if (bottom === undefined || !paragraphs[0]) return
      setCut({
        top: bottom - article.getBoundingClientRect().top,
        line: Number.parseFloat(getComputedStyle(paragraphs[0]).lineHeight) || 28,
      })
    }
    measure()
    void document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [lines])

  return (
    <div
      ref={ref}
      aria-hidden
      // Bleeds a little past the column so glyphs at its edges blur too.
      className="pointer-events-none absolute -inset-x-4 bottom-0 z-40"
      style={{ top: cut?.top ?? 0, visibility: cut ? undefined : 'hidden' }}
    >
      {cut &&
        LEAK_BLURS.map((blur, i) => {
          // Fades in across a whole line, then holds to the bottom — the layers'
          // ramps butt up end to end, so the blur climbs without steps.
          const mask = `linear-gradient(to bottom, transparent ${i * cut.line}px, black ${(i + 1) * cut.line}px)`
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                maskImage: mask,
                WebkitMaskImage: mask,
              }}
            />
          )
        })}
    </div>
  )
}

/**
 * /artifacts/chrome-is-a-room — essay with the live card as the closing artifact.
 * Prose from docs/writing/chrome-is-a-room.md
 */
export default function RevolutCard() {
  const [layout, setLayout] = useState<{
    dock: Dock | null
    reserve: number
    animated: boolean
  }>({ dock: null, reserve: 0, animated: true })
  const { dock, reserve, animated } = layout

  // Stable identity + bail-out on no-op reports, or the panel's layout effect
  // re-fires every render and loops.
  const onDockChange = useCallback((dock: Dock | null, reserve: number, animated: boolean) => {
    setLayout((prev) =>
      prev.dock === dock && prev.reserve === reserve && prev.animated === animated
        ? prev
        : { dock, reserve, animated },
    )
  }, [])

  // Reserve the panel's footprint so the essay glides aside instead of hiding
  // behind it. Side docks only shift on wide screens (mobile panels overlay).
  const wide = typeof window !== 'undefined' && window.innerWidth >= 768
  const shift: CSSProperties =
    dock === 'right' && wide
      ? { paddingRight: reserve }
      : dock === 'left' && wide
        ? { paddingLeft: reserve }
        : {}

  // Share of the free space left of the content column. Centred (0.5) normally;
  // with a side panel open the column leans away from it, so the essay reads
  // further from the panel instead of hugging it.
  const lean = dock === 'right' && wide ? 0.2 : dock === 'left' && wide ? 0.8 : 0.5
  // The panel's own spring, so the essay and panel settle as one.
  const glide = animated ? PANEL_SPRING_CSS : '0s'

  return (
    <div
      className="min-h-dvh bg-surface dark:bg-base"
      style={{
        WebkitFontSmoothing: 'antialiased',
        ...shift,
        transition: `padding ${glide}`,
      }}
    >
      <div
        className="flex w-full max-w-[904px] gap-10 px-5 pb-24 pt-16 sm:px-6 sm:pt-20"
        style={{
          marginLeft: `max(0px, calc((100% - 904px) * ${lean}))`,
          transition: `margin-left ${glide}`,
        }}
      >
        <aside className="hidden w-[168px] shrink-0 self-stretch lg:block">
          <TableOfContents />
        </aside>

        <article className="relative min-w-0 w-full max-w-[640px]">
          <BackLink />
          <SectionTitle id="chrome" as="h1" first>
            Chrome is a room
          </SectionTitle>
          <P>
            This artifact is built around the simple question: what makes chrome look like
            chrome on a screen?
          </P>
          <P>
            Chrome is not a silver tint texture; it&apos;s a mirror. The environment is what
            you <em>actually</em> see, through softboxes
            <Ref n={1} />, horizon, dark floor.
          </P>
          <P>The card is the instrument. The room is the sound.</P>
          <P>
            I chose this artifact as a Revolut user and found particular interest in their
            exclusive &apos;Chrome&apos; edition debit card. I decided to use this as an
            excellent exercise to improve my design engineering skills.
          </P>
          <P>
            However, the claim only holds if tilting the Revolut card results in the
            reflection moving faster than the card itself.
          </P>

          <SectionTitle id="sample">Sample the room</SectionTitle>
          <P>
            Now that you visualize chrome as a mirror, the shading model
            <Ref n={2} />{' '}
            becomes embarrassingly small.
          </P>
          <P>
            Instead of placing lights in the scene and computing how bright each pixel is,
            you ask yourself: if I look at this surface from here, which direction does the
            bounce go, and what colour is the room in that direction?
          </P>
          <P>
            That bounce direction is given the name <strong>R</strong>, which is the
            reflection of the view off the normal.
          </P>

          <P>Softboxes only appear when R is pointing at them.</P>
          <P>
            Roughness, brush, and the rainbow are just ways of changing where you are
            looking in the room, how blurry that look is, or what tint remains, but
            they&apos;re not a separate lighting pass.
          </P>

          <SectionTitle id="parallax">The parallax tell</SectionTitle>
          <P>
            As I mentioned, R depends on both which way the surface faces (
            <strong>N</strong>) and where you&apos;re looking from (<strong>V</strong>).
          </P>
          <P>
            When the card is rotated by a little angle <strong>θ</strong>, the reflection
            direction swings by about <em>twice</em> that, roughly <strong>2θ</strong>. That
            doubling is why metal feels alive: the highlights race across the face faster
            than the card turns.
          </P>
          <ParallaxDiagram n={1} />

          <P>
            If the bright streak just follows the card, one-to-one, you&apos;re probably not
            sampling by R (but rather by UV or position instead).
          </P>
          <P>
            In this artifact, the card has springy mass under the pointer, but the
            reflections should still outrun it.
          </P>
          <P>That mismatch is the thesis made real.</P>

          <SectionTitle id="studio">The studio comes first</SectionTitle>
          <P>
            A chrome shader in an empty room still looks like dull grey since the material{' '}
            <em>is</em> the environment. The studio has to exist for the card to even look
            like metal.
          </P>
          <P>
            Try it on the card: switch off the studio light and the chrome goes flat.
          </P>

          <P>
            In this artifact, I built a small dark studio into an environment map: horizon
            band, softboxes, dark floor, slight warm/cool split. A second pass blurs the map
            into mips
            <Ref n={3} />{' '}
            so roughness can mean a blurrier view of the same room but not just a darker
            paint.
          </P>
          <P>
            WebGPU is a good fit here because that prefilter can run once on the GPU at
            load.
          </P>
          <P>
            The polished face sees that room in sharp focus while the etched lettering
            &apos;Revolut&apos; and &apos;J. PESCHARD&apos; sees the same room softer.
          </P>

          <SectionTitle id="roughness">Roughness is blur</SectionTitle>
          <P>
            Roughness here isn&apos;t &quot;how dark the metal is&quot;. It&apos;s how wide
            a cone of the room each pixel can gather, or which mip of the environment you
            read.
          </P>
          <RoughnessDiagram n={2} />

          <P>
            The face stays near-mirror (sharp studio) while the etched floors are rougher
            (out of focus studio). If you only darken the letters, they look printed.
            However, if you blur the room inside the cut, they look carved. The chip can be
            a third roughness (gold, a bit softer than the face).
          </P>
          <P>
            Most importantly, it&apos;s the same environment map throughout; only the
            sharpness changes.
          </P>

          <SectionTitle id="thin-film">Thin film</SectionTitle>
          <P>
            The rainbow is a thin coating on the steel (PVD), not a colour filter painted on
            the card.
          </P>
          <P>
            A colourless film that is a few hundred nanometres thick makes light bounce from
            the top of the film and from the metal underneath. Those two paths differ by
            about a wavelength, so some colours reinforce and others cancel out.
          </P>

          <P>
            Tilt the card and the path length changes, so the surviving colours move. In
            this artifact, the hues are authored on purpose to match Revolut&apos;s card,
            and interference/view is what <em>moves</em> them.
          </P>
          <ThinFilmDiagram n={3} />
          <P>
            Ordering matters here: put the iridescent result into <strong>F0</strong> (the
            metal&apos;s base reflectance) so Fresnel scales the environment sample. The
            colour only shows when there is reflection and blacks stay black.
          </P>
          <P>
            Tint the final pixel instead and the dark areas go coloured too, but it reads as
            a filter over a render, not a coating on metal.
          </P>

          <SectionTitle id="take">My take</SectionTitle>
          <P>
            Chrome reads as metal when you show a room, not when you shade a surface. If it
            still looks &quot;almost&quot;, check whether the reflections are outrunning the
            tilt.
          </P>

          <CardArtifact onDockChange={onDockChange} />

          <footer className="mt-14 pt-8">
            <div className="mb-8 h-px w-full" aria-hidden style={DASH_RULE} />
            <ol
              className="space-y-3 text-[13px] leading-relaxed tracking-[-0.01em]"
              style={{ fontFamily: SANS, color: ink(45) }}
            >
              <li id="fn1">
                <span className="font-medium" style={{ color: ink(55) }}>1.</span> A softbox is a
                big, diffused studio light: a glowing panel that gives soft, even light. On
                chrome it shows up as a clean bright streak.
              </li>
              <li id="fn2">
                <span className="font-medium" style={{ color: ink(55) }}>2.</span> The algorithm used in
                computer graphics to compute how light interacts with a 3D surface to
                determine its final colour and brightness.
              </li>
              <li id="fn3">
                <span className="font-medium" style={{ color: ink(55) }}>3.</span> A mip is a pre-blurred
                and tinier copy of a texture. Graphics cards store a chain of them (from
                sharp to soft) so that a surface can sample a blurrier version of the same
                image without having to blur it live every frame.
              </li>
            </ol>
          </footer>
          {LEAK_LINES && <LeakBlur lines={LEAK_LINES} />}
        </article>
      </div>
    </div>
  )
}
