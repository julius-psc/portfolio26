import type { ComponentType } from 'react'
import { ApprovalQueueArtifact } from './ApprovalQueue/ApprovalQueueArtifact'
import type { OnDockChange } from '@/components/artifact-panel/usePageShift'

export type Study = {
  id: string
  /** Component name — shown as `<Title />`. */
  title: string
  /** Renders its own preview (an artifact, with its studio and panel). */
  component: ComponentType<{ onDockChange?: OnDockChange }>
  /** The write-up, one paragraph per entry. */
  body: string[]
}

export const studies: Study[] = [
  {
    id: 'approval-queue',
    title: 'ApprovalQueue',
    component: ApprovalQueueArtifact,
    body: [
      'Anything that lets an agent act on your behalf needs the same moment: a person looks at what the agent wants to do, and decides. Today that moment gets rebuilt from scratch every time, and usually ends up as a table, a Slack message, or raw JSON in a dashboard nobody checks.',
      'ApprovalQueue gives it one shape. The request in front of you is open in full; the rest wait in a collapsed stack below. Approve it, deny it, or modify it, and a modified value is checked against the request\'s constraint before it can go through. Once resolved, the request leaves the queue and the next one opens. The arrow keys move through the stack; A, D and M approve, deny and modify.',
      'Each card grows and shrinks in place, between its collapsed height and its full content, rather than swapping to a different component. The springs are asymmetric: closing is tighter, so a resolved card clears out fast, while opening is looser, so the next request has room to settle.',
    ],
  },
]
