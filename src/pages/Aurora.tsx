import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IconArrowLeft, IconSunsetFilled } from '@tabler/icons-react'
import { motion, AnimatePresence, type Variants } from 'motion/react'
import { Drawer } from 'vaul'
import { surface, text, border, radius } from '../lib/aurora-tokens'
import { haptics } from '../lib/haptics'
import logoSvg           from '../assets/aur0ra/Logo.svg'
import provenceBackdrop  from '../assets/aur0ra/Provence-Backdrop.png'
import planeIcon         from '../assets/aur0ra/Plane Icon.svg'
import audioLinesIcon    from '../assets/aur0ra/AudioLines.svg'
import designSystemImg   from '../assets/aur0ra/Design-System.png'
import figmaShowcaseImg  from '../assets/aur0ra/Figma-Showcase.png'

const SF_PRO    = '"SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const PLAYFAIR  = '"Playfair Display", serif'
import PhoneFrame, { FRAME_W, FRAME_H } from '../components/aurora/PhoneFrame'
import DiscoverScreen from '../components/aurora/DiscoverScreen'

const DISPLAY_SCALE = 0.65

// ─── Scroll-driven bg interpolation ───────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

const LIGHT = [0xF2, 0xEE, 0xE8] // text.primary  (#F2EEE8)
const DARK  = [0x13, 0x13, 0x13] // page resting dark (#131313)

function interpolateBg(t: number) {
  const [r, g, b] = LIGHT.map((c, i) => Math.round(lerp(c, DARK[i], t)))
  return `rgb(${r},${g},${b})`
}

// ─── Animation variants ────────────────────────────────────────────────────────

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

const reveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}

