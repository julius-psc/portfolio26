import type { ReactNode } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { motion } from 'motion/react'
import { studies, type Study } from '../sandbox/studies'
import { usePageShift } from '@/components/artifact-panel/usePageShift'
import ComponentName from '@/components/ComponentName'
import { BackLink, P, SectionTitle } from '@/components/essay/Essay'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

function navigate(path: string) {
  history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function BackButton() {
  return (
    <button
      onClick={() => navigate('/')}
      className="flex items-center gap-1.5 text-xs font-medium text-primary opacity-40 hover:opacity-100 transition-opacity w-fit"
    >
      <IconArrowLeft size={12} />
      Back
    </button>
  )
}

function Column({ children }: { children: ReactNode }) {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <motion.div
        className="flex flex-col gap-14 w-full max-w-[640px]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    </div>
  )
}

/** /sandbox — index of the studies, each opening on its own page. */
export default function Sandbox() {
  return (
    <main className="min-h-screen bg-surface dark:bg-base pb-32">
      <Column>
        {/* Header */}
        <motion.div variants={item} className="flex flex-col gap-5">
          <BackButton />

          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">
              [Sandbox]
            </span>
            <p className="text-sm font-medium text-primary tracking-[-0.01em]">
              Live components built alongside real products, each with a breakdown of the thinking behind it.
            </p>
          </div>
        </motion.div>

        {/* Studies */}
        <div className="flex flex-col gap-3">
          {studies.map(study => (
            <motion.a
              key={study.id}
              variants={item}
              href={`/sandbox/${study.id}`}
              onClick={(e) => {
                e.preventDefault()
                navigate(`/sandbox/${study.id}`)
              }}
              className="text-sm font-semibold text-primary tracking-[-0.01em] w-fit"
            >
              <ComponentName name={study.title} />
            </motion.a>
          ))}
        </div>
      </Column>
    </main>
  )
}

/** /sandbox/:id — one study, set like the essay: the thinking behind it,
 * closed by the live component (liftable into the artifact panel). */
export function SandboxStudy({ study }: { study: Study }) {
  // A side-docked panel pushes the page aside instead of covering it.
  const shift = usePageShift()
  const Component = study.component

  return (
    <main
      className="min-h-dvh bg-surface dark:bg-base"
      style={{
        WebkitFontSmoothing: 'antialiased',
        paddingLeft: shift.left,
        paddingRight: shift.right,
        transition: `padding ${shift.glide}`,
      }}
    >
      <article className="mx-auto w-full max-w-[640px] px-5 pb-24 pt-16 sm:px-6 sm:pt-20">
        <BackLink />
        <SectionTitle as="h1" first>
          <ComponentName name={study.title} />
        </SectionTitle>

        {study.body.map((para, i) => (
          <P key={i}>{para}</P>
        ))}

        <Component onDockChange={shift.onDockChange} />
      </article>
    </main>
  )
}
