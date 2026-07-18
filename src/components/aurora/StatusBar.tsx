import { motion } from 'motion/react'
import cellularIcon from '../../assets/icons/aur0ra/Cellular Connection.svg'
import wifiIcon     from '../../assets/icons/aur0ra/Wifi.svg'
import batteryIcon  from '../../assets/icons/aur0ra/Battery.svg'

const SF_PRO   = '"SF Pro", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const SPRING   = { type: 'spring', duration: 0.4, bounce: 0 } as const
const FADE_OUT = { duration: 0.22, ease: [0.2, 0, 0, 1] } as const

interface StatusBarProps {
  expanded?: boolean
}

export default function StatusBar({ expanded = false }: StatusBarProps) {
  return (
    <div
      style={{
        display:        'flex',
        padding:        '12px 24px',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        alignSelf:      'stretch',
      }}
    >
      {/* Time — slides left and blurs when island expands */}
      <motion.span
        animate={{
          x:       expanded ? -8       : 0,
          opacity: expanded ? 0        : 1,
          filter:  expanded ? 'blur(4px)' : 'blur(0px)',
        }}
        transition={{
          x:       SPRING,
          opacity: FADE_OUT,
          filter:  FADE_OUT,
        }}
        style={{
          color:              '#F2EEE8',
          fontFamily:         SF_PRO,
          fontSize:           14,
          fontWeight:         590,
          lineHeight:         'normal',
          fontStyle:          'normal',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        19:50
      </motion.span>

      {/* Status icons — whole group slides right */}
      <motion.div
        animate={{ x: expanded ? 8 : 0 }}
        transition={{ x: SPRING }}
        style={{ display: 'flex', alignItems: 'center', gap: 7 }}
      >
        {/* Cellular + Wi-Fi — blur out when island is active */}
        <motion.div
          animate={{
            opacity: expanded ? 0 : 1,
            filter:  expanded ? 'blur(4px)' : 'blur(0px)',
          }}
          transition={FADE_OUT}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <img src={cellularIcon} alt="Signal" style={{ height: 11, width: 'auto' }} />
          <img src={wifiIcon}     alt="Wi-Fi"  style={{ height: 11, width: 'auto' }} />
        </motion.div>

        {/* Battery always visible */}
        <img src={batteryIcon} alt="Battery" style={{ height: 11, width: 'auto' }} />
      </motion.div>
    </div>
  )
}
