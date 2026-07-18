import logoSvg from '../../assets/aur0ra/Logo.svg'

// ─── SplashScreen ─────────────────────────────────────────────────────────────
// Full-height content for the first frame: logo + glow pinned to the bottom.

export default function SplashScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 40,
      }}
    >
      <div style={{ width: 64, height: 65 }}>
        <img src={logoSvg} alt="AUR0RA" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
