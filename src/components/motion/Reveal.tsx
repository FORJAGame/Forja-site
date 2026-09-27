'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { DURATION, REVEAL_OFFSET } from './tokens'

export const REVEAL_VIEWPORT = { once: true, amount: 0.2 } as const

type RevealProps = { className?: string; delay?: number; children: ReactNode }

export function Reveal({ className, delay = 0, children }: RevealProps) {
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: DURATION.enter, delay }}
    >
      {children}
    </motion.div>
  )
}
