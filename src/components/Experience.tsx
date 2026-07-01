import { IconArrowLoopRight2, IconArrowUpRight } from '@tabler/icons-react'
import { EncryptedText } from '@/components/ui/encrypted-text'

const experiences = [
  {
    company: 'Digeto',
    role: 'Design Engineer',
    period: 'Current',
    accent: '#FA30FF',
    href: 'https://digeto.io',
    description: "Leading design and build on Digeto's GTM Engine: sketching the tier-based client portal from information architecture through to production.",
    highlights: [],
  },
  {
    company: 'XSTREAM',
    role: 'Lead Product Designer',
    period: 'Current',
    accent: null,
    href: null,
    description: 'Leading the design of the MVP: brand identity, design system with a custom three-tier semantic token architecture, component library, user flows, and wireframes through to dev handoff.',
    highlights: [],
  },
  {
    company: 'Chiens en Cavale',
    role: 'Design Engineer',
    period: '2024–2025',
    accent: null,
    href: null,
    description: 'Built a full-stack reservation platform solo for a dog-walking non-profit serving senior and disabled people, from architecture through to production.',
    highlights: [
      '100+ users nationwide.',
      'Secured a €3,000 private grant in recognition of the platform\'s social impact.',
    ],
  },
]

export default function Experience() {
  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex flex-col gap-8 w-full max-w-[520px]">

        <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">[Experience]</span>

        <div className="flex flex-col gap-8">
          {experiences.map((exp) => (
            <div key={exp.company} className="flex flex-col gap-1">

              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-1">
                  {exp.href ? (
                    <a href={exp.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <EncryptedText
                        text={exp.company}
                        className="text-sm font-medium tracking-[-0.01em]"
                        encryptedClassName="text-primary"
                        revealedClassName="text-primary"
                        revealDelayMs={40}
                        flipDelayMs={40}
                      />
                    </a>
                  ) : (
                    <EncryptedText
                      text={exp.company}
                      className="text-sm font-medium tracking-[-0.01em]"
                      encryptedClassName="text-primary"
                      revealedClassName="text-primary"
                      revealDelayMs={40}
                      flipDelayMs={40}
                    />
                  )}
                  {exp.accent && (
                    <IconArrowUpRight size={14} style={{ color: exp.accent }} className="shrink-0 translate-y-[1px]" />
                  )}
                </div>
                <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">{exp.period}</span>
              </div>

              <span className="text-xs font-medium text-primary opacity-40 tracking-[-0.01em]">{exp.role}</span>

              <p className="text-sm font-medium text-primary tracking-[-0.01em] mt-1">
                {exp.description}
              </p>

              {exp.highlights.length > 0 && (
                <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                  {exp.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-1.5 text-xs font-medium text-primary opacity-50 tracking-[-0.01em]">
                      <IconArrowLoopRight2 size={12} className="shrink-0 mt-[2px] scale-y-[-1]" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
