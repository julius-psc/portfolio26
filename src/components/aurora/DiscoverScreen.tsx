import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import naomiPfp from '../../assets/aur0ra/Naomi-PFP.png'
import planeIcon from '../../assets/aur0ra/Plane Icon.svg'
import mealIcon from '../../assets/aur0ra/Meal Icon.svg'
import provenceBackdrop from '../../assets/aur0ra/Provence-Backdrop.png'
import ikoyiBackdrop from '../../assets/aur0ra/Ikoyi-Backdrop.png'
import queenClubBackdrop from '../../assets/aur0ra/QueenClub.png'
import wineHouseBackdrop from '../../assets/aur0ra/WineHouse.png'
import spaBackdrop from '../../assets/aur0ra/Spa.png'
import jewelleryBackdrop from '../../assets/aur0ra/Jewellery.png'
import { IconSunFilled, IconSunsetFilled, IconMoonFilled } from '@tabler/icons-react'
import { surface, text, accent, radius, border } from '../../lib/aurora-tokens'
import { haptics } from '../../lib/haptics'
import { squircleClip } from '../../lib/squircle'
import EventCard from './EventCard'

// 402px frame − 32px left − 32px right = 338px cards fill edge-to-edge with equal margins
const CARD_W        = 338
const IKOYI_CARD_H  = 300
const IKOYI_PANEL_H = 230
const COLLAPSED_H   = 76
const stackCardClip  = squircleClip({ width: CARD_W, height: IKOYI_CARD_H,  cornerRadius: radius.md, cornerSmoothing: 0.6 })
const innerPanelClip = squircleClip({ width: CARD_W, height: IKOYI_PANEL_H, cornerRadius: radius.md, cornerSmoothing: 0.6 })

const PEEK_H    = 40                    // space above front card where behind cards peek
const COMMIT_Y  = IKOYI_CARD_H * 0.3   // ~90px upward drag to commit

// Visual target for each stack slot (index = distance from front)
// opacity is element-level (1 for visible, 0 for hidden slot 4)
// dim is an opaque overlay so behind cards stay fully opaque (no see-through)
const SLOT_VISUAL = [
  { scale: 1,    y: 0,   opacity: 1, dim: 0    },
  { scale: 0.96, y: -12, opacity: 1, dim: 0.18 },
  { scale: 0.92, y: -22, opacity: 1, dim: 0.36 },
  { scale: 0.88, y: -30, opacity: 1, dim: 0.58 },
  { scale: 0.84, y: -36, opacity: 0, dim: 0    },
]

// ─── Shared styles ────────────────────────────────────────────────────────────

const SF_PRO = '"SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const PLAYFAIR = '"Playfair Display", serif'

const prose: React.CSSProperties = {
  color:      text.primary,
  fontFamily: SF_PRO,
  fontSize:   23,
  fontWeight: 400,
  lineHeight: '160%',
  margin:     0,
}


// ─── Card data ────────────────────────────────────────────────────────────────

type TablerIcon = React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>

interface WeekCard {
  id:           string | number
  emoji:        string
  title:        string
  day:          string
  month:        string
  scheduleText: string
  note:         string
  timeIcon?:    TablerIcon
  backdrop?:    string
  bg:           string
}

const WEEK_CARDS: WeekCard[] = [
  {
    id: 'ikoyi', emoji: '🇬🇧', title: 'Ikoyi, table for two',
    day: '25', month: 'Aug', scheduleText: 'Fri · 8pm',
    note: "Naomi's birthday is in 9 days. You took her last year — she rated it her favourite.",
    timeIcon: IconMoonFilled,
    backdrop: ikoyiBackdrop, bg: surface.base,
  },
  {
    id: 0, emoji: '🎾', title: "Queen's Club",
    day: '29', month: 'Jun', scheduleText: 'Centre Court · 2pm',
    note: "Naomi got the tickets in April. Third round — Alcaraz is seeded to be there.",
    timeIcon: IconSunsetFilled,
    backdrop: queenClubBackdrop, bg: surface.base,
  },
  {
    id: 1, emoji: '🍷', title: 'Berry Bros. tasting',
    day: '30', month: 'Jun', scheduleText: 'Mayfair · 7:30pm',
    note: "Your sommelier arranged this after the dinner in March. Six wines, seated.",
    timeIcon: IconMoonFilled,
    backdrop: wineHouseBackdrop, bg: surface.base,
  },
  {
    id: 2, emoji: '💆', title: 'Bamford spa',
    day: '5', month: 'Jul', scheduleText: 'Haybarn · 9am',
    note: "Recovery score has been low this week. This is the day before the Paris trip.",
    timeIcon: IconSunFilled,
    backdrop: spaBackdrop, bg: surface.base,
  },
  {
    id: 3, emoji: '🎁', title: 'Tiffany — gift engraved',
    day: '3', month: 'Jul', scheduleText: 'Ready for collection',
    note: "Engraving reads 'N · always'. Has been ready since Thursday.",
    backdrop: jewelleryBackdrop, bg: surface.base,
  },
]

