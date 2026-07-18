import { motion, AnimatePresence } from 'motion/react'
import logoSvg from '../../assets/aur0ra/Logo.svg'

const SF_PRO = '"SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'

export type IslandState = 'idle' | 'confirmed' | 'confirmed-updated' | 'updated'

const LABEL: Record<Exclude<IslandState, 'idle'>, string> = {
  confirmed:           'Provence confirmed · 27–30 Aug',
  'confirmed-updated': 'Provence confirmed · 28–30 Aug',
  updated:             'Provence updated · 28–30 Aug',
}

interface DynamicIslandProps {
  state?: IslandState
}

export default function DynamicIsland({ state = 'idle' }: DynamicIslandProps) {
  const expanded = state !== 'idle'

  return (
    // Pin to center of parent — left:50% + x:-50% means width growth spreads equally left and right
    <motion.div
      initial={{ width: 126, height: 36, x: '-50%' }}
      animate={{
        width:  expanded ? 248 : 126,
        height: expanded ? 46  : 36,
        x:      '-50%',
      }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.7 }}
      style={{
        position:        'absolute',
        left:            '50%',
        top:             '50%',
        y:               '-50%',
        borderRadius:    999,
        backgroundColor: '#0A0908',
        border:          '0.5px solid rgba(255,255,255,0.06)',
        overflow:        'hidden',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
      }}
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.75, filter: 'blur(6px)' }}
            animate={{ opacity: 1, scale: 1,    filter: 'blur(0px)' }}
            exit={{    opacity: 0, scale: 0.75, filter: 'blur(6px)' }}
            transition={{ delay: 0.13, duration: 0.22, ease: [0.2, 0, 0, 1] }}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             12,
              padding:         '0 14px 0 16px',
              width:           '100%',
              transformOrigin: 'center',
            }}
          >
            <img
              src={logoSvg}
              aria-hidden
              style={{
                width:      20,
                height:     20,
                flexShrink: 0,
                filter:     'invert(42%) sepia(95%) saturate(800%) hue-rotate(350deg) brightness(108%)',
              }}
            />
            <span
              style={{
                color:         'rgba(255,255,255,0.82)',
                fontFamily:    SF_PRO,
                fontSize:      11,
                fontWeight:    500,
                whiteSpace:    'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              {LABEL[state as Exclude<IslandState, 'idle'>]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
