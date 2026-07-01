import { IconArrowUpRight } from '@tabler/icons-react'
import { EncryptedText } from '@/components/ui/encrypted-text'

const projects = [
  {
    name: 'Shotoku',
    role: 'Co-Founder',
    period: 'Present',
    accent: '#F93743',
    href: 'https://shotoku.dev',
    description: 'Co-founding Shotoku — the open-source, local-first authorization layer for AI agents. Designed the brand identity, built the landing page, and implemented the TUI in TypeScript. Exploring agent-to-agent transactions, x402 and more recently MPP.',
  },
  {
    name: 'Flowivate',
    role: 'Founder',
    period: '2024–Present',
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
    description: 'Co-founded and led product design from hackathon idea to MVP. Top 10 Finalist at the Pioneers AI Lab Hackathon @ Station F before evolving the product through customer discovery into Verdyct.',
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
                  <a href={proj.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 cursor-pointer">
                    <EncryptedText
                      text={proj.name}
                      className="text-sm font-medium tracking-[-0.01em]"
                      encryptedClassName="text-primary"
                      revealedClassName="text-primary"
                      revealDelayMs={40}
                      flipDelayMs={40}
                    />
                    {proj.accent && (
                      <IconArrowUpRight size={14} style={{ color: proj.accent }} className="shrink-0 translate-y-[1px]" />
                    )}
                  </a>
                ) : (
                  <EncryptedText
                    text={proj.name}
                    className="text-sm font-medium tracking-[-0.01em]"
                    encryptedClassName="text-primary opacity-30"
                    revealedClassName="text-primary"
                    revealDelayMs={40}
                    flipDelayMs={40}
                  />
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
