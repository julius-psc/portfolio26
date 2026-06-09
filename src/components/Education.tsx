import { EncryptedText } from '@/components/ui/encrypted-text'

export default function Education() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-8 w-full max-w-[520px]">

        <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">[Education]</span>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between">
            <EncryptedText
              text="University of Caen"
              className="text-sm font-medium tracking-[-0.01em]"
              encryptedClassName="text-primary"
              revealedClassName="text-primary"
              revealDelayMs={40}
              flipDelayMs={40}
            />
            <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">2025–2027</span>
          </div>
          <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">BSc Computer Science</span>
        </div>

      </div>
    </div>
  )
}
