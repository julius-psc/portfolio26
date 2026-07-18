// iPhone home indicator — the white pill at the very bottom of the screen.

export default function HomeIndicator() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 8,
        alignSelf: 'stretch',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 134,
          height: 5,
          borderRadius: 999,
          backgroundColor: 'rgba(242,238,232,0.22)',
        }}
      />
    </div>
  )
}
