const music = [
  { title: 'Placeholder track', artist: 'Artist name' },
  { title: 'Placeholder track', artist: 'Artist name' },
  { title: 'Placeholder track', artist: 'Artist name' },
]

const currently = [
  { label: 'Reading', value: 'Placeholder book title' },
  { label: 'Watching', value: 'Placeholder show' },
  { label: 'Playing', value: 'Placeholder game' },
]

const places = [
  'Placeholder city',
  'Placeholder city',
  'Placeholder city',
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-primary opacity-40 tracking-[0.06em] uppercase mb-4">
      {children}
    </p>
  )
}

function MusicSection() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="w-full max-w-[520px]">
        <SectionHeading>What's in rotation</SectionHeading>
        <div className="flex flex-col gap-3">
          {music.map((track, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-primary tracking-[-0.01em]">{track.title}</span>
                <span className="text-sm text-primary opacity-40 tracking-[-0.01em]">{track.artist}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CurrentlySection() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="w-full max-w-[520px]">
        <SectionHeading>Currently</SectionHeading>
        <div className="flex flex-col gap-3">
          {currently.map((item, i) => (
            <div key={i} className="flex items-baseline gap-3">
              <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em] w-16 shrink-0">{item.label}</span>
              <span className="text-sm font-medium text-primary tracking-[-0.01em]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlacesSection() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="w-full max-w-[520px]">
        <SectionHeading>Places I keep coming back to</SectionHeading>
        <div className="flex flex-col gap-2">
          {places.map((place, i) => (
            <span key={i} className="text-sm font-medium text-primary tracking-[-0.01em]">{place}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PersonalSections() {
  return (
    <>
      <MusicSection />
      <CurrentlySection />
      <PlacesSection />
    </>
  )
}