// ─── Reusable button styles ───────────────────────────────────────────────────

const confirmBtnStyle: React.CSSProperties = {
  display:              'flex',
  height:               37,
  padding:              '4px 20px',
  justifyContent:       'center',
  alignItems:           'center',
  borderRadius:         radius.xs,
  background:           'rgba(248, 100, 5, 0.18)',
  backdropFilter:       'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border:               '0.5px solid rgba(248, 100, 5, 0.35)',
  cursor:               'pointer',
}

const adjustBtnStyle: React.CSSProperties = {
  display:              'flex',
  height:               37,
  padding:              '4px 20px',
  justifyContent:       'center',
  alignItems:           'center',
  borderRadius:         radius.xs,
  background:           'rgba(0, 0, 0, 0.45)',
  backdropFilter:       'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border:               `0.5px solid ${border.glass}`,
  cursor:               'pointer',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DiscoverScreenProps {
  provenceUpdated?:   boolean
  confirmedProvence?: boolean
  onConfirm?:         () => void
  onAdjust?:          () => void
  onCardConfirm?:     () => void
  phoneScrollRef?:    React.RefObject<HTMLDivElement | null>
}

export default function DiscoverScreen({ provenceUpdated = false, confirmedProvence = false, onConfirm, onAdjust, onCardConfirm, phoneScrollRef }: DiscoverScreenProps) {
  const [connection, setConnection]           = useState(false)
  const toggleConnection = () => { haptics.trigger('selection'); setConnection(c => !c) }
  const [highlightCardId, setHighlightCardId] = useState<string | number | null>(null)
  const dimGreeting = connection || !!highlightCardId
  const [expanded, setExpanded]             = useState(false)
  const [activeCardId, setActiveCardId]     = useState<string | number>('ikoyi')
  const [stackIndex, setStackIndex]           = useState(0)
  const [filingCardIndex, setFilingCardIndex] = useState<number | null>(null)
  const [dragProgress, setDragProgress]       = useState(0)
  const N = WEEK_CARDS.length
  const weekSectionRef = useRef<HTMLDivElement>(null)
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commitSwipe = (cardIndex: number) => {
    haptics.trigger('light')
    setDragProgress(0)
    setFilingCardIndex(cardIndex)
    setStackIndex(prev => (prev + 1) % N)
    setTimeout(() => setFilingCardIndex(null), 360)
  }

  const scrollAndSwipeToCard = (targetId: string | number) => {
    if (expanded) { setExpanded(false); setActiveCardId('ikoyi') }

    // Scroll inside the phone, not the page
    const container = phoneScrollRef?.current
    const section   = weekSectionRef.current
    if (container && section) {
      const cRect = container.getBoundingClientRect()
      const sRect = section.getBoundingClientRect()
      container.scrollTo({ top: container.scrollTop + (sRect.top - cRect.top) - 16, behavior: 'smooth' })
    }

    // Glow the target card once it reaches front slot
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    setHighlightCardId(targetId)
    highlightTimer.current = setTimeout(() => setHighlightCardId(null), 2500)

    const targetIdx    = WEEK_CARDS.findIndex(c => c.id === targetId)
    const currentFront = stackIndex % N
    const swipesNeeded = (targetIdx - currentFront + N) % N
    for (let i = 0; i < swipesNeeded; i++) {
      setTimeout(() => commitSwipe((currentFront + i) % N), i * 500 + 600)
    }
  }

  return (
    <div
      style={{ padding: '90px 0 96px', display: 'flex', flexDirection: 'column', gap: 24 }}
      onClick={() => { if (connection) setConnection(false) }}
    >

      {/* ── Greeting ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 31.5px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ ...prose, opacity: dimGreeting ? 0.2 : 1, transition: 'opacity 0.35s ease' }}>While you were heads-down,</p>
        <p style={prose}>
          <span style={{ opacity: dimGreeting ? 0.2 : 1, transition: 'opacity 0.35s ease' }}>Miles – </span>
          <span
            className="shimmer-text-orange"
            style={{
              fontFamily: PLAYFAIR,
              cursor: 'pointer',
              filter: connection ? 'drop-shadow(0 0 12px rgba(248,100,5,0.8))' : 'none',
              transition: 'filter 0.35s ease',
            }}
            onPointerDown={toggleConnection}
            onClick={e => e.stopPropagation()}
          >your weekend is clear</span>
          <span style={{ opacity: dimGreeting ? 0.2 : 1, transition: 'opacity 0.35s ease' }}>,</span>
        </p>
        <p style={{ ...prose, opacity: dimGreeting ? 0.2 : 1, transition: 'opacity 0.35s ease' }}>
          <span
            className="shimmer-text-orange"
            style={{ fontFamily: PLAYFAIR, cursor: 'pointer' }}
            onClick={() => scrollAndSwipeToCard(2)}
          >recovery's climbing</span>
          {' '}and
        </p>

        {/* Naomi inline row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: dimGreeting ? 0.2 : 1, transition: 'opacity 0.35s ease' }}>
          <img
            src={naomiPfp}
            alt="Naomi"
            style={{
              width: 36, height: 36, flexShrink: 0, objectFit: 'cover',
              outline: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <p style={prose}>
            Naomi is{' '}
            <span
              className="shimmer-text-orange"
              style={{ fontFamily: PLAYFAIR, cursor: 'pointer' }}
              onClick={() => scrollAndSwipeToCard('ikoyi')}
            >free tonight</span>.
          </p>
        </div>
      </div>

      {/* ── Event card ── */}
      <div style={{ padding: '0 31.5px', marginTop: 24, opacity: highlightCardId !== null ? 0.2 : 1, transition: 'opacity 0.35s ease' }}>
        <motion.div
          animate={{
            boxShadow: connection
              ? '0 0 0 1.5px rgba(248,100,5,0.7), 0 0 24px rgba(248,100,5,0.2)'
              : '0 0 0 0px transparent',
          }}
          transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
          style={{ borderRadius: radius.md, cursor: 'pointer' }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            toggleConnection()
          }}
          onClick={e => e.stopPropagation()}
        >
        <EventCard backdrop={provenceBackdrop} cardWidth={CARD_W} animated>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>🇫🇷</span>
              <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 24, fontWeight: 510, lineHeight: 'normal' }}>
                Provence, held for you
              </span>
            </div>

            {/* Date + indented schedule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>

              {/* Date row */}
              {provenceUpdated ? (
                <motion.div
                  key="updated-date"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.36, ease: [0.2, 0, 0, 1] }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg
                    width="13" height="13"
                    viewBox="0 0 120 123" fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      display: 'block',
                      position: 'relative',
                      top: 1,
                      filter: 'drop-shadow(0 0 5px rgba(248,100,5,0.75)) drop-shadow(0 0 2px rgba(248,100,5,0.5))',
                    }}
                  >
                    <path d="M66.8542 12.022C90.9364 11.3272 108.477 27.1262 108.642 51.4657C108.811 76.5224 94.1598 99.7281 70.8855 109.253C64.6516 111.804 58.6739 112.54 51.9806 112.743C31.9888 113.05 13.8553 102.264 10.5518 81.5098C7.44513 61.9919 17.8227 38.012 32.4736 25.3111C41.9956 16.945 54.1808 12.235 66.8542 12.022ZM49.79 100.325C73.4313 100.414 89.3845 70.5784 89.1136 49.8004C89.0134 42.1158 87.8623 33.0344 82.2069 27.3301C78.8782 24.0263 74.3796 22.1705 69.6898 22.1666C69.3566 22.166 68.9878 22.159 68.6589 22.2033C66.6907 22.4455 65.0262 22.6442 63.0807 23.1375C55.4605 25.0701 48.3017 30.8724 43.4796 37.0047C34.3166 48.6576 27.9569 64.8956 29.5469 79.8653C30.1827 85.8503 32.6231 92.2896 37.509 96.0269C40.3911 98.2313 42.7256 99.3718 46.393 99.9756C47.4729 100.153 48.791 100.158 49.79 100.325Z" fill={accent.primary}/>
                  </svg>
                  <span className="shimmer-text-orange" style={{ fontFamily: PLAYFAIR, fontSize: 14, lineHeight: 'normal' }}>
                    28-30 Aug
                  </span>
                </motion.div>
              ) : (
                <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14, lineHeight: 'normal' }}>
                  27-30 Aug
                </span>
              )}

              {/* Schedule — indented, pushed further from date */}
              <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {/* Flight row — plane icon inline between LHR and MRS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconSunFilled size={14} color={text.primary} style={{ flexShrink: 0 }} />
                  <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, lineHeight: 'normal' }}>Thu -</span>
                  <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, lineHeight: 'normal' }}>LHR</span>
                  <img src={planeIcon} alt="" aria-hidden style={{ width: 12, height: 12, flexShrink: 0, opacity: 0.7 }} />
                  <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, lineHeight: 'normal' }}>MRS (British Airways)</span>
                </div>
                {([
                  { Icon: IconSunsetFilled, label: 'Thu - Garden suite, Villa La Coste' },
                  { Icon: IconSunsetFilled, label: 'Fri - Private cellar tasting'       },
                  { Icon: IconMoonFilled,   label: 'Sat - Dinner @ Saisons'             },
                ] as const).map(({ Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={14} color={text.primary} style={{ flexShrink: 0 }} />
                    <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, lineHeight: 'normal' }}>{label}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Action buttons — height+margin+opacity collapse simultaneously */}
          <motion.div
            animate={confirmedProvence
              ? { opacity: 0, height: 0, marginTop: 0 }
              : { opacity: 1 }
            }
            transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
            style={{ display: 'flex', gap: 8, overflow: 'hidden', marginTop: 16 }}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            <button className="btn-press" style={confirmBtnStyle} onClick={onConfirm}>
              <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Confirm</span>
            </button>
            <button className="btn-press" style={adjustBtnStyle} onClick={onAdjust}>
              <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Adjust</span>
            </button>
          </motion.div>
        </EventCard>
        </motion.div>
      </div>

      {/* ── This week ─────────────────────────────────────────────────────────── */}
      <div ref={weekSectionRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 31.5px', marginTop: 32 }}>
        <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' }}>
          This week
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            onClick={() => {
              if (expanded) {
                setActiveCardId('ikoyi')
                setExpanded(false)
              } else {
                setActiveCardId('ikoyi')
                setDragProgress(0)
                setFilingCardIndex(null)
                setExpanded(true)
              }
            }}
            style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 13, fontWeight: 400, cursor: 'pointer' }}
          >
            {expanded ? 'Stack' : 'View all'}
          </span>
        </div>
      </div>

      {/* ── Ikoyi card: stack view / unified animated list ── */}
      <div style={{ padding: '0 31.5px', marginTop: 6 }}>
        {!expanded ? (

          /* ── Animated stack ── */
          <div style={{ position: 'relative', height: IKOYI_CARD_H + PEEK_H }}>
            {WEEK_CARDS.map((card, cardIndex) => {
              const slot     = ((cardIndex - stackIndex) % N + N) % N
              const visual   = SLOT_VISUAL[Math.min(slot, 4)]
              // One step closer to front — target during drag
              const fwd      = SLOT_VISUAL[Math.max(0, slot - 1)]
              const isFiling = filingCardIndex === cardIndex
              // Only draggable when truly at front and nothing is filing
              const isFront  = slot === 0 && filingCardIndex === null

              // Lerp toward one-slot-forward during drag; filing card snaps to back slot
              const lp = (a: number, b: number) => a + (b - a) * dragProgress
              const animScale   = isFiling ? visual.scale   : lp(visual.scale,   fwd.scale)
              const animY       = isFiling ? visual.y       : lp(visual.y,       fwd.y)
              const animDim     = isFiling ? visual.dim     : lp(visual.dim,     fwd.dim)

              return (
                // Outer wrapper — no clipPath so boxShadow glow is visible on all edges
                <motion.div
                  key={String(card.id)}
                  initial={{ scale: visual.scale, y: visual.y, opacity: visual.opacity }}
                  animate={{ scale: animScale, y: animY, opacity: visual.opacity }}
                  transition={
                    isFiling
                      ? { type: 'spring', stiffness: 260, damping: 30 }
                      : dragProgress > 0
                        ? { duration: 0, ease: 'linear' }
                        : { type: 'spring', stiffness: isFront ? 350 : 220, damping: isFront ? 22 : 30 }
                  }
                  drag={isFront ? 'y' : false}
                  dragConstraints={{ top: -(COMMIT_Y + PEEK_H), bottom: 0 }}
                  dragElastic={{ top: 0.18, bottom: 0.05 }}
                  onDrag={(_, info) => {
                    if (isFront) setDragProgress(Math.min(1, Math.max(0, -info.offset.y / COMMIT_Y)))
                  }}
                  onDragEnd={(_, info) => {
                    setDragProgress(0)
                    if (info.offset.y < -COMMIT_Y) commitSwipe(cardIndex)
                  }}
                  style={{
                    position:    'absolute',
                    top:         PEEK_H,
                    left:        0,
                    width:       CARD_W,
                    height:      IKOYI_CARD_H,
                    zIndex:      isFiling ? 0 : N - slot,
                    borderRadius: radius.md,
                    touchAction: isFront ? 'none' : undefined,
                    cursor:      isFront ? 'grab' : 'default',
                    boxShadow:   highlightCardId === card.id && slot === 0
                      ? '0 0 0 1.5px rgba(248,100,5,0.65), 0 0 32px rgba(248,100,5,0.2)'
                      : '0 0 0 0px rgba(248,100,5,0)',
                    transition:  'box-shadow 0.35s ease',
                  }}
                >
                  {/* Inner surface — squircle clip contains all card content */}
                  <div style={{ ...stackCardClip, position: 'absolute', inset: 0, background: card.bg }}>

                    {/* Backdrop */}
                    {card.backdrop && (
                      <img src={card.backdrop} alt="" aria-hidden
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
                      />
                    )}

                    {/* Dim overlay — opaque surface so behind cards never bleed through */}
                    {slot > 0 && (
                      <div aria-hidden style={{ position: 'absolute', inset: 0, background: surface.base, opacity: animDim, pointerEvents: 'none', zIndex: 1 }} />
                    )}

                    {/* Inset border */}
                    <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: radius.md, boxShadow: `inset 0 0 0 0.5px ${border.glass}`, pointerEvents: 'none' }} />

                    {/* Glass panel — all visible cards; zIndex 2 sits above the dim overlay (zIndex 1) */}
                    {slot < 4 && (
                      <div style={{
                        ...innerPanelClip,
                        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                        height: IKOYI_PANEL_H, padding: '20px 16px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        background: 'rgba(14,12,11,0.58)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${border.glass}`,
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24, lineHeight: 1 }}>{card.emoji}</span>
                            <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 24, fontWeight: 510, lineHeight: 'normal' }}>{card.title}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14 }}>{card.day} {card.month}</span>
                            <div style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {card.timeIcon && <card.timeIcon size={14} color={text.primary} style={{ flexShrink: 0 }} />}
                              <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14 }}>{card.scheduleText}</span>
                            </div>
                          </div>
                        </div>

                        {/* Buttons — front card; next card as soon as user lifts the top card */}
                        {(slot === 0 && filingCardIndex !== cardIndex || slot === 1 && dragProgress > 0) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14 }}>
                            <p style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 300, lineHeight: '150%', margin: 0 }}>
                              {card.note}
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-press" style={confirmBtnStyle} onClick={() => onCardConfirm?.()}>
                                <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Confirm</span>
                              </button>
                              <button className="btn-press" style={adjustBtnStyle}>
                                <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Adjust</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

        ) : (

          /* ── Unified list ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {WEEK_CARDS.map(card => {
              const isActive = activeCardId === card.id
              return (
                <div
                  key={String(card.id)}
                  onClick={() => !isActive && setActiveCardId(card.id)}
                  style={{
                    position:   'relative',
                    width:      CARD_W,
                    height:     isActive ? IKOYI_CARD_H : COLLAPSED_H,
                    transition: 'height 0.36s cubic-bezier(0.32, 0.72, 0, 1)',
                    borderRadius: radius.md,
                    overflow:   'hidden',
                    flexShrink: 0,
                    cursor:     isActive ? 'default' : 'pointer',
                    background: card.bg,
                  }}
                >
                  {/* Backdrop image */}
                  {card.backdrop && (
                    <>
                      <img
                        src={card.backdrop} alt="" aria-hidden
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
                      />
                      <div aria-hidden style={{ position: 'absolute', inset: 0, background: isActive ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.45)' }} />
                    </>
                  )}

                  {isActive ? (
                    /* Expanded glass panel */
                    <div style={{
                      ...innerPanelClip,
                      position:       'absolute',
                      bottom:         0, left: 0, right: 0,
                      height:         IKOYI_PANEL_H,
                      padding:        '20px 16px',
                      display:        'flex',
                      flexDirection:  'column',
                      justifyContent: 'space-between',
                      background:           'rgba(14,12,11,0.58)',
                      backdropFilter:       'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border:         `1px solid ${border.glass}`,
                    }}>
                      {card.id === 'ikoyi' ? (
                        /* Ikoyi full content */
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 24, lineHeight: 1 }}>🇬🇧</span>
                              <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 24, fontWeight: 510, lineHeight: 'normal' }}>Ikoyi, table for two</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <img src={mealIcon} alt="" aria-hidden style={{ width: 16, height: 16, flexShrink: 0 }} />
                                <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14 }}>25 Aug</span>
                              </div>
                              <div style={{ paddingLeft: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <IconMoonFilled size={14} color={text.primary} style={{ flexShrink: 0 }} />
                                  <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14 }}>Fri - 8pm, held</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14 }}>
                            <p style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 300, lineHeight: '150%', margin: 0 }}>
                              Naomi's birthday is in 9 days. You took her last year — she rated it her favourite.
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-press" style={confirmBtnStyle} onClick={() => onCardConfirm?.()}>
                                <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Confirm</span>
                              </button>
                              <button className="btn-press" style={adjustBtnStyle}>
                                <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Adjust</span>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Extra card expanded content */
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 24, lineHeight: 1 }}>{card.emoji}</span>
                              <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 20, fontWeight: 510, lineHeight: 'normal' }}>{card.title}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14 }}>{card.day} {card.month}</span>
                              <div style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                                {card.timeIcon && <card.timeIcon size={14} color={text.primary} style={{ flexShrink: 0 }} />}
                                <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14 }}>{card.scheduleText}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14 }}>
                            <p style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 300, lineHeight: '150%', margin: 0 }}>
                              {card.note}
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-press" style={confirmBtnStyle} onClick={() => onCardConfirm?.()}>
                                <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Confirm</span>
                              </button>
                              <button className="btn-press" style={adjustBtnStyle}>
                                <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 14, fontWeight: 510 }}>Adjust</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Collapsed horizontal row */
                    <div style={{
                      position:   'absolute',
                      inset:      0,
                      display:    'flex',
                      alignItems: 'center',
                      padding:    '0 16px',
                      gap:        14,
                      background: 'rgba(14,12,11,0.50)',
                    }}>
                      <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{card.emoji}</span>
                      <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 16, fontWeight: 510, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, flexShrink: 0 }}>
                        <span style={{ color: text.primary, fontFamily: SF_PRO, fontSize: 22, fontWeight: 600 }}>{card.day}</span>
                        <span style={{ color: text.secondary, fontFamily: SF_PRO, fontSize: 12 }}>{card.month}</span>
                      </div>
                    </div>
                  )}

                  {/* Card border — inset overlay avoids overflow:hidden corner-leak */}
                  <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: radius.md, boxShadow: `inset 0 0 0 0.5px ${border.glass}`, pointerEvents: 'none', zIndex: 20 }} />
                </div>
              )
            })}
          </div>

        )}
      </div>

    </div>
  )
}
