'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { DURATION, FORGE_EASE } from './tokens'

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: FORGE_EASE, duration: DURATION.enter }}>
      {children}
    </MotionConfig>
  )
}
