import { useEffect, useState } from 'react'
import { ApprovalQueue } from './components/approval-queue'
import type { NudgeRequest, Meter } from './types'
import { ArtifactPanel } from '@/components/artifact-panel/ArtifactPanel'
import { ArtifactStudio } from '@/components/artifact-panel/ArtifactStudio'
import { useArtifactPanel } from '@/components/artifact-panel/useArtifactPanel'
import type { OnDockChange } from '@/components/artifact-panel/usePageShift'

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

/** The approval queue as an artifact: inline in its studio, liftable into the
 * panel. First visit opens it docked left, beside the write-up. */
export function ApprovalQueueArtifact({ onDockChange }: { onDockChange?: OnDockChange }) {
  const panel = useArtifactPanel('approval-queue:panel', { defaultDock: 'left' })
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(t)
  }, [])

  return (
    <ArtifactPanel
      panel={panel}
      inlineAspect="13 / 14"
      inlineNote="The approval queue is open in the panel."
      onDockChange={onDockChange}
    >
      <ArtifactStudio framed={!panel.open}>
        {/* The studio is dark, so the queue takes its dark tokens. `m-auto` rather
            than flex centring, so a queue taller than the studio scrolls from its top. */}
        <div className="dark flex h-full w-full overflow-y-auto py-6">
          <div className="m-auto">
            <ApprovalQueue
              requests={agentSpendRequests}
              isLoading={isLoading}
              meter={agentSpendMeter}
              onApprove={() => {}}
              onDeny={() => {}}
              onModify={() => {}}
            />
          </div>
        </div>
      </ArtifactStudio>
    </ArtifactPanel>
  )
}
