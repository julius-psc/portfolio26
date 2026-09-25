import ComponentName from '@/components/ComponentName'
import SectionTitle from '@/components/SectionTitle'
import { studies } from '@/sandbox/studies'

export default function SandboxTeaser() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-8 w-full max-w-[520px]">

        <SectionTitle>Sandbox</SectionTitle>

        <div className="flex flex-col gap-3">
          {studies.map((study) => (
            <a
              key={study.id}
              href={`/sandbox/${study.id}`}
              onClick={(e) => {
                e.preventDefault()
                history.pushState(null, '', `/sandbox/${study.id}`)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
              className="w-fit text-sm font-medium text-primary tracking-[-0.01em]"
            >
              <ComponentName name={study.title} scramble />
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
