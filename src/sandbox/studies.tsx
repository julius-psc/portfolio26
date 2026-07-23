import { useState, useEffect } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { IconArrowUpRight } from '@tabler/icons-react'
import { ApprovalQueue } from './ApprovalQueue/components/approval-queue'
import type { NudgeRequest, Meter } from './ApprovalQueue/types'

export type StudySection = {
  heading?: string
  body?: string
  node?: ReactNode
}

export type Study = {
  id: string
  title: string
  component: ComponentType
  sections: StudySection[]
  previewClassName?: string
}

const agentSpendRequests: NudgeRequest[] = [
  {
    id: 'spend-1',
    requester: 'ops-agent',
    summary: 'to AWS EMEA',
    detail: 'Compute overage for the eu-west-1 batch cluster',
    value: 49.99,
    valuePrefix: '€',
    constraint: { label: 'max_per_tx', limit: 30 },
    requestedAt: new Date(Date.now() - 24000).toISOString(),
  },
  {
    id: 'spend-2',
    requester: 'billing-agent',
    summary: 'to Figma',
    detail: 'Annual seat renewal for the design team workspace',
    value: 89.00,
    valuePrefix: '€',
    constraint: { label: 'max_per_tx', limit: 30 },
    requestedAt: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'spend-3',
    requester: 'coding-agent',
    summary: 'to Anthropic',
    detail: 'API usage overage for the claude-sonnet-4-6 batch jobs',
    value: 25.79,
    valuePrefix: '€',
    constraint: { label: 'max_per_tx', limit: 30 },
    requestedAt: new Date(Date.now() - 120000).toISOString(),
  },
]

const agentSpendMeter: Meter = {
  value: 312.67,
  limit: 1000,
  prefix: '€',
}

function ApprovalQueuePreview() {
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center py-6 overflow-y-auto">
      <ApprovalQueue
        requests={agentSpendRequests}
        isLoading={isLoading}
        meter={agentSpendMeter}
        onApprove={() => {}}
        onDeny={() => {}}
        onModify={() => {}}
      />
    </div>
  )
}

export const studies: Study[] = [
  {
    id: 'approval-queue',
    title: 'Approval Queue',
    previewClassName: 'h-[560px]',
    component: ApprovalQueuePreview,
    sections: [
      {
        heading: 'What it is',
        body: 'Every product that lets something autonomous act needs the same primitive: a moment where a human reviews a proposed action and decides what happens next. Right now, everyone building this starts from scratch. It ends up as a table, a Slack message, or a raw JSON dump in a dashboard nobody checks.\n\nApprovalQueue shows one request open in full detail with the rest collapsed into a stack below. Approve, deny, or modify the active request. Modifying re-validates against the request\'s constraint before allowing approval. Resolving removes the item from the queue and automatically promotes the next one. Each card animates between a fixed collapsed height and its full content in place, no component swap, using asymmetric springs: closes are tighter so the dismissed card gets out of the way fast, opens breathe.',
      },
      {
        heading: 'Why it exists',
        node: (
          <p className="text-sm font-medium text-primary opacity-50 tracking-[-0.01em] leading-[1.65]">
            I am actively building Nudge, a headless React component library for human-in-the-loop interactions, to complement{' '}
            <a
              href="https://shotoku.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 opacity-100 hover:opacity-70 transition-opacity"
            >
              Shotoku<IconArrowUpRight size={12} style={{ color: '#F93743' }} className="translate-y-[1px]" />
            </a>
            , where agents need human sign-off before spending, merging, or sending on your behalf.
          </p>
        ),
      },
    ],
  },
]
