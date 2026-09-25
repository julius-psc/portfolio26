import { EncryptedText } from '@/components/ui/encrypted-text'
import SectionTitle from '@/components/SectionTitle'

const artifacts = [
  {
    title: 'Chrome is a room',
    href: '/artifacts/chrome-is-a-room',
  },
]

export default function Artifacts() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-8 w-full max-w-[520px]">

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
              className="w-fit"
            >
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
