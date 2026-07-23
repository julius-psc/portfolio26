import { IconArrowRight } from '@tabler/icons-react'
import Text3DFlip from '@/components/ui/text-3d-flip'

export default function SandboxTeaser() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-3 w-full max-w-[520px]">
        <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">
          [Sandbox]
        </span>
        <a
          href="/sandbox"
          onClick={(e) => {
            e.preventDefault()
            history.pushState(null, '', '/sandbox')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
          className="group flex items-center gap-1 w-fit"
        >
          <Text3DFlip
            as="span"
            className="text-sm font-medium text-primary tracking-[-0.01em] leading-none"
            textClassName="text-primary"
            flipTextClassName="text-primary"
            rotateDirection="top"
            staggerDuration={0.025}
          >
            View my component studies
          </Text3DFlip>
          <IconArrowRight size={13} className="text-primary transition-transform duration-150 group-hover:translate-x-0.5 shrink-0" />
        </a>
      </div>
    </div>
  )
}
