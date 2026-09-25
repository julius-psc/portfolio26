import { IconArrowLoopRight2, IconArrowUpRight } from '@tabler/icons-react'
import { EncryptedText } from '@/components/ui/encrypted-text'
import SectionTitle from '@/components/SectionTitle'

type Project = {
  name: string
  /** Omitted on an engine — it shares its platform's role and period. */
  role?: string
  period?: string
  accent: string | null
  href: string | null
  description: string
  /** What the project is built on — rendered nested beneath it. */
  engine?: Project
}

const projects: Project[] = [
  {
    name: 'Cappr',
    role: 'Co-Founder',
    period: 'Current',
    // Follows the theme's text colour: black in light mode, white in dark.
    accent: 'var(--color-primary)',
    href: 'https://cappr.shotoku.dev',
    description: 'The spend control plane for autonomous agents. Leading product and GTM.',
    engine: {
      name: 'Shotoku',
      accent: '#F93743',
      href: 'https://shotoku.dev',
      description: 'The open-source, local-first engine Cappr runs on. Exploring agent-to-agent transactions and x402.',
    },
  },
  {
    name: 'Flowivate',
    role: 'Founder',
    period: '2024–Current',
    accent: '#0075C4',
    href: 'https://flowivate.com',
    description: 'Designed and engineered v1 as a web productivity dashboard. Diagnosed the category as too broad, the platform as wrong. Rebuilding as a native macOS focus agent with local AI, designed and engineered from scratch for the OS layer.',
  },
  {
    name: 'Verdyct',
    role: 'Co-Founder',
    period: '2025–2026',
    accent: null,
    href: null,
    description: 'Top 10 Finalist at Pioneers AI Lab Hackathon @ Station F; evolved the product through customer discovery into an AI-native customs operations platform.',
  },
]

function ProjectEntry({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-1">

      <div className="flex items-baseline justify-between">
        {project.href ? (
          <a href={project.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 cursor-pointer">
            <EncryptedText
              text={project.name}
              className="text-sm font-medium tracking-[-0.01em]"
              encryptedClassName="text-primary"
              revealedClassName="text-primary"
              revealDelayMs={40}
              flipDelayMs={40}
            />
            {project.accent && (
              <IconArrowUpRight size={14} style={{ color: project.accent }} className="shrink-0 translate-y-[1px]" />
            )}
          </a>
        ) : (
          <EncryptedText
            text={project.name}
            className="text-sm font-medium tracking-[-0.01em]"
            encryptedClassName="text-primary opacity-30"
            revealedClassName="text-primary"
            revealDelayMs={40}
            flipDelayMs={40}
          />
        )}
        {project.period && (
          <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">{project.period}</span>
        )}
      </div>

      {project.role && (
        <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">{project.role}</span>
      )}

      <p className="text-sm font-medium text-primary tracking-[-0.01em] mt-1">
        {project.description}
      </p>

      {/* The engine hangs off its platform on the same elbow and indent as the
          experience highlights, so it reads as part of the project above. */}
      {project.engine && (
        <div className="mt-1 flex items-start gap-1.5 pl-4">
          <IconArrowLoopRight2
            size={12}
            aria-hidden
            className="shrink-0 mt-1 scale-y-[-1] text-primary opacity-50"
          />
          <ProjectEntry project={project.engine} />
        </div>
      )}

    </div>
  )
}

export default function Projects() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-4 w-full max-w-[520px]">

        <SectionTitle>Projects</SectionTitle>

        <div className="flex flex-col gap-8">
          {projects.map((project) => (
            <ProjectEntry key={project.name} project={project} />
          ))}
        </div>

      </div>
    </div>
  )
}
