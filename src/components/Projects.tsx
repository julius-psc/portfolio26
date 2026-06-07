import { IconArrowUpRight } from '@tabler/icons-react'

const projects = [
  {
    name: 'Flowivate',
    role: 'Founder',
    period: '2024–Present',
    accent: '#0075C4',
    href: 'https://flowivate.com',
    description: 'Built v1 as a web productivity dashboard. Diagnosed the category as too broad, the platform as wrong. Rebuilding Flowivate as a native macOS focus agent with local AI, designed from scratch for the OS layer.',
  },
  {
    name: 'Verdyct',
    role: 'Co-Founder',
    period: '2025–2026',
    accent: null,
    href: null,
    description: 'Co-founded and led product design from hackathon to shutdown. Finalist @ Station F Hackathon (Pioneers), pivoted twice on market reasoning, reached MVP — then called it.',
  },
]

export default function Projects() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-8 w-full max-w-[520px]">

        <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">[Projects]</span>

        <div className="flex flex-col gap-8">
          {projects.map((proj) => (
            <div key={proj.name} className="flex flex-col gap-1">

              <div className="flex items-center gap-1">
                {proj.href ? (
                  <a
                    href={proj.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary tracking-[-0.01em]"
                  >
                    {proj.name}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-primary tracking-[-0.01em]">{proj.name}</span>
                )}
                {proj.accent && (
                  <IconArrowUpRight size={14} style={{ color: proj.accent }} className="shrink-0" />
                )}
              </div>

              <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">
                {proj.role} · {proj.period}
              </span>

              <p className="text-sm font-medium text-primary tracking-[-0.01em] mt-1">
                {proj.description}
              </p>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
