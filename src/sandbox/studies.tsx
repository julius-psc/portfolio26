import type { ComponentType } from 'react'

export type Study = {
  id: string
  title: string
  date: string
  tags: string[]
  component: ComponentType
  study: string
}

export const studies: Study[] = []
