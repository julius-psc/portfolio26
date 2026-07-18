import { IconArrowLeft } from '@tabler/icons-react'
import { motion } from 'motion/react'
import { studies } from '../sandbox/studies'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

export default function Sandbox() {
  return (
    <main className="min-h-screen bg-surface dark:bg-base pb-32">
      <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
        <motion.div
          className="flex flex-col gap-14 w-full max-w-[520px]"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={item} className="flex flex-col gap-5">
            <button
              onClick={() => {
                window.location.hash = ''
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-primary opacity-40 hover:opacity-100 transition-opacity w-fit"
            >
              <IconArrowLeft size={12} />
              Back
            </button>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">
                [Sandbox]
              </span>
              <p className="text-sm font-medium text-primary tracking-[-0.01em]">
                Components I build to explore an idea or sharpen a technique — not to ship.
                Each one is live and comes with a short breakdown of the approach.
              </p>
            </div>
          </motion.div>

          {/* Studies */}
          <div className="flex flex-col gap-14">
            {studies.length === 0 && (
              <motion.div variants={item} className="flex flex-col gap-4 blur-[3px] opacity-40 pointer-events-none select-none">
                <div className="dark w-full h-52 rounded-xl bg-base border border-white/[0.06]" />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-semibold text-primary tracking-[-0.01em]">Magnetic Button</span>
                  <span className="text-xs font-medium text-primary opacity-30 shrink-0 tracking-[-0.01em]">Jun 2026</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['spring-physics', 'cursor', 'motion-values'].map(tag => (
                    <span key={tag} className="text-[10px] font-mono text-primary opacity-50 bg-zinc-900/[0.06] dark:bg-white/[0.06] rounded px-2 py-0.5 tracking-wide">
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-primary opacity-50 tracking-[-0.01em] leading-[1.65]">
                  Tracks the cursor distance from the button center using a mousemove listener on the parent container. The offset is fed into motion values wrapped with useSpring — the spring handles the snap-back on mouse leave with no keyframes or duration needed.
                </p>
              </motion.div>
            )}
            {studies.map(study => {
              const Component = study.component
              return (
                <motion.div key={study.id} variants={item} className="flex flex-col gap-4">
                  {/* Live preview — always dark so components render correctly */}
                  <div className="dark w-full h-52 rounded-xl bg-base border border-white/[0.06] overflow-hidden">
                    <Component />
                  </div>

                  {/* Title + date */}
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-semibold text-primary tracking-[-0.01em]">
                      {study.title}
                    </span>
                    <span className="text-xs font-medium text-primary opacity-30 shrink-0 tracking-[-0.01em]">
                      {study.date}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {study.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-primary opacity-50 bg-zinc-900/[0.06] dark:bg-white/[0.06] rounded px-2 py-0.5 tracking-wide"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Study */}
                  <p className="text-sm font-medium text-primary opacity-50 tracking-[-0.01em] leading-[1.65]">
                    {study.study}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