const revealText: Variants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className="text-xs font-medium opacity-40 tracking-[-0.01em]"
      style={{ color: light ? text.primary : text.inverse }}
    >
      {children}
    </span>
  )
}

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="w-full overflow-hidden flex items-center justify-center"
      style={{
        aspectRatio: '4 / 3',
        borderRadius: radius.lg,
        background: surface.glass,
        border: `1px solid ${border.default}`,
      }}
    >
      <span className="text-xs font-mono opacity-20 tracking-wide" style={{ color: text.primary }}>
        {label}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Aurora() {
  const heroRef       = useRef<HTMLDivElement>(null)

  const [heroHeight, setHeroHeight] = useState(0)
  const [progress, setProgress]     = useState(0)
  const [drawerOpen, setDrawerOpen]           = useState(false)
  const [drawerMode, setDrawerMode]           = useState<'ask' | 'listen'>('ask')
  const [isListening, setIsListening]         = useState(false)
  const [drawerContainer, setDrawerContainer] = useState<HTMLElement | null>(null)
  const [listenPhase, setListenPhase]   = useState<'idle' | 'voice' | 'thinking' | 'done'>('idle')
  const [listenCompleted, setListenCompleted] = useState(false)
  const [provenceUpdated, setProvenceUpdated] = useState(false)
  const [confirmedProvence, setConfirmedProvence] = useState(false)
  const [islandState, setIslandState]   = useState<'idle' | 'confirmed' | 'confirmed-updated' | 'updated'>('idle')
  const protoRef       = useRef<HTMLDivElement>(null)
  const phoneScrollRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef   = useCallback((el: HTMLDivElement | null) => { if (el) setDrawerContainer(el) }, [])
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)
  const pressHandled   = useRef(false)
  const islandTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastIslandTime = useRef(0)

  const listeningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerIsland = (state: 'confirmed' | 'confirmed-updated' | 'updated') => {
    const now = Date.now()
    if (now - lastIslandTime.current < 3000) return   // 3 s cooldown between triggers
    lastIslandTime.current = now
    if (islandTimer.current) clearTimeout(islandTimer.current)
    setIslandState(state)
    islandTimer.current = setTimeout(() => setIslandState('idle'), 3500)
  }

  const handleConfirm = () => {
    haptics.trigger('success')
    setConfirmedProvence(true)
    triggerIsland(provenceUpdated ? 'confirmed-updated' : 'confirmed')
  }

  const startLongPress = () => {
    longPressFired.current = false
    pressHandled.current   = false
    // Show listening indicator only after a short hold — not on a fast tap
    listeningTimer.current = setTimeout(() => setIsListening(true), 180)
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
    }, 350)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (listeningTimer.current) clearTimeout(listeningTimer.current)
    setIsListening(false)
    if (longPressFired.current && !pressHandled.current) {
      pressHandled.current = true
      haptics.trigger('medium')
      setDrawerMode('listen')
      setDrawerOpen(true)
    }
  }
  const handleClick = () => {
    if (longPressFired.current) return
    haptics.trigger('selection')
    setDrawerMode('ask')
    setDrawerOpen(true)
  }

  const handleAdjust = () => {
    haptics.trigger('light')
    setShowSuggestions(true)
    setDrawerMode('ask')
    setDrawerOpen(true)
  }

  useLayoutEffect(() => {
    const measure = () => {
      if (heroRef.current) setHeroHeight(heroRef.current.offsetHeight)
    }
    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (listenPhase === 'done') setListenCompleted(true)
  }, [listenPhase])

  useEffect(() => {
    if (drawerMode !== 'listen' || !drawerOpen) { setListenPhase('idle'); return }
    setListenPhase('idle')
    const t1 = setTimeout(() => setListenPhase('voice'),    100)
    const t2 = setTimeout(() => setListenPhase('thinking'), 520)
    const t3 = setTimeout(() => setListenPhase('done'),     1800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [drawerMode, drawerOpen])

  useEffect(() => {
    if (!heroHeight) return
    const start = heroHeight * 0.1
    const end   = heroHeight * 0.55
    const compute = () => {
      const t = Math.max(0, Math.min(1, (window.scrollY - start) / (end - start)))
      setProgress(t)
    }
    window.addEventListener('scroll', compute, { passive: true })
    compute()
    return () => window.removeEventListener('scroll', compute)
  }, [heroHeight])

  const heroTextColor = `rgb(${DARK.map((c, i) => Math.round(lerp(c, LIGHT[i], progress))).join(',')})`

  return (
    <main
      className="min-h-screen pb-40"
      style={{ backgroundColor: interpolateBg(progress) }}
    >

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center px-4 sm:px-0">
        <motion.div
          ref={heroRef}
          className="w-full max-w-[520px] pt-16 pb-16 flex flex-col gap-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.button
            variants={item}
            onClick={() => {
              haptics.trigger('selection')
              window.history.pushState({}, '', '/')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }}
            className="flex items-center gap-1.5 text-xs font-medium opacity-40 hover:opacity-100 transition-opacity w-fit"
            style={{ color: heroTextColor }}
          >
            <IconArrowLeft size={12} />
            Back
          </motion.button>

          <motion.span
            variants={item}
            className="text-xs font-medium opacity-40 tracking-[-0.01em]"
            style={{ color: heroTextColor }}
          >
            Founding Product Designer · Open Brief
          </motion.span>

          <motion.div variants={item} className="flex flex-col gap-4">
            <h1
              className="text-2xl font-semibold tracking-[-0.025em] leading-tight"
              style={{ color: heroTextColor, textWrap: 'balance' } as React.CSSProperties}
            >
              Aurora — Inspiration Page
            </h1>
            <p
              className="text-sm font-medium opacity-60 tracking-[-0.01em] leading-[1.7]"
              style={{ color: heroTextColor, textWrap: 'pretty' } as React.CSSProperties}
            >
              The brief was four words: "design the inspiration page." I sent a live
              prototype instead of a Figma file.
            </p>
          </motion.div>

          <motion.button
            variants={item}
            onClick={() => protoRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs font-mono opacity-20 hover:opacity-40 transition-opacity tracking-wide text-left w-fit"
            style={{ color: heroTextColor, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            ↓ interact with the prototype
          </motion.button>
        </motion.div>
      </div>

      {/* ── PROTOTYPE ─────────────────────────────────────────────────────────── */}
      <div ref={protoRef} className="w-full flex flex-col items-center gap-16 py-24 px-4">

        {/* Frame 1 — discover screen inside phone shell */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          style={{ width: FRAME_W * DISPLAY_SCALE, height: FRAME_H * DISPLAY_SCALE }}
        >
          <PhoneFrame surfaceRef={containerRef} islandState={islandState} style={{ transform: `scale(${DISPLAY_SCALE})`, transformOrigin: 'top left' }}>
            {/* Single relative wrapper fills the content slot */}
            <div style={{ flex: 1, alignSelf: 'stretch', position: 'relative', overflow: 'hidden' }}>

              {/* Scrollable content — owns the dark background */}
              <div
                ref={phoneScrollRef}
                className="hide-scrollbar"
                data-lenis-prevent
                style={{
                  position:        'absolute',
                  inset:           0,
                  overflowY:       'scroll',
                  scrollbarWidth:  'none',
                  background:      surface.base,
                }}
              >
                <DiscoverScreen provenceUpdated={provenceUpdated} confirmedProvence={confirmedProvence} onConfirm={handleConfirm} onAdjust={handleAdjust} onCardConfirm={() => triggerIsland('confirmed')} phoneScrollRef={phoneScrollRef} />
              </div>

              {/* Bottom gradient fade mask — pointer-events:none so scroll passes through */}
              <div
                style={{
                  position:       'absolute',
                  bottom:         0,
                  left:           0,
                  right:          0,
                  height:         130,
                  zIndex:         10,
                  background:     `linear-gradient(to bottom, transparent 0%, ${surface.base} 100%)`,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'flex-end',
                  gap:            8,
                  paddingBottom:  20,
                  pointerEvents:  'none',
                }}
              >
                {isListening && (
                  <span style={{
                    color:      '#F86405',
                    fontFamily: '"Playfair Display", serif',
                    fontSize:   14,
                    fontWeight: 400,
                    fontStyle:  'italic',
                  }}>
                    Listening<span className="ellipsis-dot">.</span><span className="ellipsis-dot">.</span><span className="ellipsis-dot">.</span>
                  </span>
                )}
                <button
                  className="btn-press"
                  style={{ pointerEvents: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}
                  onClick={handleClick}
                  onMouseDown={startLongPress}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onTouchStart={startLongPress}
                  onTouchEnd={cancelLongPress}
                >
                  {/* Glow — springs in from below; inner layer drifts + shifts shades while listening */}
                  <motion.div
                    aria-hidden
                    initial={{ y: 22, opacity: 0 }}
                    animate={isListening ? { y: -4, opacity: 1 } : { y: 22, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.45, bounce: 0 }}
                    style={{
                      position:      'absolute',
                      top:           '50%',
                      left:          '50%',
                      width:         72,
                      height:        72,
                      marginTop:     -36,
                      marginLeft:    -36,
                      pointerEvents: 'none',
                      zIndex:        0,
                    }}
                  >
                    <motion.div
                      animate={isListening ? {
                        x:      [0, 4, -3, 5, -2, 0],
                        y:      [0, -5, 3, -6, 2, 0],
                        scale:  [1, 1.1, 0.9, 1.08, 0.94, 1],
                        filter: [
                          'blur(9px) hue-rotate(0deg)',
                          'blur(9px) hue-rotate(-14deg)',
                          'blur(9px) hue-rotate(9deg)',
                          'blur(9px) hue-rotate(-7deg)',
                          'blur(9px) hue-rotate(5deg)',
                          'blur(9px) hue-rotate(0deg)',
                        ],
                      } : {
                        x: 0, y: 0, scale: 1,
                        filter: 'blur(9px) hue-rotate(0deg)',
                      }}
                      transition={isListening
                        ? { duration: 3.8, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }
                        : { duration: 0 }
                      }
                      style={{
                        width:        '100%',
                        height:       '100%',
                        borderRadius: '50%',
                        background:   'radial-gradient(ellipse at 50% 72%, rgba(248,100,5,0.58) 0%, rgba(248,100,5,0.24) 42%, transparent 68%)',
                      }}
                    />
                  </motion.div>
                  <img
                    src={logoSvg}
                    alt="AUR0RA"
                    style={{
                      width: 48, height: 49, display: 'block',
                      position: 'relative', zIndex: 1,
                    }}
                  />
                </button>
              </div>

            </div>
          </PhoneFrame>
        </motion.div>


      </div>

      {/* ── PROCESS ───────────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center px-4 sm:px-0">
        <div className="w-full max-w-[520px] flex flex-col gap-10 pb-16">

          <motion.div
            variants={revealText}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="flex flex-col gap-3"
          >
            <SectionLabel light>[How it was built]</SectionLabel>
            <p className="text-sm font-medium opacity-60 tracking-[-0.01em] leading-[1.65]" style={{ color: text.primary }}>
              Design system first to lock the tokens. Figma to scope the screens. Then code — because a live prototype makes the argument better than any static file.
            </p>
          </motion.div>

          {/* Design System + Figma side by side */}
          <motion.div
            variants={revealText}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            style={{ display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <div style={{ width: 160, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#1E1E1E' }}>
              <img src={designSystemImg} alt="Aurora design system" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', background: '#1E1E1E' }}>
              <img src={figmaShowcaseImg} alt="Aurora Figma screens" style={{ width: '100%', display: 'block' }} />
            </div>
          </motion.div>

          {/* User flow */}
          <motion.div
            variants={revealText}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="flex flex-col gap-4"
          >
            <SectionLabel light>[User flow]</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 8 }}>
              {[
                'Greeting surfaces context',
                'Swipe cards to browse',
                'Confirm or adjust',
                'Message or hold to voice',
                'Card updates live',
              ].map((step, i, arr) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <span
                    style={{
                      color:        text.primary,
                      fontFamily:   SF_PRO,
                      fontSize:     12,
                      fontWeight:   400,
                      opacity:      0.55,
                      padding:      '5px 10px',
                      borderRadius: 999,
                      border:       `0.5px solid ${border.default}`,
                      whiteSpace:   'nowrap',
                    }}
                  >
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <span style={{ color: text.primary, opacity: 0.2, fontSize: 11, padding: '0 4px' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── COPY SECTIONS ─────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center px-4 sm:px-0">
        <div className="w-full max-w-[520px] flex flex-col gap-16 pb-4">

          {([
            {
              label: '[Decisions]',
              items: [
                'Context in language, not UI chips',
                'Editing without leaving the card',
              ],
            },
            {
              label: '[Assumptions]',
              items: [
                '"Inspiration page" means the in-app discovery surface, not a marketing page — Aurora\'s own copy lists "inspirational content" as a product feature, not a site section.',
                'The member wants conclusions, not options. Confirm/Adjust, never browse/search.',
                'One persona, one coherent life, beats generic placeholder content across five cards.',
              ],
            },
            {
              label: '[Inferred from public materials]',
              items: [
                'The visual language — dark, glass cards over photography, the O orb — comes from your launch video and site screenshots, not invention.',
                'The card → conversational edit → updated card flow already exists in your own concept mockups. I built it working, not simulated.',
                'Everything else — the greeting weaving context into language, the reasoning threads, the card stack — is mine, built on top of what you\'d shown.',
              ],
            },
            {
              label: '[What I\'d validate with real members]',
              items: [
                'Whether "confidence" (why Aurora surfaced something) needs to be visible by default, or only on demand, for members who don\'t want to see the machinery.',
                'Where the line sits between "confirm silently" and "notify me" — a $10k/year member\'s tolerance for autonomous action is a research question, not a guess.',
                'Whether voice-first is actually preferred over text for this demographic, or whether it\'s an assumption carried over from the launch video.',
              ],
            },
          ] as const).map(({ label, items }) => (
            <motion.div
              key={label}
              variants={revealText}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              className="flex flex-col gap-5"
            >
              <SectionLabel light>{label}</SectionLabel>
              <div className="flex flex-col gap-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-baseline gap-4">
                    <span className="text-[10px] font-mono opacity-25 tracking-widest flex-shrink-0" style={{ color: text.primary }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium opacity-60 tracking-[-0.01em] leading-[1.65]" style={{ color: text.primary }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          <motion.div
            variants={revealText}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            className="flex flex-col gap-3"
          >
            <SectionLabel light>[The bet]</SectionLabel>
            <span className="text-sm font-medium opacity-60 tracking-[-0.01em]" style={{ color: text.primary }}>
              One working prototype beats twelve static screens.
            </span>
          </motion.div>

        </div>
      </div>

      {/* ── AURORA DRAWER — renders inside the phone frame via container prop ── */}
      <Drawer.Root shouldScaleBackground={false} open={drawerOpen} onOpenChange={(open) => {
        setDrawerOpen(open)
        if (!open) {
          if (drawerMode === 'listen' && listenCompleted) {
            setProvenceUpdated(true)
            triggerIsland('updated')
          }
          setShowSuggestions(false)
        }
      }}>
        <Drawer.Portal container={drawerContainer ?? undefined}>
          <Drawer.Overlay
            style={{
              position:   'absolute',
              inset:      0,
              zIndex:     9,
              background: 'rgba(0, 0, 0, 0.4)',
            }}
          />
          <Drawer.Content
            data-vaul-custom-container="true"
            style={{
              position:        'absolute',
              bottom:          0,
              left:            0,
              right:           0,
              minHeight:       drawerMode === 'listen' ? 460 : 300,
              maxHeight:       '90%',
              display:         'flex',
              flexDirection:   'column',
              justifyContent:  'space-between',
              zIndex:        11,
              borderRadius:  `${radius.lg}px ${radius.lg}px 0 0`,
              background:    '#17140F',
              outline:       'none',
            }}
          >
            {/* Drag handle */}
            <Drawer.Handle
              style={{
                width:        36,
                height:       4,
                borderRadius: 999,
                background:   'rgba(242,238,232,0.2)',
                margin:       '12px auto 4px',
              }}
            />

            {/* Content */}
            <div
              className="hide-scrollbar"
              style={{
                display:       'flex',
                flex:          1,
                padding:       '16px 20px 12px',
                flexDirection: 'column',
                alignItems:    'flex-end',
                gap:           16,
                alignSelf:     'stretch',
                overflowY:     'auto',
              }}
            >
              {drawerMode === 'ask' ? (
                showSuggestions ? (
                  /* Suggestion chips after Adjust */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch' }}>
                    <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 13, fontWeight: 400 }}>
                      Adjusting Provence trip
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Add the kids', 'Later in September', 'Shorter stay', 'Upgrade the suite'].map((s, i) => (
                        <motion.button
                          key={s}
                          className="btn-press"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.22, ease: [0.2, 0, 0, 1] }}
                          onClick={() => haptics.trigger('selection')}
                          style={{
                            background:   'rgba(255,252,248,0.07)',
                            border:       '0.5px solid rgba(255,255,255,0.1)',
                            borderRadius: 999,
                            padding:      '8px 14px',
                            color:        text.primary,
                            fontFamily:   SF_PRO,
                            fontSize:     14,
                            fontWeight:   400,
                            cursor:       'pointer',
                          }}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Default prompt */
                  <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 17, fontWeight: 400, alignSelf: 'center' }}>
                    What's next, Miles?
                  </span>
                )
              ) : (
                <AnimatePresence mode="sync">
                  {listenPhase !== 'idle' && (
                    <motion.div
                      key="voice"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
                      style={{
                        display:       'flex',
                        padding:       '12px 16px',
                        flexDirection: 'column',
                        alignItems:    'flex-end',
                        gap:           10,
                        borderRadius:  `${radius.md}px ${radius.md}px ${radius.xs}px ${radius.md}px`,
                        background:    'rgba(255, 252, 248, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 43, height: 5, borderRadius: 999, background: '#3C3735' }} />
                        <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>0:03</span>
                      </div>
                      <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 400 }}>
                        Hey Aurora, make Provence 3 days instead.
                      </span>
                    </motion.div>
                  )}

                  {listenPhase === 'thinking' && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                      style={{
                        alignSelf:    'flex-start',
                        display:      'flex',
                        alignItems:   'center',
                        gap:          5,
                        padding:      '14px 16px',
                        borderRadius: `${radius.xs}px ${radius.md}px ${radius.md}px ${radius.md}px`,
                        background:   'rgba(255, 252, 248, 0.06)',
                      }}
                    >
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <span
                          key={i}
                          className="ellipsis-dot"
                          style={{ display: 'block', width: 6, height: 6, borderRadius: '50%', background: text.secondary, animationDelay: `${delay}s` }}
                        />
                      ))}
                    </motion.div>
                  )}

                  {listenPhase === 'done' && (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
                      style={{
                        alignSelf:     'flex-start',
                        display:       'flex',
                        padding:       '12px 16px',
                        flexDirection: 'column',
                        alignItems:    'flex-start',
                        gap:           10,
                        borderRadius:  `${radius.xs}px ${radius.md}px ${radius.md}px ${radius.md}px`,
                        background:    'rgba(255, 252, 248, 0.06)',
                      }}
                    >
                      <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 400, lineHeight: '150%' }}>
                        Certainly – now{' '}
                        <span className="shimmer-text-orange" style={{ fontFamily: PLAYFAIR }}>28-30th Aug</span>
                        . Same suite, tasting moved to Saturday morning. Flights re-held and your calendar is updated.
                      </span>
                    </motion.div>
                  )}

                  {listenPhase === 'done' && (
                    <motion.div
                      key="calendar"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.28, ease: [0.2, 0, 0, 1] }}
                      style={{
                        display:        'flex',
                        height:         176,
                        flexShrink:     0,
                        justifyContent: 'center',
                        alignItems:     'flex-end',
                        alignSelf:      'stretch',
                        borderRadius:   radius.lg,
                        backgroundImage:    `url(${provenceBackdrop})`,
                        backgroundSize:     '100% 132%',
                        backgroundPosition: '0 -50px',
                        backgroundRepeat:   'no-repeat',
                        backgroundColor:    'rgba(255,252,248,0.06)',
                        position:       'relative',
                        overflow:       'hidden',
                      }}
                    >
                      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.50)' }} />
                      <div
                        style={{
                          position:      'relative',
                          width:         '100%',
                          display:       'flex',
                          flexDirection: 'column',
                          gap:           8,
                          padding:       '12px 14px',
                          background:    'rgba(255,252,248,0.06)',
                          borderRadius:  `${radius.lg}px ${radius.lg}px ${radius.lg}px ${radius.lg}px`,
                          border:        `1px solid ${border.glass}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>🇫🇷</span>
                          <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 16, fontWeight: 510 }}>
                            Provence, updated to 3 days
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img src={planeIcon} alt="" aria-hidden style={{ width: 14, height: 14, flexShrink: 0 }} />
                          <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 13 }}>28-30 Aug</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconSunsetFilled size={14} color={text.primary} style={{ flexShrink: 0 }} />
                          <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 13 }}>Sat - Private cellar tasting</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Chat input — pinned at the bottom */}
            <div style={{ padding: '0 20px 20px' }}>
              <div
                style={{
                  display:        'flex',
                  height:         44,
                  padding:        '8px 6px 8px 14px',
                  justifyContent: 'space-between',
                  alignItems:     'center',
                  alignSelf:      'stretch',
                  borderRadius:   999,
                  border:         '0.5px solid rgba(255,255,255,0.08)',
                  background:     'rgba(255,252,248,0.06)',
                }}
              >
                <input
                  type="text"
                  placeholder="Ask anything"
                  className="aurora-input"
                  style={{
                    flex:        1,
                    background:  'none',
                    border:      'none',
                    outline:     'none',
                    color:       text.primary,
                    fontFamily:  SF_PRO,
                    fontSize:    14,
                    fontWeight:  400,
                    caretColor:  '#F86405',
                  }}
                />
                <button
                  className="btn-press"
                  style={{
                    display:        'flex',
                    height:         32,
                    width:          32,
                    padding:        8,
                    flexDirection:  'column',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            8,
                    borderRadius:   1278.72,
                    background:     '#F86405',
                    border:         'none',
                    cursor:         'pointer',
                    flexShrink:     0,
                  }}
                >
                  <img src={audioLinesIcon} alt="Voice" style={{ width: 14, height: 14, display: 'block' }} />
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </main>
  )
}
